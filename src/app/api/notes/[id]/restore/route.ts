



import client from "@/lib/db";
import { getUserFromToken } from "@/lib/getUserFromToken";
import { NextResponse } from "next/server";

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const user = await getUserFromToken();
  const noteId = params.id.trim();
  
  if (!user) {
    return NextResponse.json({ message: "Login first" }, { status: 401 });
  }


  try {
    // 1. Check if note exists and is deleted
    const noteCheckQuery = `
      SELECT id, folder_id FROM notes 
      WHERE id = $1 AND user_id = $2 AND deleted_at IS NOT NULL
      LIMIT 1
    `;
    const noteResult = await client.query(noteCheckQuery, [noteId, user.id]);

    if (noteResult.rows.length === 0) {
      return NextResponse.json(
        { message: "Note not found or not deleted" }, 
        { status: 404 }
      );
    }

    const folderId = noteResult.rows[0].folder_id;
    let folderRestored = false;

    // 2. If note has a folder, check if it's deleted and restore it
    if (folderId) {
      const folderCheckQuery = `
        SELECT id FROM folders 
        WHERE id = $1 AND user_id = $2 AND deleted_at IS NOT NULL
        LIMIT 1
      `;
      const folderResult = await client.query(folderCheckQuery, [folderId, user.id]);

      if (folderResult.rows.length > 0) {
        const restoreFolderQuery = `
          UPDATE folders
          SET deleted_at = NULL, updated_at = NOW()
          WHERE id = $1 AND user_id = $2
        `;
        await client.query(restoreFolderQuery, [folderId, user.id]);
        folderRestored = true;
      }
    }

    // 3. Restore the note
    //replace * -> id, title, folder_id, created_at, updated_at (if not worked)
    const restoreNoteQuery = `
      UPDATE notes
      SET deleted_at = NULL, updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const restoredNote = await client.query(restoreNoteQuery, [noteId, user.id]);

    return NextResponse.json({ 
      message: "Note restored successfully" + (folderRestored ? " (with folder)" : ""),
      note: restoredNote.rows[0]
    });

  } catch (error) {
    console.error("Error restoring note:", error);
    return NextResponse.json(
      { message: "Server error during restoration" },
      { status: 500 }
    );
  }
}