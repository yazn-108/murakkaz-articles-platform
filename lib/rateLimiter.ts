import { NextRequest } from "next/server";
/**
 * Rate Limiting Library to Prevent Attacks
 */
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}
const store: RateLimitStore = {};
// Clean up expired data
const cleanupExpiredEntries = () => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
};
// Clear all data (for testing use)
export const clearRateLimitStore = () => {
  Object.keys(store).forEach(key => {
    delete store[key];
  });
};
// Clear Rate Limiting data for a specific IP
export const clearRateLimitForIP = (ip: string) => {
  Object.keys(store).forEach(key => {
    if (key.includes(ip)) {
      delete store[key];
    }
  });
};
// View Rate Limiting status (for testing use)
export const getRateLimitStatus = () => {
  const now = Date.now();
  const status: { [key: string]: { count: number; resetTime: number; remaining: number } } = {};
  Object.keys(store).forEach(key => {
    const entry = store[key];
    status[key] = {
      count: entry.count,
      resetTime: entry.resetTime,
      remaining: Math.max(0, Math.ceil((entry.resetTime - now) / 1000))
    };
  });
  return status;
};
// Get the client IP
export const getClientIP = (req: NextRequest): string => {
  return req.headers.get('x-forwarded-for')?.split(',')[0] ||
    req.headers.get('x-real-ip') ||
    'unknown';
};
// Rate Limiter
export const rateLimiter = (options: {
  windowMs: number;
  maxRequests: number;
  message?: string;
}) => {
  const { windowMs, maxRequests, message = 'Too many requests' } = options;
  return (req: NextRequest): { allowed: boolean; message?: string; retryAfter?: number } => {
    const endpoint = req.nextUrl.pathname; const clientIP = getClientIP(req);
    const now = Date.now();
    const key = `${endpoint}:${clientIP}`;
    // Clean up expired data
    cleanupExpiredEntries();
    // Check current limit
    if (!store[key]) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs
      };
      return { allowed: true };
    }
    if (store[key].count >= maxRequests) {
      console.log(store)
      const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
      return {
        allowed: false,
        message,
        retryAfter
      };
    }
    store[key].count++;
    return { allowed: true };
  };
};
export const searchRateLimiter = rateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30, // 30 requests per minute
  message: 'تم تجاوز حد طلبات البحث، حاول مرة أخرى لاحقاً',
});
// Rate Limiter for connection
export const contactRateLimiter = rateLimiter({
  windowMs: 5 * 60 * 1000,
  maxRequests: 10, // 10 requests per minute
  message: 'تم تجاوز حد إرسال الرسائل، حاول مرة أخرى لاحقاً',
});
// Rate Limiter عام
export const generalRateLimiter = rateLimiter({
  windowMs: 1000 * 60 * 15, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
  message: 'تم تجاوز حد الطلبات، حاول مرة أخرى لاحقاً'
});
