
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/jwt'; 


export function middleware(req: NextRequest) {
  const protectedRoutes = ['/dashboard', '/profile']; 
  const { pathname } = req.nextUrl;

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  const token = req.cookies.get('auth')?.value;
  console.log(token);


  const isValid = token && verifyToken(token); 

  if (isProtected && !isValid) {
    const loginUrl = new URL('/auth/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  
  return NextResponse.next();
}
export const config = {
    matcher: ['/dashboard'],
}