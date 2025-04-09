import { cookies } from 'next/headers';
import { verifyToken } from './jwt';

export async function getUserFromToken() {
  const cookieStore = cookies();
  const token = (await cookieStore).get('auth')?.value;


  if (!token) return null;

  const user = await verifyToken(token); 
  return user;
}
