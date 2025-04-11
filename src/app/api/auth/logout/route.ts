


import { NextResponse } from 'next/server';
import { serialize } from 'cookie';
import { cookies } from 'next/headers';

export async function POST() {

  const cookieStore = cookies();
  const authToken = (await cookieStore).get('auth');

  if (!authToken) {
    return NextResponse.json({ message: 'Already logged out or not logged in' }, { status: 400 });
  }

  const serializedCookie = serialize('auth', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: -1,
    path: '/',
  });

  const response = NextResponse.json({ message: 'Logout successful' }, { status: 200 });
  response.headers.set('Set-Cookie', serializedCookie);
  return response;
}


