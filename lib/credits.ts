import clientPromise from "@/lib/mongodb";

const COLLECTION = "userCredits";

export type UserCredit = {
  _id?: string;
  userId: string;
  balance: number; // in dollars (USD)
  createdAt: Date;
  updatedAt: Date;
};

export type CreditTransaction = {
  _id?: string;
  userId: string;
  type: "grant" | "charge" | "refund";
  amount: number;
  description: string;
  generationId?: string;
  createdAt: Date;
};

async function getDb() {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB_NAME || "image-generation");
}

export async function getUserCredits(userId: string): Promise<UserCredit | null> {
  const db = await getDb();
  const credit = await db.collection<UserCredit>(COLLECTION).findOne({ userId });
  return credit;
}

export async function getOrCreateUserCredits(userId: string): Promise<UserCredit> {
  const db = await getDb();
  const existing = await db.collection<UserCredit>(COLLECTION).findOne({ userId });
  if (existing) return existing;

  const newCredit: UserCredit = {
    userId,
    balance: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.collection<UserCredit>(COLLECTION).insertOne(newCredit);
  return { ...newCredit, _id: "" };
}

export async function setUserCredits(userId: string, balance: number, description = "Credit update"): Promise<void> {
  const db = await getDb();
  await db.collection<UserCredit>(COLLECTION).updateOne(
    { userId },
    {
      $set: { balance, updatedAt: new Date() },
      $setOnInsert: { userId, createdAt: new Date() },
    },
    { upsert: true }
  );

  await db.collection<CreditTransaction>("creditTransactions").insertOne({
    userId,
    type: "grant",
    amount: balance,
    description,
    createdAt: new Date(),
  });
}

/**
 * Atomically increments a user's balance and records the transaction, guarded
 * by an idempotency key (e.g. a Stripe Checkout session ID) so retried
 * webhook deliveries can't double-credit the same payment.
 */
export async function addUserCredits(
  userId: string,
  amount: number,
  description: string,
  idempotencyKey?: string
): Promise<{ newBalance: number; alreadyProcessed: boolean }> {
  const db = await getDb();

  if (idempotencyKey) {
    const existing = await db.collection<CreditTransaction>("creditTransactions").findOne({
      userId,
      generationId: idempotencyKey,
    });
    if (existing) {
      const current = await db.collection<UserCredit>(COLLECTION).findOne({ userId });
      return { newBalance: current?.balance ?? 0, alreadyProcessed: true };
    }
  }

  const updated = await db.collection<UserCredit>(COLLECTION).findOneAndUpdate(
    { userId },
    {
      $inc: { balance: amount },
      $set: { updatedAt: new Date() },
      $setOnInsert: { userId, createdAt: new Date() },
    },
    { upsert: true, returnDocument: "after" }
  );

  await db.collection<CreditTransaction>("creditTransactions").insertOne({
    userId,
    type: "grant",
    amount,
    description,
    generationId: idempotencyKey,
    createdAt: new Date(),
  });

  return { newBalance: updated?.balance ?? amount, alreadyProcessed: false };
}

export async function chargeUserCredits(
  userId: string,
  amount: number,
  description: string,
  generationId?: string
): Promise<{ success: boolean; error?: string; newBalance?: number }> {
  const db = await getDb();

  const user = await db.collection<UserCredit>(COLLECTION).findOne({ userId });
  if (!user) {
    return { success: false, error: "No credit account found." };
  }

  if (user.balance < amount) {
    return {
      success: false,
      error: `Insufficient credits. Need $${amount.toFixed(2)} but have $${user.balance.toFixed(2)}.`,
    };
  }

  const newBalance = user.balance - amount;

  await db.collection<UserCredit>(COLLECTION).updateOne(
    { userId },
    { $set: { balance: newBalance, updatedAt: new Date() } }
  );

  await db.collection<CreditTransaction>("creditTransactions").insertOne({
    userId,
    type: "charge",
    amount: -amount,
    description,
    generationId,
    createdAt: new Date(),
  });

  return { success: true, newBalance };
}

export async function getTransactionHistory(
  userId: string,
  limit = 50
): Promise<CreditTransaction[]> {
  const db = await getDb();
  const txns = await db
    .collection<CreditTransaction>("creditTransactions")
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
  return txns;
}

// Pricing constants
export const PRICING = {
  basic: 0.15,    // $0.15 per basic image (nano-banana)
  aplus: 0.90,     // $0.90 per A+ listing image (GPT Image 2)
} as const;
