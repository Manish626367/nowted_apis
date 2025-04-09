import client from "@/lib/db";
import { getUserFromToken } from "@/lib/getUserFromToken";
import { NextResponse } from "next/server";



//--------------------get all notes -----------------//

export async function GET(){

  const user = await getUserFromToken();

  if(!user) return NextResponse.json({message:"login first"},{status:400});

  try {

    const notes = await client.query(
        'select from notes where user_id = $1 and deleted_at is null',[user.id]
    );

    return NextResponse.json({notes:notes.rows},{status:200});
    
  } catch (error) {
    console.log(error);
    return NextResponse.json({message:"server error"},{status:500});
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
    
        await client.query('insert into notes (folder_id, title, content, is_favorite, is_archived) values($1,$2,$3,$4,$5)',[folderId,title,content,is_favorite,is_archived])

        return NextResponse.json({message:"new note created sucessfully"},{status:200});
        
      } catch (error) {
        console.log(error)
        return NextResponse.json({message:"server error"},{status:500})
      }
    
  }
  
  