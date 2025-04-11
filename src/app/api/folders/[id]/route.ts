import { NextResponse } from 'next/server';
import client from '../../../../lib/db';



//------------------------delete folder by id -----------------------------//

export async function DELETE(_req: Request, context: { params: { id: string } }) {

  const folderId = context.params.id;

  const userEmail = _req.headers.get('user-email');


  try {
    
    const folder = await client.query(
      'SELECT * FROM folders WHERE id = $1 AND user_id = (SELECT id FROM users WHERE email = $2)',
      [folderId, userEmail]
    );

    if (folder.rows.length === 0) {
      return NextResponse.json({ message: 'Folder not found or unauthorized' }, { status: 404 });
    }

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
    
    const folder = await client.query(
      'select *from folders where id = $1 and user_id = (select id from users where email = $2) ',[folderId,userEmail]
    );

    if (folder.rows.length === 0) {
      return NextResponse.json({ message: 'Folder not found or unauthorized' }, { status: 404 });
    }

    await client.query('update folders set name = $1 , updated_at = current_timestamp where id = $2',[name,folderId])
    return NextResponse.json({message:"name upadted correctly "},{status:200});
    
  } catch (error) {
    console.log(error)
    return NextResponse.json({message:"server error"},{status:500})
  }

}









