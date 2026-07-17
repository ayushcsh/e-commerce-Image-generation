import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "image-generation");

    const generations = await db
      .collection("generations")
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    // Get first image thumbnail for each generation
    const ids = generations.map((g) => g._id);
    const thumbnails = await db
      .collection("generationImages")
      .aggregate([
        { $match: { generationId: { $in: ids } } },
        { $project: { generationId: 1, createdAt: 1, url: 1, mimeType: 1 } },
        { $sort: { createdAt: 1 } },
        { $group: { _id: "$generationId", firstImage: { $first: "$$ROOT" } } }
      ])
      .toArray();

    const thumbnailMap = new Map(
      thumbnails.map((t) => [t._id.toString(), t.firstImage])
    );

    const result = generations.map((g) => {
      const thumb = thumbnailMap.get(g._id.toString());
      return {
        id: g._id.toString(),
        productName: g.productName,
        category: g.category,
        marketplaces: g.marketplaces,
        createdAt: g.createdAt,
        thumbnail: thumb?.url ?? null,
        thumbnailMimeType: thumb?.mimeType ?? null,
        imageCount: 0, // populated below
      };
    });

    // Count total images per generation
    const counts = await db
      .collection("generationImages")
      .aggregate([
        { $match: { generationId: { $in: ids } } },
        { $group: { _id: "$generationId", count: { $sum: 1 } } }
      ])
      .toArray();

    const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));
    result.forEach((r) => {
      r.imageCount = countMap.get(r.id) ?? 0;
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("History fetch error:", err);
    return NextResponse.json({ error: "Failed to load history." }, { status: 500 });
  }
}
