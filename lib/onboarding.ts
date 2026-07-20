import clientPromise from "@/lib/mongodb";

const COLLECTION = "userOnboarding";

async function getDb() {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB_NAME || "image-generation");
}

export async function getTourCompleted(userId: string): Promise<boolean> {
  const db = await getDb();
  const doc = await db.collection(COLLECTION).findOne({ userId });
  return doc?.tourCompleted === true;
}

export async function setTourCompleted(userId: string, completed: boolean): Promise<void> {
  const db = await getDb();
  await db.collection(COLLECTION).updateOne(
    { userId },
    {
      $set: { tourCompleted: completed, updatedAt: new Date() },
      $setOnInsert: { userId, createdAt: new Date() },
    },
    { upsert: true }
  );
}
