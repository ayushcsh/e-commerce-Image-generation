import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { id } = await params;
  const userId = session.user.id;

  try {
    const { ObjectId } = await import("mongodb");
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "image-generation");

    const generation = await db.collection("generations").findOne({
      _id: new ObjectId(id),
      userId,
    });

    if (!generation) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const images = await db
      .collection("generationImages")
      .find({ generationId: new ObjectId(id) })
      .sort({ createdAt: 1 })
      .toArray();

    return NextResponse.json({
      generation: {
        id: generation._id.toString(),
        productName: generation.productName,
        category: generation.category,
        marketplaces: generation.marketplaces,
        createdAt: generation.createdAt,
      },
      images: images.map((img) => ({
        id: img._id.toString(),
        type: img.type,
        mimeType: img.mimeType,
        url: img.url,
        storageKey: img.storageKey,
      })),
      listings: generation.listings ?? null,
    });
  } catch (err) {
    console.error("Generation load error:", err);
    return NextResponse.json({ error: "Failed to load generation." }, { status: 500 });
  }
}
