import clientPromise from "@/lib/mongodb";

const COLLECTION = "userCredits";

export type UserCredit = {
  _id?: string;
  userId: string;
  balance: number; // integer credits — 1 basic image = 1 credit
  welcomeBonusShown?: boolean;
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
 * Grants the one-time 1-credit welcome bonus for a brand-new account. Safe to
 * call from both the credentials register route and the OAuth createUser
 * event — the upsert only inserts once per userId, so a second call is a
 * no-op and never re-grants or resets an existing balance.
 */
export async function grantWelcomeBonusIfNew(userId: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection<UserCredit>(COLLECTION).updateOne(
    { userId },
    {
      $setOnInsert: {
        userId,
        balance: 1,
        welcomeBonusShown: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );

  const granted = result.upsertedCount > 0;
  if (granted) {
    await db.collection<CreditTransaction>("creditTransactions").insertOne({
      userId,
      type: "grant",
      amount: 1,
      description: "Welcome bonus: 1 free credit",
      createdAt: new Date(),
    });
  }
  return granted;
}

/**
 * Atomically flips welcomeBonusShown from false to true and reports whether
 * this call was the one that flipped it — so the client-side popup fires
 * exactly once, even across reloads or multiple devices.
 */
export async function consumeWelcomePopupFlag(userId: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection<UserCredit>(COLLECTION).findOneAndUpdate(
    { userId, welcomeBonusShown: false },
    { $set: { welcomeBonusShown: true } }
  );
  return !!result;
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

/**
 * Atomically deducts credits, guarded by the balance check in the same
 * update — concurrent charges for the same user can't both read a stale
 * balance and both succeed (the old read-then-write version had exactly
 * that lost-update race).
 */
export async function chargeUserCredits(
  userId: string,
  amount: number,
  description: string,
  generationId?: string
): Promise<{ success: boolean; error?: string; newBalance?: number }> {
  const db = await getDb();

  const updated = await db.collection<UserCredit>(COLLECTION).findOneAndUpdate(
    { userId, balance: { $gte: amount } },
    { $inc: { balance: -amount }, $set: { updatedAt: new Date() } },
    { returnDocument: "after" }
  );

  if (!updated) {
    const current = await db.collection<UserCredit>(COLLECTION).findOne({ userId });
    return {
      success: false,
      error: `Insufficient credits. Need ${amount} but have ${current?.balance ?? 0}.`,
    };
  }

  await db.collection<CreditTransaction>("creditTransactions").insertOne({
    userId,
    type: "charge",
    amount: -amount,
    description,
    generationId,
    createdAt: new Date(),
  });

  return { success: true, newBalance: updated.balance };
}

/**
 * Gives back credits for a charge that didn't ultimately deliver (e.g. the
 * AI provider call failed after credits were already reserved).
 */
export async function refundUserCredits(
  userId: string,
  amount: number,
  description: string,
  generationId?: string
): Promise<void> {
  const db = await getDb();

  await db.collection<UserCredit>(COLLECTION).updateOne(
    { userId },
    { $inc: { balance: amount }, $set: { updatedAt: new Date() } }
  );

  await db.collection<CreditTransaction>("creditTransactions").insertOne({
    userId,
    type: "refund",
    amount,
    description,
    generationId,
    createdAt: new Date(),
  });
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
