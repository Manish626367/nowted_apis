import client from "@/lib/db";
import { getUserFromToken } from "@/lib/getUserFromToken";
import { NextResponse } from "next/server";



//--------------------get all notes -----------------//



// export async function GET(){

//   const user = await getUserFromToken();

//   if(!user) return NextResponse.json({message:"login first"},{status:400});

//   try {

//     const notes = await client.query(
//         'select * from notes where user_id = $1 and deleted_at is null',[user.id]
//     );

//     return NextResponse.json({notes:notes.rows},{status:200});
    
//   } catch (error) {
//     console.log(error);
//     return NextResponse.json({message:"server error"},{status:500});
//   }

// }






// export async function GET(req: Request) {
//   const user = await getUserFromToken();
//   const { searchParams } = new URL(req.url);

//   if (!user) {
//     return NextResponse.json({ message: "Login first" }, { status: 401 });
//   }

//   const limit = parseInt(searchParams.get('limit') || '10', 10);
//   const favorite = searchParams.get('favorite') === 'true';

//   try {
//     const query = `
//       SELECT * FROM notes 
//       WHERE user_id = $1 AND is_favorite = $2 
//       ORDER BY updated_at DESC 
//       LIMIT $3
//     `;

//     const result = await client.query(query, [user.id, favorite, limit]);

//     return NextResponse.json({ notes: result.rows }, { status: 200 });

//   } catch (error) {
//     console.error('DB Error:', error);
//     return NextResponse.json({ message: "Server error" }, { status: 500 });
//   }
// }







export async function GET(req: Request) {
  const user = await getUserFromToken();
  const { searchParams } = new URL(req.url);

  if (!user) {
    return NextResponse.json({ message: "Login first" }, { status: 401 });
  }

  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const favorite = searchParams.get('favorite') === 'true';
  const archive = searchParams.get('archive') === 'true';
  const deleted = searchParams.get('delete') === 'true';
  const folderId = searchParams.get('folderId');
//   const page = parseInt(searchParams.get('page') || '1');
  console.log(folderId)

  try {
    let query = `
      SELECT * FROM notes 
      WHERE user_id = $1
      AND is_favorite = $2
      AND is_archived = $3
      AND deleted_at ${deleted ? "IS NOT NULL" : "IS NULL"}
    `;

    const params: unknown[] = [user.id, favorite, archive];

    if (folderId) {
      query += ` AND folder_id = $${params.length + 1}`;
      params.push(folderId); 
    }

    query += ` ORDER BY updated_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await client.query(query, params);

    return NextResponse.json({ notes: result.rows }, { status: 201 });

  } catch (error) {
    console.error('DB Error:', error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}












//-------- create new note --------


export async function POST(req: Request) {
    const user = await getUserFromToken();
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  
    const { folderId,title,content,is_favorite,is_archived  } = await req.json();

  
    try {
    
        const folder = await client.query(
          'select *from folders where id = $1 and user_id = (select id from users where email = $2) and deleted_at is null',[folderId,user.email]
        );
    
        if (folder.rows.length === 0) {
          return NextResponse.json({ message: 'Folder not found ' }, { status: 404 });
        }
    
        await client.query('insert into notes (folder_id, user_id, title, content, is_favorite, is_archived) values($1,$2,$3,$4,$5,$6)',[folderId,user.id,title,content,is_favorite,is_archived])

        return NextResponse.json({message:"new note created sucessfully"},{status:201});
        
      } catch (error) {
        console.log(error)
        return NextResponse.json({message:"server error"},{status:500})
      }
    
  }
  
  