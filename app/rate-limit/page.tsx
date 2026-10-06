import RateLimitCounter from "./RateLimitCounter";
const RateLimitPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ retryAfter?: string }>;
}) => {
  const params = await searchParams;
  const retryAfter = Number(params.retryAfter ?? 0);
  return <RateLimitCounter retryAfter={retryAfter} />;
};
export default RateLimitPage;
