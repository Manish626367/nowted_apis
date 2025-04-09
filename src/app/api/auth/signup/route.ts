import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import client from '../../../../lib/db'

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
  }

  try {
    const existingUser = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return NextResponse.json({ message: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await client.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
      [name, email, hashedPassword]
    );

    return NextResponse.json(newUser.rows[0], { status: 201 });
  } catch (error) {
    console.log(error);
    
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}