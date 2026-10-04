import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

export default function VerificationsPage() {
  const pending = db
    .prepare(
      `SELECT id, full_name, email, created_at, tasks_completed, community_drives
       FROM users WHERE verification_pending = 1
       ORDER BY created_at ASC`
    )
    .all() as any[];

  async function decide(formData: FormData) {
    'use server';
    const userId = formData.get('user_id') as string;
    const decision = formData.get('decision') as string;

    if (decision === 'approve') {
      db.prepare('UPDATE users SET is_verified = 1, verification_pending = 0 WHERE id = ?').run(userId);
      const nid = `notif-${Date.now()}-a`;
      db.prepare('INSERT INTO notifications (id, user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)')
        .run(nid, userId, 'VERIFIED', '✓ Identity Verified!',
          'Your identity has been verified. Your profile now shows a verified badge!', '/profile');
    } else {
      db.prepare('UPDATE users SET verification_pending = 0 WHERE id = ?').run(userId);
      const nid = `notif-${Date.now()}-b`;
      db.prepare('INSERT INTO notifications (id, user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)')
        .run(nid, userId, 'VERIFY_REJECTED', '⚠️ Verification Update',
          'Your verification request could not be approved. Please contact support.', '/profile');
    }
    revalidatePath('/dashboard/verifications');
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ID Verifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">{pending.length} request{pending.length !== 1 ? 's' : ''} pending</p>
        </div>
      </div>

      {pending.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
          <p className="text-4xl mb-3">✓</p>
          <p className="text-gray-500">No pending verification requests.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-5 py-3.5 font-semibold text-gray-600">User</th>
                <th className="px-5 py-3.5 font-semibold text-gray-600">Email</th>
                <th className="px-5 py-3.5 font-semibold text-gray-600 text-center">Tasks</th>
                <th className="px-5 py-3.5 font-semibold text-gray-600 text-center">Drives</th>
                <th className="px-5 py-3.5 font-semibold text-gray-600 text-center">Joined</th>
                <th className="px-5 py-3.5 font-semibold text-gray-600 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-4 font-semibold text-gray-800">{u.full_name}</td>
                  <td className="px-5 py-4 text-gray-500 text-xs">{u.email}</td>
                  <td className="px-5 py-4 text-center text-gray-700">{u.tasks_completed}</td>
                  <td className="px-5 py-4 text-center text-gray-700">{u.community_drives}</td>
                  <td className="px-5 py-4 text-center text-xs text-gray-400">
                    {new Date(u.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2 justify-center">
                      <form action={decide}>
                        <input type="hidden" name="user_id" value={u.id} />
                        <input type="hidden" name="decision" value="approve" />
                        <button type="submit"
                          className="px-3 py-1.5 bg-teal-700 text-white text-xs font-bold rounded-lg hover:bg-teal-800 transition-colors">
                          ✓ Approve
                        </button>
                      </form>
                      <form action={decide}>
                        <input type="hidden" name="user_id" value={u.id} />
                        <input type="hidden" name="decision" value="reject" />
                        <button type="submit"
                          className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors">
                          ✕ Reject
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
