import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function getAdminStats() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME || "image-generation");

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  const [
    totalUsers,
    newUsersToday,
    newUsersThisWeek,
    creditTxns,
    generationCount,
  ] = await Promise.all([
    db.collection("users").countDocuments(),
    db.collection("users").countDocuments({ createdAt: { $gte: startOfToday } }),
    db.collection("users").countDocuments({ createdAt: { $gte: startOfWeek } }),
    db.collection("creditTransactions").find({ type: "grant" }).toArray(),
    db.collection("generations").countDocuments(),
  ]);

  const totalCreditsPurchased = creditTxns.reduce((sum, t) => sum + t.amount, 0);

  const activeUsersLast7Days = await db
    .collection("generations")
    .distinct("userId", { createdAt: { $gte: startOfWeek } });

  const totalRevenue = creditTxns.reduce(
    (sum, t) => sum + (t.priceInr || 0),
    0
  );

  return {
    totalUsers,
    newUsersToday,
    newUsersThisWeek,
    totalCreditsPurchased,
    totalRevenue,
    totalGenerations: generationCount,
    activeUsersLast7Days: activeUsersLast7Days.length,
  };
}

export async function getTransactions(options: {
  type?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  const { type, startDate, endDate, page = 1, limit = 50 } = options;
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME || "image-generation");

  const filter: Record<string, unknown> = {};
  if (type && type !== "all") filter.type = type;
  if (startDate) filter.createdAt = { ...filter.createdAt as object, $gte: new Date(startDate) };
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filter.createdAt = { ...filter.createdAt as object, $lte: end };
  }

  const [transactions, total] = await Promise.all([
    db
      .collection("creditTransactions")
      .aggregate([
        { $match: filter },
        { $sort: { createdAt: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            type: 1,
            amount: 1,
            description: 1,
            priceInr: 1,
            planId: 1,
            createdAt: 1,
            userEmail: { $ifNull: ["$user.email", "(deleted user)"] },
          },
        },
      ])
      .toArray(),
    db.collection("creditTransactions").countDocuments(filter),
  ]);

  return { transactions, total, pages: Math.ceil(total / limit) };
}

export async function getUsers(options: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  const { search, page = 1, limit = 30 } = options;
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME || "image-generation");

  const filter: Record<string, unknown> = {};
  if (search) {
    filter.email = { $regex: search, $options: "i" };
  }

  const [users, total] = await Promise.all([
    db
      .collection("users")
      .aggregate([
        { $match: filter },
        { $sort: { createdAt: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        {
          $lookup: {
            from: "userCredits",
            localField: "_id",
            foreignField: "userId",
            as: "creditDoc",
          },
        },
        { $unwind: { path: "$creditDoc", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            email: 1,
            emailVerified: 1,
            createdAt: 1,
            balance: { $ifNull: ["$creditDoc.balance", 0] },
            disabled: { $ifNull: ["$disabled", false] },
          },
        },
      ])
      .toArray(),
    db.collection("users").countDocuments(filter),
  ]);

  return { users, total, pages: Math.ceil(total / limit) };
}

export async function grantCreditsByEmail(
  email: string,
  amount: number,
  description: string
) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME || "image-generation");

  const user = await db.collection("users").findOne({ email: email.toLowerCase() });
  if (!user) return { success: false, error: "User not found" };

  const userId = user._id.toString();

  await db.collection("userCredits").updateOne(
    { userId },
    {
      $inc: { balance: amount },
      $set: { updatedAt: new Date() },
    },
    { upsert: true }
  );

  await db.collection("creditTransactions").insertOne({
    userId,
    type: "grant",
    amount,
    description,
    createdAt: new Date(),
  });

  return { success: true, userId };
}

export async function deductCredits(userId: string, amount: number, reason: string) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME || "image-generation");

  const creditDoc = await db.collection("userCredits").findOne({ userId });
  const currentBalance = creditDoc?.balance || 0;

  if (currentBalance < amount) {
    return { success: false, error: "Insufficient balance" };
  }

  await db.collection("userCredits").updateOne(
    { userId },
    {
      $inc: { balance: -amount },
      $set: { updatedAt: new Date() },
    }
  );

  await db.collection("creditTransactions").insertOne({
    userId,
    type: "deduct",
    amount: -amount,
    description: reason,
    createdAt: new Date(),
  });

  return { success: true };
}

export async function disableUser(userId: string, disabled: boolean) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME || "image-generation");

  await db.collection("users").updateOne(
    { _id: new ObjectId(userId) },
    { $set: { disabled } }
  );

  return { success: true };
}
