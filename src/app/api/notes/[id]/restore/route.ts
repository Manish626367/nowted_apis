
// import client from "@/lib/db";
// import { NextResponse } from "next/server";

// export async function PATCH(_req: Request, { params }: { params: { id: string } }) {

//   const noteId = params.id.trim();
//   const userId = _req.headers.get('user-id');
//   const userEmail = _req.headers.get('user-email');
  
//   if (!userId || !userEmail) {
//     return NextResponse.json({ message: "Login first" }, { status: 401 });
//   }

//   try {
//         const restoreFolderQuery = `
//           UPDATE folders
//           SET deleted_at = NULL, updated_at = current_timestamp
//           WHERE id = (select folder_id from notes where id = $1) AND user_id = $2
//         `;
//         await client.query(restoreFolderQuery, [noteId, userId]);

//     const restoreNoteQuery = `
//       UPDATE notes
//       SET deleted_at = NULL, updated_at = current_timestamp
//       WHERE id = $1 AND user_id = $2
//       RETURNING *
//     `;
//     const restoredNote = await client.query(restoreNoteQuery, [noteId, userId]);

//     return NextResponse.json({ 
//       message: "Note restored successfully",
//       note: restoredNote.rows[0]
//     });

//   } catch (error) {
//     console.error("Error restoring note:", error);
//     return NextResponse.json(
//       { message: "Server error during restoration" },
//       { status: 500 }
//     );
//   }
// }






//-------------------------------------------



// import client from "@/lib/db";
// import { NextResponse } from "next/server";

// export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
//   const noteId = params.id.trim();
//   const userId = _req.headers.get('user-id');
//   const userEmail = _req.headers.get('user-email');

//   if (!userId || !userEmail) {
//     return NextResponse.json({ message: "Login first" }, { status: 401 });
//   }

//   let newTitleFromBody = null;
//   try {
//     const body = await _req.json();
//     newTitleFromBody = body.title?.trim();
//   } catch {
//     console.log(" title not available");
    
//   }

//   try {
//     // 1. Get note details (title + folder_id)
//     const noteRes = await client.query(
//       `SELECT title, folder_id FROM notes WHERE id = $1 AND user_id = $2 AND deleted_at IS NOT NULL`,
//       [noteId, userId]
//     );

//     if (noteRes.rows.length === 0) {
//       return NextResponse.json({ message: "Note not found or already active" }, { status: 404 });
//     }

//     let { title: noteTitle, folder_id } = noteRes.rows[0];

//     // 2. Check if the folder is deleted
//     const folderRes = await client.query(
//       `SELECT name FROM folders WHERE id = $1 AND user_id = $2 AND deleted_at IS NOT NULL`,
//       [folder_id, userId]
//     );

//     if (folderRes.rows.length > 0) {
//       const folderName = folderRes.rows[0].name;

//       // 3. Check if active folder with same name exists
//       const duplicateFolder = await client.query(
//         `SELECT id FROM folders WHERE name = $1 AND user_id = $2 AND deleted_at IS NULL`,
//         [folderName, userId]
//       );

//       if (duplicateFolder.rows.length > 0) {
//         // Folder exists, move note to it
//         const existingFolderId = duplicateFolder.rows[0].id;

//         await client.query(`UPDATE notes SET folder_id = $1 WHERE id = $2`, [
//           existingFolderId,
//           noteId,
//         ]);

//         folder_id = existingFolderId; // update folder_id variable
//       } else {
//         // Restore the folder
//         await client.query(
//           `UPDATE folders SET deleted_at = NULL, updated_at = current_timestamp WHERE id = $1 AND user_id = $2`,
//           [folder_id, userId]
//         );
//       }
//     }

//     // 4. Check for duplicate active note in the same folder
//     const duplicateNote = await client.query(
//       `SELECT id FROM notes WHERE title = $1 AND folder_id = $2 AND user_id = $3 AND deleted_at IS NULL`,
//       [noteTitle, folder_id, userId]
//     );

//     if (duplicateNote.rows.length > 0) {
//       // User must provide a new title to resolve duplication
//       if (!newTitleFromBody) {
//         return NextResponse.json({
//           message: "Duplicate note title found. Please provide a new title in the request body as { title: 'Your new title' }"
//         }, { status: 409 });
//       }

//       // Check if provided newTitle also exists
//       const titleExists = await client.query(
//         `SELECT id FROM notes WHERE title = $1 AND folder_id = $2 AND user_id = $3 AND deleted_at IS NULL`,
//         [newTitleFromBody, folder_id, userId]
//       );

//       if (titleExists.rows.length > 0) {
//         return NextResponse.json({
//           message: "The provided title already exists. Please choose a different one."
//         }, { status: 409 });
//       }

//       // Update title with user-provided one
//       noteTitle = newTitleFromBody;
//       await client.query(
//         `UPDATE notes SET title = $1 WHERE id = $2 AND user_id = $3`,
//         [noteTitle, noteId, userId]
//       );
//     }

//     // 5. Finally restore the note
//     const restoreNote = await client.query(
//       `UPDATE notes SET deleted_at = NULL, updated_at = current_timestamp WHERE id = $1 AND user_id = $2 RETURNING *`,
//       [noteId, userId]
//     );

//     return NextResponse.json({
//       message: "Note restored successfully",
//       note: restoreNote.rows[0],
//     });

//   } catch (error) {
//     console.error("Error restoring note:", error);
//     return NextResponse.json(
//       { message: "Server error during restoration" },
//       { status: 500 }
//     );
//   }
// }





//--------------------------------------------------------------------------


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
    // --------------
   
    const result = await client.query(
      `
      SELECT n.title, n.folder_id, f.name AS folder_name, f.deleted_at AS folder_deleted_at
      FROM notes n
      LEFT JOIN folders f ON n.folder_id = f.id AND f.user_id = $2
      WHERE n.id = $1 AND n.user_id = $2 AND n.deleted_at IS NOT NULL
      `,
      [noteId, userId]
    );

    let { title: noteTitle, folder_id} = result.rows[0];
    const { folder_name, folder_deleted_at } = result.rows[0];

    // -----------------
    // jab folder delete ho 

    if (folder_deleted_at) {
     
      // koi dusra folder same naam ka hai kya
      const existingFolder = await client.query(
        `SELECT id FROM folders WHERE name = $1 AND user_id = $2 AND deleted_at IS NULL`,
        [folder_name, userId]
      );

      if (existingFolder.rows.length > 0) {
        // agar same naam ka hai toh folder_id change kar do note ka 
        folder_id = existingFolder.rows[0].id;
        await client.query(`UPDATE notes SET folder_id = $1 WHERE id = $2`, [folder_id, noteId]);
      } else {
        //restore folder
        await client.query(
          `UPDATE folders SET deleted_at = NULL, updated_at = current_timestamp WHERE id = $1 AND user_id = $2`,
          [folder_id, userId]
        );
      }
    }

    // ----- duplicate note hai kya
    const duplicateNote = await client.query(
      `SELECT id FROM notes WHERE title = $1 AND folder_id = $2 AND user_id = $3 AND deleted_at IS NULL`,
      [noteTitle, folder_id, userId]
    );

    if (duplicateNote.rows.length > 0) {

      if (!newTitleFromBody) {
        return NextResponse.json(
          {
            message:
              "Duplicate note title found.enter { title: 'Your new title' }",
          },
          { status: 409 }
        );
      }
      
      // naye title ko match karaya
      const titleExists = await client.query(
        `SELECT id FROM notes WHERE title = $1 AND folder_id = $2 AND user_id = $3 AND deleted_at IS NULL`,
        [newTitleFromBody, folder_id, userId]
      );

      if (titleExists.rows.length > 0) {
        return NextResponse.json(
          { message: "The provided title already exists. Please choose a different one." },
          { status: 409 }
        );
      }

      // Update title with user-provided one
      noteTitle = newTitleFromBody;
      await client.query(
        `UPDATE notes SET title = $1 WHERE id = $2 AND user_id = $3`,
        [noteTitle, noteId, userId]
      );
    }

    // -------- Restore the note -----------
    const restoreNote = await client.query(
      `UPDATE notes SET deleted_at = NULL, updated_at = current_timestamp WHERE id = $1 AND user_id = $2 RETURNING *`,
      [noteId, userId]
    );

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
