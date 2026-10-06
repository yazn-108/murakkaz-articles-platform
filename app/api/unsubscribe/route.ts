import { getColl } from "@/lib/mongodb";
import { unsubscribeRateLimiter } from "@/lib/rateLimiter";
import {
  logSuspiciousActivity,
  sanitizeText
} from "@/lib/security";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
export const POST = async (request: NextRequest) => {
  try {
    // Rate Limiting
    const rateLimit = unsubscribeRateLimiter(request);
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
    const { token } = await request.json();
    // Recording suspicious activities
    logSuspiciousActivity(request, token, '/api/unsubscribe');
    // Clean up the code
    const cleanToken = sanitizeText(token);
    if (!cleanToken) {
      return NextResponse.json({ success: false, message: "رمز الاشتراك مفقود" }, { status: 400 });
    }
    if (typeof cleanToken !== "string" || !ObjectId.isValid(cleanToken)) {
      return NextResponse.json({ success: false, message: "رمز غير صالح" }, { status: 400 });
    }
    const subscriberId = new ObjectId(cleanToken);
    const collection = await getColl({ dbName: "newsletter", collectionName: "emails" });
    const deleted = await collection.deleteOne({ _id: subscriberId });
    if (deleted.deletedCount === 0) {
      return NextResponse.json({ success: false, message: "البريد غير موجود" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "تم إلغاء الاشتراك" });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, message: (error instanceof Error ? error.message : "حدث خطأ غير متوقع") }, { status: 500 });
  }
};
