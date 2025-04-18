import { NextRequest, NextResponse } from 'next/server';
import client from '../../../lib/db';



//-------------------get all folders ----------------------//

export async function GET(request: NextRequest) {
  const userId = request.headers.get('user-id');
  const userEmail = request.headers.get('user-email');

  console.log(userId,userEmail);
  

  if (!userId || !userEmail) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const folders = await client.query(
      'SELECT * FROM folders WHERE user_id = $1 AND deleted_at IS NULL order by updated_at desc',
      [userId] 
    );

    return NextResponse.json({ folders: folders.rows }, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

 

//---- posting the folder -------


export async function POST(req: NextRequest) {

  const userId = req.headers.get('user-id');

  const { name } = await req.json();

  try {
    const existing = await client.query(
      'SELECT id FROM folders WHERE user_id = $1 AND name = $2 AND deleted_at IS NULL',
      [userId, name]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json({ message: 'Folder with this name already exists' }, { status: 400 });
    }


    const result = await client.query(
      'INSERT INTO folders (user_id, name) VALUES ($1, $2) RETURNING *',
      [userId, name]
    );

    return NextResponse.json({ folder: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: 'Error creating folder' }, { status: 500 });
  }
}

