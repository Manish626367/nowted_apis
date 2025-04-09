import { NextResponse } from 'next/server';
import client from '../../../lib/db';
import { getUserFromToken } from '../../../lib/getUserFromToken';


//--------get all folders ------------//

export async function GET() {
  const user = await getUserFromToken();

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const folders = await client.query(
      'SELECT * FROM folders WHERE user_id = $1 AND deleted_at IS NULL',
      [user.id]
    );

    return NextResponse.json({ folders: folders.rows }, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

 

//---- posting the folder -------


export async function POST(req: Request) {
  const user = await getUserFromToken();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { name } = await req.json();

  try {
    const result = await client.query(
      'INSERT INTO folders (user_id, name) VALUES ($1, $2) RETURNING *',
      [user.id, name]
    );

    return NextResponse.json({ folder: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: 'Error creating folder' }, { status: 500 });
  }
}

