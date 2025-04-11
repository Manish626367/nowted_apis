import client from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";



//--------------------get all notes -----------------//

export async function GET(req: NextRequest) {
  
  const userId = req.headers.get('user-id');
  const userEmail = req.headers.get('user-email');
  const { searchParams } = new URL(req.url);

  if (!userId || !userEmail) {
    return NextResponse.json({ message: "Login first" }, { status: 401 });
  }

  const archived = searchParams.get('archived');
  const favorite = searchParams.get('favorite');
  const deleted = searchParams.get('deleted');
  const folderId = searchParams.get('folderId');
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const offset = (page - 1) * limit;

  const conditions = [`notes.user_id = $1`];
  const values: (string | number | boolean)[] = [userId];
  let i = 2;

  if (archived !== null) {
    conditions.push(`notes.is_archived = $${i++}`);
    values.push(archived === 'true');
  }

  if (favorite !== null) {
    conditions.push(`notes.is_favorite = $${i++}`);
    values.push(favorite === 'true');
  }

  if (deleted === 'true') {
    conditions.push(`notes.deleted_at IS NOT NULL`);
  } else {
    conditions.push(`notes.deleted_at IS NULL`);
  }

  if (folderId) {
    conditions.push(`notes.folder_id = $${i++}`);
    values.push(folderId);
  }

  if (search) {
    conditions.push(`(notes.title ILIKE $${i} OR notes.content ILIKE $${i})`);
    values.push(`%${search}%`);
    i++;
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await client.query(
      `
      SELECT 
        notes.id, notes.folder_id, notes.title, notes.content,
        notes.is_favorite, notes.is_archived,
        notes.created_at, notes.updated_at, notes.deleted_at,
        folders.id AS folder_id, folders.name AS folder_name,
        folders.created_at AS folder_created_at,
        folders.updated_at AS folder_updated_at,
        folders.deleted_at AS folder_deleted_at
      FROM notes
      LEFT JOIN folders ON notes.folder_id = folders.id
      ${whereClause}
      ORDER BY notes.updated_at DESC
      LIMIT $${i++} OFFSET $${i}
      `,
      [...values, limit, offset]
    );

    const formattedNotes = result.rows.map((note) => ({
      id: note.id,
      folderId: note.folder_id,
      title: note.title,
      isFavorite: note.is_favorite,
      isArchived: note.is_archived,
      createdAt: note.created_at,
      updatedAt: note.updated_at,
      deletedAt: note.deleted_at,
      content: note.content?.substring(0, 100) || "", 
      folder: {
        id: note.folder_id,
        name: note.folder_name,
        createdAt: note.folder_created_at,
        updatedAt: note.folder_updated_at,
        deletedAt: note.folder_deleted_at,
      }
    }));

    return NextResponse.json({ notes: formattedNotes },{status:201});
  } catch (err) {
    console.error('GET /notes error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}






//-------- create new note --------


export async function POST(req: Request) {

    const userId = req.headers.get('user-id');
    const userEmail = req.headers.get('user-email');
    if (!userId || !userEmail) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  
    const { folderId,title,content,is_favorite,is_archived  } = await req.json();

  
    try {
    
        const folder = await client.query(
          'select *from folders where id = $1 and user_id = (select id from users where email = $2) and deleted_at is null',[folderId,userEmail]
        );
    
        if (folder.rows.length === 0) {
          return NextResponse.json({ message: 'Folder not found ' }, { status: 404 });
        }
    
        await client.query('insert into notes (folder_id, user_id, title, content, is_favorite, is_archived) values($1,$2,$3,$4,$5,$6)',[folderId,userId,title,content,is_favorite,is_archived])
        
        return NextResponse.json({message:"new note created sucessfully"},{status:201});
        
      } catch (error) {
        console.log(error)
        return NextResponse.json({message:"server error"},{status:500})
      }
    
  }
  
  