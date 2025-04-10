import { NextResponse } from "next/server";
import { getUserFromToken } from '../../../../lib/getUserFromToken'
import client from "@/lib/db";


//--------------- get particular note ------------------

export async function GET(_req: Request, context: { params: { id: string } }) {
  const user = await getUserFromToken();
  const noteId = context.params.id;

  if (!user) {
    return NextResponse.json({ message: "Login first" }, { status: 401 });
  }

  try {
    const query = `
      SELECT * FROM notes 
      WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
      LIMIT 1
    `;
    const values = [noteId, user.id];

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ message: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ note: result.rows[0] }, { status: 200 });
  } catch (error) {
    console.error("Error fetching note:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}


// ------------------ update note --------------


export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: "Login first" }, { status: 401 });
    }
  
    const noteId = params.id.trim();
    const body = await req.json();
    const { title, content, folderId } = body;
  
    const updates: string[] = [];
    const values = [];
    let index = 1;
  
    if (title !== undefined) {
      updates.push(`title = $${index++}`);
      values.push(title);
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
      SET ${updates.join(", ")}, updated_at = NOW()
      WHERE id = $${index++} AND user_id = $${index}
      RETURNING *;
    `;
  
    values.push(noteId, user.id);
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
    const user = await getUserFromToken();
  
    if (!user) return NextResponse.json({ message: 'you are not allowed to delete ' }, { status: 401 });
  
    try {
      
   
      
      await client.query('UPDATE notes SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 and user_id = $2', [noteId,user.id]);
  
      return NextResponse.json({ message: 'note deleted successfully' }, { status: 200 });
    } catch (error) {
      console.error('Error deleting note:', error);
      return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
  }
  



