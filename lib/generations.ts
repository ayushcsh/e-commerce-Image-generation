import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

export type GenerationImageRecord = {
  _id: ObjectId;
  generationId: ObjectId;
  type: string;
  mimeType: string;
  /** R2 object key, e.g. "<userId>/<generationId>/basic-0.png" */
  storageKey: string;
  /** R2 public URL for this image */
  url: string;
  /** Whether this was an A+ image (GPT Image 2) vs basic (nano-banana) */
  isAplus: boolean;
  createdAt: Date;
};

export type GenerationRecord = {
  _id: ObjectId;
  userId: string;
  productName: string;
  category: string;
  marketplaces: string[];
  background: string;
  /** AI-generated marketplace listing text (title, bullets, description, etc.), saved alongside the images. */
  listings?: unknown;
  createdAt: Date;
};

async function getDb() {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB_NAME || "image-generation");
}

/** Build the R2 key prefix for a generation batch. */
function buildStoragePrefix(userId: string, generationId: string): string {
  // Pattern: <userId>/<generationId>/
  // Note: "generated-images/" bucket prefix is NOT included here because
  // uploadToR2 / getR2PublicBase() already handles it via R2_PUBLIC_URL.
  return `${userId}/${generationId}`;
}

export async function createGeneration(input: {
  userId: string;
  productName: string;
  category: string;
  marketplaces: string[];
  background: string;
  /** Array of { type, mimeType, storageKey, url, isAplus } — images already uploaded to R2 */
  images: Array<{ type: string; mimeType: string; storageKey: string; url: string; isAplus?: boolean }>;
  listings?: unknown;
}) {
  const db = await getDb();
  const now = new Date();

  const generation: Omit<GenerationRecord, "_id"> = {
    userId: input.userId,
    productName: input.productName,
    category: input.category,
    marketplaces: input.marketplaces,
    background: input.background,
    ...(input.listings ? { listings: input.listings } : {}),
    createdAt: now,
  };

  const { insertedId } = await db
    .collection<Omit<GenerationRecord, "_id">>("generations")
    .insertOne(generation);

  if (input.images.length > 0) {
    const imageDocs: Array<Omit<GenerationImageRecord, "_id">> = input.images.map((image, index) => ({
      generationId: insertedId,
      type: image.type,
      mimeType: image.mimeType,
      storageKey: image.storageKey,
      url: image.url,
      isAplus: image.isAplus ?? false,
      createdAt: now,
    }));

    await db
      .collection<Omit<GenerationImageRecord, "_id">>("generationImages")
      .insertMany(imageDocs);
  }

  return insertedId.toString();
}

/** Attach/replace the saved listing text on an existing generation the user owns. Returns false if not found. */
export async function saveGenerationListings(id: string, userId: string, listings: unknown): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;

  const db = await getDb();
  const result = await db
    .collection<GenerationRecord>("generations")
    .updateOne({ _id: new ObjectId(id), userId }, { $set: { listings } });

  return result.matchedCount > 0;
}

export async function getGenerationForUser(id: string, userId: string) {
  if (!ObjectId.isValid(id)) return null;

  const db = await getDb();
  const generation = await db
    .collection<GenerationRecord>("generations")
    .findOne({ _id: new ObjectId(id), userId });

  if (!generation) return null;

  const images = await db
    .collection<GenerationImageRecord>("generationImages")
    .find({ generationId: generation._id })
    .sort({ createdAt: 1 })
    .toArray();

  return { generation, images };
}
