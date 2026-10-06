import { getColl } from "@/lib/mongodb";
import { tagsRateLimiter } from "@/lib/rateLimiter";
import {
  createSafeQuery,
  logSuspiciousActivity,
  sanitizeInput,
  validateTag
} from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";
export async function GET(request: NextRequest) {
  try {
    // Rate Limiting
    const rateLimit = tagsRateLimiter(request);
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
    const { pathname, searchParams } = new URL(request.url);
    // pagination parameters
    const page = Number.parseInt(searchParams.get("page") || "1");
    const safePage = isNaN(page) || page < 1 ? 1 : page
    const limit = Number.parseInt(searchParams.get("limit") || "10");
    const safeLimit = isNaN(limit) || limit < 1 ? 6 : limit
    const skip = (safePage - 1) * safeLimit;
    // extract tag
    const parts = pathname.split("/");
    const rawTag = parts[parts.length - 1];
    // log suspicious activity
    logSuspiciousActivity(request, rawTag, "/api/tags");
    // validate tag
    if (!rawTag) {
      return NextResponse.json({ error: "Missing tag" }, { status: 400 });
    }
    if (typeof rawTag !== "string") {
      return NextResponse.json({ error: "Invalid tag type" }, { status: 400 });
    }
    const tag = sanitizeInput(rawTag);
    if (!validateTag(tag)) {
      return NextResponse.json({ error: "Invalid tag format" }, { status: 400 });
    }
    const coll = await getColl({
      dbName: "articles-database",
      collectionName: "articles-list",
    });
    if (!coll) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }
    const query = createSafeQuery("tag", tag);
    const articles = await coll
      .find({ SubscribersNotified: { $ne: false }, tag: tag }, {
        projection: {
          title: 1,
          banner: 1,
          createdAt: 1,
          tag: 1,
          description: 1,
          slug: 1,
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .toArray();
    const totalCount = await coll.countDocuments(query);
    const hasMore = skip + safeLimit < totalCount;
    return NextResponse.json(
      {
        articles,
        pagination: {
          page: safePage,
          limit: safeLimit,
          totalCount,
          hasMore,
          totalPages: Math.ceil(totalCount / safeLimit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Tags API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
