import BackupArticles from "@/hooks/BackupArticles";
import IsAdmin from "@/hooks/IsAdmin";
import cloudinary from "@/lib/cloudinary";
import { getColl } from "@/lib/mongodb";
import { generalRateLimiter } from "@/lib/rateLimiter";
import {
  createSafeQuery,
  logSuspiciousActivity,
  sanitizeInput,
  validateSlug
} from "@/lib/security";
import { ArticleTY } from "@/types/Articles";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
export async function GET(request: NextRequest) {
  const session = await IsAdmin();
  if (!session) {
    return NextResponse.json({ error: "غير مسموح" }, { status: 401 });
  }
  try {
    // Rate Limiting
    const rateLimit = generalRateLimiter(request);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: rateLimit.allowed,
          message: rateLimit.message,
          retryAfter: rateLimit.retryAfter
        },
        { status: rateLimit.status }
      );
    }
    const url = new URL(request.url);
    const pathname = url.pathname;
    const parts = pathname.split("/");
    const rawSlug = parts[parts.length - 1];
    // Recording suspicious activities
    logSuspiciousActivity(request, rawSlug, '/api/articles');
    // Check for slug
    if (!rawSlug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }
    // Check the data type
    if (typeof rawSlug !== "string") {
      return NextResponse.json({ error: "Invalid slug type" }, { status: 400 });
    }
    // slug cleaning
    const slug = sanitizeInput(rawSlug);
    // slug validation
    if (!validateSlug(slug)) {
      return NextResponse.json({ error: "Invalid slug format" }, { status: 400 });
    }
    const coll = await getColl({
      dbName: "articles-database",
      collectionName: "articles-list"
    });
    if (!coll) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }
    // Use a safe query
    const article = await coll.findOne({ ...createSafeQuery("slug", slug) });
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    return NextResponse.json(article);
  } catch (error) {
    console.error("Article API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
export async function PUT(request: NextRequest) {
  const session = await IsAdmin();
  if (!session) {
    return NextResponse.json({ error: "غير مسموح" }, { status: 401 });
  }
  try {
    const { updatedArticle, deleteBlocksImageByIds }: { updatedArticle: ArticleTY; deleteBlocksImageByIds?: string[] } = await request.json()
    const { _id, ...safeArticle } = updatedArticle;
    const coll = await getColl({ dbName: "articles-database", collectionName: "articles-list" });
    const updatedArticleData = {
      ...safeArticle,
      createdAt: new Date(updatedArticle.createdAt),
    }
    await coll.updateOne({ _id: new ObjectId(_id) },
      {
        $set: updatedArticleData
      });
    if (deleteBlocksImageByIds && deleteBlocksImageByIds.length > 0) {
      await cloudinary.api.delete_resources(deleteBlocksImageByIds);
    }
    await BackupArticles({
      event_type: "article.updated", client_payload: {
        _id,
        ...updatedArticleData
      }
    });
    return NextResponse.json({ message: "تم حفظ التعديلات" });
  } catch (error) {
    console.error("Article API Error:", error);
    return NextResponse.json({ error: "لم يتم حفظ التعديلات" }, { status: 500 });
  }
}
export async function DELETE(request: NextRequest) {
  const session = await IsAdmin();
  if (!session) {
    return NextResponse.json({ error: "غير مسموح" }, { status: 401 });
  }
  try {
    const { _id, public_ids_of_images }: { _id: string; public_ids_of_images: string[] } = await request.json()
    const coll = await getColl({ dbName: "articles-database", collectionName: "articles-list" });
    await coll.deleteOne({ _id: new ObjectId(_id) });
    await cloudinary.api.delete_resources(public_ids_of_images)
    await BackupArticles({
      event_type: "article.deleted", client_payload: { articleId: _id }
    });
    return NextResponse.json({ message: "Article and associated images deleted successfully" });
  } catch (error) {
    console.error("Article API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}