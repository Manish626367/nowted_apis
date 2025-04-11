

import client from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {


  const userId = req.headers.get('user-id');
  const userEmail = req.headers.get('user-email');

  if (!userId || !userEmail) {
    return NextResponse.json({ message: "Login first" }, { status: 401 });
  }
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
      WHERE notes.user_id = $1 AND notes.deleted_at IS NULL
      ORDER BY notes.updated_at DESC
      LIMIT 3
      `,
      [userId]
    );
  
    const recentNotes = result.rows.map((note) => ({
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

    return NextResponse.json({ recentNotes: recentNotes });
  } catch (err) {
    console.error('GET /api/notes/recent error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
