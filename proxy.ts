import { chain, FinalNextResponse } from '@nimpl/proxy-chain';
import { getServerSession } from 'next-auth';
import { NextResponse, type NextRequest } from 'next/server';
import { authOptions } from './app/api/auth/[...nextauth]/route';
import { generalRateLimiter } from './lib/rateLimiter';
const rateLimitProxy = async (request: NextRequest) => {
  const result = generalRateLimiter(request);
  if (!result.allowed) {
    const url = new URL('/rate-limit', request.url);
    url.searchParams.set(
      'retryAfter',
      String(result.retryAfter)
    );
    return FinalNextResponse.rewrite(url);
  }
  return NextResponse.next();
};
const authProxy = async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session) {
    return FinalNextResponse.redirect(
      new URL('/api/auth/signin', request.url)
    );
  }
  if (session.user.id.toString() !== process.env.ADMIN_ID) {
    return FinalNextResponse.redirect(
      new URL('/', request.url)
    );
  }
  return NextResponse.next();
};
const rateLimitRedirect = async (request: NextRequest) => {
  const path = request.nextUrl.pathname;
  if (path === "/rate-limit") {
    return FinalNextResponse.redirect(
      new URL('/', request.url)
    );
  }
  return NextResponse.next();
};
export default chain([
  rateLimitProxy,
  [
    authProxy,
    {
      include: /^\/(dashboard|api\/admin)(\/.*)?$/,
    },
  ],
  [
    rateLimitRedirect,
    {
      include: /^\/rate-limit(\/.*)?$/,
    },
  ],
]);
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};