import { getColl } from "@/lib/mongodb";
import { articleRateLimiter } from "@/lib/rateLimiter";
import { createSafeQuery, logSuspiciousActivity, sanitizeInput, validateSlug } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";
export async function GET(request: NextRequest) {
  try {
    // Rate Limiting
    const rateLimit = articleRateLimiter(request);
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
    const article = await coll.findOne({ ...createSafeQuery("slug", slug), SubscribersNotified: true });
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    return NextResponse.json(article);
  } catch (error) {
    console.error("Article API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
