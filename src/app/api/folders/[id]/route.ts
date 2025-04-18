import { NextResponse } from 'next/server';
import client from '../../../../lib/db';



//------------------------delete folder by id -----------------------------//

export async function DELETE(_req: Request, context: { params: { id: string } }) {

  const folderId = context.params.id;

  try {

    await client.query('update folders SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1', [folderId]);
    await client.query('update notes set deleted_at = current_timestamp where folder_id = $1',[folderId])

    return NextResponse.json({ message: 'Folder deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting folder:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}



//-----------chnage folder name --------------------//-


export async function PATCH(req: Request, context: { params: { id: string } }){

  const folderId = context.params.id;

    const userId = req.headers.get('user-id');
    const userEmail = req.headers.get('user-email');

  const {name} = await req.json()

  if(!userId || !userEmail) return NextResponse.json({message:"you are not allowed to update "},{status:404})

  try {
   
    const existing = await client.query(
      `SELECT * FROM folders WHERE user_id = $1 AND name = $2 AND deleted_at IS NULL`,
      [userId, name]
    );

   
    if (existing.rows.length > 0) {
      return NextResponse.json({ message: 'Folder with this name already exists' }, { status: 400 });
    }

    await client.query('update folders set name = $1 , updated_at = current_timestamp where id = $2',[name,folderId])

    return NextResponse.json({message:"name upadted correctly "},{status:200});
    
  } catch (error) {
    console.log(error)
    return NextResponse.json({message:"server error"},{status:500})
  }

}









