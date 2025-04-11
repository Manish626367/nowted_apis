import { NextResponse } from "next/server";
import client from "@/lib/db";


//--------------- get particular note ------------------



export async function GET(_req: Request, {params}: { params: { id: string } }) {
  
  const userId = _req.headers.get('user-id');
  const userEmail = _req.headers.get('user-email');

  
  const noteId = params.id.trim();


  if (!userId || !userEmail) {
    return NextResponse.json({ message: "Login first" }, { status: 401 });
  }
  

  try {
    const query = `
      SELECT 
        notes.id, notes.folder_id, notes.title, notes.content,
        notes.is_favorite, notes.is_archived,
        notes.created_at, notes.updated_at, notes.deleted_at,
        folders.name AS folder_name,
        folders.created_at AS folder_created_at,
        folders.updated_at AS folder_updated_at,
        folders.deleted_at AS folder_deleted_at
      FROM notes
      LEFT JOIN folders ON notes.folder_id = folders.id
      WHERE notes.id = $1 AND notes.user_id = $2 AND notes.deleted_at IS NULL
      LIMIT 1
    `;
    const values = [noteId, userId];


    const result = await client.query(query, values);
    

    if (result.rows.length === 0) {
      return NextResponse.json({ message: "Note not found" }, { status: 404 });
    }

    const note = result.rows[0];


    const formattedNote = {
      id: note.id,
      folderId: note.folder_id,
      title: note.title,
      isFavorite: note.is_favorite,
      isArchived: note.is_archived,
      createdAt: note.created_at,
      updatedAt: note.updated_at,
      deletedAt: note.deleted_at,
      preview: note.content?.substring(0, 100) || "",
      content: note.content || "",
      folder: {
        id: note.folder_id,
        name: note.folder_name,
        createdAt: note.folder_created_at,
        updatedAt: note.folder_updated_at,
        deletedAt: note.folder_deleted_at,
      },
    };
   
    return NextResponse.json({ note: formattedNote }, { status: 200 });
  } catch (error) {
    console.error("Error fetching note:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}





// ------------------ update note --------------


export async function PATCH(req: Request, { params }: { params: { id: string } }) {
   
    const userId = req.headers.get('user-id');
    const userEmail = req.headers.get('user-email');
    
    if (!userId || !userEmail) {
      return NextResponse.json({ error: "Login first" }, { status: 401 });
    }
  
    const noteId = params.id.trim();
    const body = await req.json();
    const { title, content, folderId ,is_archived,is_favorite} = body;
  
    const updates: string[] = [];
    const values = [];
    let index = 1;
  
    if (title !== undefined) {
      updates.push(`title = $${index++}`);
      values.push(title);
    }

    if(is_archived !== undefined){
      updates.push(`is_archived = $${index++}`);
      values.push(is_archived);
    }
    if(is_favorite !== undefined){
      updates.push(`is_favorite = $${index++}`);
      values.push(is_favorite);
    }
    
    if (content !== undefined) {
      updates.push(`content = $${index++}`);
      values.push(content);
    }
  
    if (folderId !== undefined) {
      updates.push(`folder_id = $${index++}`);
      values.push(folderId);
    }
  
    if (updates.length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }
  
    const query = `
      UPDATE notes 
      SET ${updates.join(", ")}, updated_at = current_timestamp
      WHERE id = $${index++} AND user_id = $${index}
      RETURNING *;
    `;
  
    values.push(noteId, userId);
    console.log("QUERY:", query.trim());
    console.log("VALUES:", values);
  
    try {
      const result = await client.query(query, values);
      console.log(result)
     
  
      if (result.rowCount === 0) {
        return NextResponse.json({ error: "Note not found or unauthorized" }, { status: 404 });
      }
  
      return NextResponse.json({ message: "Note updated successfully", note: result.rows[0] });
    } catch (error) {
      console.error("Update failed:", error);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  }
  


  //------------------ delete particular note ---------------------



  
export async function DELETE(_req: Request, context: { params: { id: string } }) {

    const noteId = context.params.id.trim();
   
    const userId = _req.headers.get('user-id');
    const userEmail = _req.headers.get('user-email');
  
    if (!userId || !userEmail) return NextResponse.json({ message: 'you are not allowed to delete ' }, { status: 401 });
  
    try {
      
   
      
      await client.query('UPDATE notes SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 and user_id = $2', [noteId,userId]);
  
      return NextResponse.json({ message: 'note deleted successfully' }, { status: 200 });
    } catch (error) {
      console.error('Error deleting note:', error);
      return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
  }
  




 
