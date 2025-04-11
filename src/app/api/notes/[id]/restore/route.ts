

import client from "@/lib/db";
import { NextResponse } from "next/server";


export async function PATCH(_req: Request, { params }: { params: { id: string } }) {

  const noteId = params.id.trim();
  const userId = _req.headers.get('user-id');
  const userEmail = _req.headers.get('user-email');
  
  if (!userId || !userEmail) {
    return NextResponse.json({ message: "Login first" }, { status: 401 });
  }


  try {
    // 1. Check if there note exists and is deleted
    const noteCheckQuery = `
      SELECT id, folder_id FROM notes 
      WHERE id = $1 AND user_id = $2 AND deleted_at IS NOT NULL
      LIMIT 1
    `;
    const noteResult = await client.query(noteCheckQuery, [noteId, userId]);

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
      const folderResult = await client.query(folderCheckQuery, [folderId, userId]);

      if (folderResult.rows.length > 0) {
        const restoreFolderQuery = `
          UPDATE folders
          SET deleted_at = NULL, updated_at = NOW()
          WHERE id = $1 AND user_id = $2
        `;
        await client.query(restoreFolderQuery, [folderId, userId]);
        folderRestored = true;
      }
    }

    // 3. Restore the note

    const restoreNoteQuery = `
      UPDATE notes
      SET deleted_at = NULL, updated_at = current_timestamp
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const restoredNote = await client.query(restoreNoteQuery, [noteId, userId]);

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