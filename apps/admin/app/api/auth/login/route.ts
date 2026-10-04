import { cookies } from 'next/headers';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json({ error: 'Missing credentials' }, { status: 400 });
    }

    const admin = db.prepare('SELECT * FROM admin_users WHERE email = ?').get(email) as any;
    if (!admin) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const valid = bcrypt.compareSync(password, admin.password_hash);
    if (!valid) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set('admin_access_token', admin.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Admin login error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
