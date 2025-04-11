
// import { NextResponse } from 'next/server';
// import type { NextRequest } from 'next/server';
// import { verifyToken } from './lib/jwt'; 


// export function middleware(req: NextRequest) {
//   const protectedRoutes = ['/dashboard', '/profile']; 
//   const { pathname } = req.nextUrl;

//   const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

//   const token = req.cookies.get('auth')?.value;
//   console.log(token);


//   const isValid = token && verifyToken(token); 

//   if (isProtected && !isValid) {
//     const loginUrl = new URL('/auth/login', req.url);
//     return NextResponse.redirect(loginUrl);
//   }

  
//   return NextResponse.next();
// }
// export const config = {
//     matcher: ['/dashboard'],
// }



//------------ -----------------------


// import { NextResponse } from 'next/server';
// import type { NextRequest } from 'next/server';
// import { verifyToken } from './lib/jwt'; 


// export async function middleware(req: NextRequest) {
//   const protectedRoutes = ['/api/folders', '/api/notes']; 
//   const { pathname } = req.nextUrl;

//   const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

//   const token  = req.cookies.get('auth')?.value;

//   console.log("token ==> "+token);

//   const user = await  verifyToken(token); 

//   console.log("user ---> ",user);
  
//   const isValid = token && user
//   console.log("isValid ==> "+!isValid);
  

//   if (isProtected && !isValid) {
//     const loginUrl = new URL('/api/auth/login', req.url);
//     return NextResponse.redirect(loginUrl);
//   }

//   const response = NextResponse.next();
//   response.headers.set('x-user-id', user.id);
//   response.headers.set('x-user-email', user.email);
//   return response;

//   return NextResponse.next();
// }
// export const config = {
//     matcher: ['/api/folders/:path*', '/notes/:path*'],
// }



//----------------------------------------------


import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
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
    const loginUrl = new URL('/api/auth/login', req.url);
    return NextResponse.redirect(loginUrl);
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
