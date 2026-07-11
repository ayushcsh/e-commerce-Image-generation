import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

export type GenerationImageRecord = {
  _id: ObjectId;
  generationId: ObjectId;
  type: string;
  mimeType: string;
  data: string;
  createdAt: Date;
};

export type GenerationRecord = {
  _id: ObjectId;
  userId: string;
  productName: string;
  category: string;
  marketplaces: string[];
  background: string;
  createdAt: Date;
};

async function getDb() {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB_NAME || "image-generation");
}

export async function createGeneration(input: {
  userId: string;
  productName: string;
  category: string;
  marketplaces: string[];
  background: string;
  images: Array<{ type: string; mimeType: string; data: string }>;
}) {
  const db = await getDb();
  const now = new Date();

  const generation: Omit<GenerationRecord, "_id"> = {
    userId: input.userId,
    productName: input.productName,
    category: input.category,
    marketplaces: input.marketplaces,
    background: input.background,
    createdAt: now
  };

  const { insertedId } = await db.collection<Omit<GenerationRecord, "_id">>("generations").insertOne(generation);

  if (input.images.length > 0) {
    const imageDocs: Array<Omit<GenerationImageRecord, "_id">> = input.images.map((image) => ({
      generationId: insertedId,
      type: image.type,
      mimeType: image.mimeType,
      data: image.data,
      createdAt: now
    }));

    await db.collection<Omit<GenerationImageRecord, "_id">>("generationImages").insertMany(imageDocs);
  }

  return insertedId.toString();
}

export async function getGenerationForUser(id: string, userId: string) {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  const db = await getDb();
  const generation = await db
    .collection<GenerationRecord>("generations")
    .findOne({ _id: new ObjectId(id), userId });

  if (!generation) {
    return null;
  }

  const images = await db
    .collection<GenerationImageRecord>("generationImages")
    .find({ generationId: generation._id })
    .sort({ createdAt: 1 })
    .toArray();

  return { generation, images };
}
