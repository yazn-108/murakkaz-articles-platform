"use client";
import { useEffect, useState } from "react";
const RateLimitCounter = ({
  retryAfter: initialRetryAfter,
}: {
  retryAfter: number;
}) => {
  const [retryAfter, setRetryAfter] = useState(initialRetryAfter);
  useEffect(() => {
    if (retryAfter <= 0) return;
    const interval = setInterval(() => {
      setRetryAfter((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [retryAfter]);
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <p className="text-7xl font-bold">429</p>
        <h1 className="mt-6 text-2xl font-semibold">طلبات كثيرة جدًا</h1>
        <p className="mt-3 text-muted-foreground">
          لقد تجاوزت الحد المسموح من الطلبات. يرجى الانتظار قليلًا ثم المحاولة
          مرة أخرى.
        </p>
        <button
          disabled={retryAfter > 0}
          onClick={() => window.location.reload()}
          className="mt-6 rounded-md bg-primary px-5 py-2.5 text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          {retryAfter > 0
            ? `حاول مرة أخرى بعد ${retryAfter} ثانية`
            : "حاول مرة أخرى"}
        </button>
      </div>
    </main>
  );
};
export default RateLimitCounter;
