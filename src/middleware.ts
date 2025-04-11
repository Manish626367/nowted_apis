
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { verifyToken } from './lib/jwt';

export async function middleware(req: NextRequest) {

  const protectedRoutes = ['/api/folders', '/api/notes'];
  const { pathname } = req.nextUrl;

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  const token = req.cookies.get('auth')?.value;

  let user = null;
  if (token) {
    try {
      user = await verifyToken(token);
    } catch (error) {
      console.error("Token verification failed:", error);
    }
  }

  const isValid = Boolean(token && user);

  if (isProtected && !isValid) {
    return NextResponse.json({message:"login first"},{status:404})
  }

  const response = NextResponse.next();

  if (user) {
    response.headers.set('user-id', user.id);
    response.headers.set('user-email', user.email);
  }

  return response;
}

export const config = {
  matcher: ['/api/folders/:path*', '/api/notes/:path*'], 
};
