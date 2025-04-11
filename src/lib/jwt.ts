

import { SignJWT, jwtVerify } from 'jose';

const SECRET_KEY = process.env.JWT_SECRET || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

// Convert the string secret into a Uint8Array (required by jose)
const encoder = new TextEncoder();
const secret = encoder.encode(SECRET_KEY);

export interface JwtPayload {
  id: string;
  email: string;
}

// Sign a token
export const signToken = async (payload: JwtPayload): Promise<string> => {
  return await new SignJWT({
    id: payload.id,
    email: payload.email,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(secret);
};

// Verify a token
export const verifyToken = async (token: string): Promise<JwtPayload | null> => {
  try {
    const { payload } = await jwtVerify(token, secret);


    if (
      typeof payload.email === 'string' &&
      typeof payload.id === 'string'
    ) {
      return {
        id: payload.id,
        email: payload.email,
      };
    }
    return null;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
};
