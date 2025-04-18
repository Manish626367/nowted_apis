

import client from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const noteId = params.id.trim();
  const userId = _req.headers.get("user-id");
  const userEmail = _req.headers.get("user-email");

  if (!userId || !userEmail) {
    return NextResponse.json({ message: "Login first" }, { status: 401 });
  }

  let newTitleFromBody = null;
  try {
    const body = await _req.json();
    newTitleFromBody = body.title?.trim();
  } catch {
    console.log("Title not available from request body.");
  }

  try {
    // Get current note and folder info
    const result = await client.query(
      `
      SELECT n.title, n.folder_id, f.name AS folder_name, f.deleted_at AS folder_deleted_at
      FROM notes n
      INNER JOIN folders f ON n.folder_id = f.id AND f.user_id = $2
      WHERE n.id = $1 AND n.user_id = $2 AND n.deleted_at IS NOT NULL
      `,
      [noteId, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ message: "Note not found" }, { status: 404 });
    }

    
    const { title: noteTitle,folder_name, folder_deleted_at } = result.rows[0];
    let {  folder_id } = result.rows[0];
    const folderIdForCheck = folder_id;


    // If folder is deleted then find another folder with same name or restore the same one
    if (folder_deleted_at) {
      const existingFolder = await client.query(
        `SELECT id FROM folders WHERE name = $1 AND user_id = $2 AND deleted_at IS NULL`,
        [folder_name, userId]
      );
      
      // if folder with same name exist then change folderId or restore deleted one
      if (existingFolder.rows.length > 0) {
        folder_id = existingFolder.rows[0].id;
      } else {
        await client.query(
          `UPDATE folders SET deleted_at = NULL, updated_at = current_timestamp WHERE id = $1 AND user_id = $2`,
          [folder_id, userId]
        );
      }
    }

    // Check for title conflict (ignore current note)
    const titleToCheck = newTitleFromBody || noteTitle;

    const titleConflict = await client.query(
      `SELECT id FROM notes WHERE title = $1 AND folder_id = $2 AND user_id = $3 AND deleted_at IS NULL AND id != $4`,
      [titleToCheck, folder_id, userId, noteId]
    );

    if (titleConflict.rows.length > 0) {
      return NextResponse.json(
        { message: "The provided title already exists. Please choose a different one." },
        { status: 409 }
      );
    }

    // If title changed and no conflict, update title
    if (newTitleFromBody && newTitleFromBody !== noteTitle) {
      await client.query(
        `UPDATE notes SET title = $1, updated_at = current_timestamp WHERE id = $2 AND user_id = $3`,
        [newTitleFromBody, noteId, userId]
      );
    }

    // Restore the note (and update folder if needed) 
    const restoreQuery =
      folderIdForCheck !== folder_id
        ? `UPDATE notes SET deleted_at = NULL, folder_id = $1, updated_at = current_timestamp WHERE id = $2 AND user_id = $3 `
        : `UPDATE notes SET deleted_at = NULL, updated_at = current_timestamp WHERE id = $1 AND user_id = $2 `;

    const restoreValues = folderIdForCheck !== folder_id ? [folder_id, noteId, userId] : [noteId, userId];

    const restoreNote = await client.query(restoreQuery, restoreValues);

    return NextResponse.json({
      message: "Note restored successfully",
      note: restoreNote.rows[0],
    });
  } catch (error) {
    console.error("Error restoring note:", error);
    return NextResponse.json(
      { message: "Server error during restoration" },
      { status: 500 }
    );
  }
}
