import { cookies } from 'next/headers';
import db from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_access_token')?.value;
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: userId } = await params;
  const { decision } = await request.json(); // 'approve' | 'reject'

  if (decision === 'approve') {
    db.prepare('UPDATE users SET is_verified = 1, verification_pending = 0 WHERE id = ?').run(userId);
    const notifId = `notif-${Date.now()}`;
    db.prepare('INSERT INTO notifications (id, user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)')
      .run(notifId, userId, 'VERIFIED', '✓ Identity Verified!',
        'Your identity has been verified by SAVJ. Your profile now shows a verified badge!', '/profile');
  } else {
    db.prepare('UPDATE users SET verification_pending = 0 WHERE id = ?').run(userId);
    const notifId = `notif-${Date.now()}`;
    db.prepare('INSERT INTO notifications (id, user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)')
      .run(notifId, userId, 'VERIFY_REJECTED', '⚠️ Verification Update',
        'Your verification request could not be approved at this time. Please contact support.', '/profile');
  }

  return Response.json({ success: true });
}
