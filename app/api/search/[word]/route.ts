import { getColl } from "@/lib/mongodb";
import { searchRateLimiter } from "@/lib/rateLimiter";
import {
  logSuspiciousActivity,
  sanitizeSearchQuery,
  validateSearchQuery
} from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";
export async function GET(req: NextRequest) {
  try {
    // =========================
    // 1. Rate Limiting
    // =========================
    const rateLimit = searchRateLimiter(req);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: rateLimit.message,
          retryAfter: rateLimit.retryAfter,
        },
        { status: 429 }
      );
    }
    // =========================
    // 2. Extract query
    // =========================
    const url = new URL(req.url);
    const rawQuery =
      decodeURIComponent(url.pathname.split("/").pop() || "");
    // Log suspicious activity
    logSuspiciousActivity(req, rawQuery, "/api/search");
    // =========================
    // 3. Validation
    // =========================
    if (!validateSearchQuery(rawQuery)) {
      return NextResponse.json(
        { success: false, message: "استعلام غير صالح" },
        { status: 400 }
      );
    }
    const query = sanitizeSearchQuery(rawQuery);
    if (!query) {
      return NextResponse.json(
        { success: false, message: "استعلام فارغ" },
        { status: 400 }
      );
    }
    // =========================
    // 4. DB
    // =========================
    const collection = await getColl({
      dbName: "articles-database",
      collectionName: "articles-list",
    });
    if (!collection) {
      return NextResponse.json(
        { success: false, message: "DB error" },
        { status: 500 }
      );
    }
    // =========================
    // 5. Pagination
    // =========================
    const page = Number(url.searchParams.get("page") || 1);
    const limit = 50;
    // =========================
    // 6. Atlas Search
    // =========================
    const results = await collection.aggregate([
      {
        $search: {
          index: "default",
          compound: {
            should: [
              {
                autocomplete: {
                  query,
                  path: "title",
                  fuzzy: {
                    maxEdits: 1
                  }
                }
              },
              {
                autocomplete: {
                  query,
                  path: "description"
                }
              },
              {
                autocomplete: {
                  query,
                  path: "blocks.content"
                }
              }
            ],
            minimumShouldMatch: 1,
            filter: [
              {
                equals: {
                  path: "SubscribersNotified",
                  value: true
                }
              }
            ]
          }
        }
      },
      {
        $addFields: {
          score: { $meta: "searchScore" }
        }
      },
      {
        $sort: {
          hasContentMatch: -1,
          score: -1
        }
      },
      {
        $skip: (page - 1) * limit
      },
      {
        $limit: limit
      },
      {
        $project: {
          title: 1,
          slug: 1,
          tags: 1,
          createdAt: 1,
          description: 1,
          blocks: 1,
          score: 1
        }
      }
    ]).toArray();
    // =========================
    // 9. Response
    // =========================
    return NextResponse.json({
      success: true,
      query,
      page,
      count: results.length,
      articles: results,
    });
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Search failed",
      },
      { status: 500 }
    );
  }
}