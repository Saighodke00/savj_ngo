import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

export default async function BroadcastPage({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const { sent } = await searchParams;

  const history = db.prepare(
    `SELECT title, message, created_at
     FROM notifications
     WHERE type='BROADCAST'
     GROUP BY title, created_at
     ORDER BY created_at DESC LIMIT 8`
  ).all() as any[];

  const totalUsers = (db.prepare('SELECT COUNT(*) as c FROM users WHERE is_suspended=0').get() as any).c;

  async function sendBroadcast(formData: FormData) {
    'use server';
    const title   = (formData.get('title') as string)?.trim();
    const message = (formData.get('message') as string)?.trim();
    const target  = formData.get('target') as string;
    if (!title || !message) return;

    let userIds: string[] = [];
    if (target === 'all') {
      userIds = (db.prepare('SELECT id FROM users WHERE is_suspended=0').all() as any[]).map(u => u.id);
    } else if (target === 'workers') {
      userIds = (db.prepare("SELECT DISTINCT worker_id as id FROM tasks WHERE worker_id IS NOT NULL").all() as any[]).map(u => u.id);
    } else if (target === 'creators') {
      userIds = (db.prepare('SELECT DISTINCT creator_id as id FROM tasks').all() as any[]).map(u => u.id);
    } else if (target === 'suspended') {
      userIds = (db.prepare('SELECT id FROM users WHERE is_suspended=1').all() as any[]).map(u => u.id);
    }

    const ts = Date.now();
    const insert = db.prepare('INSERT INTO notifications (id,user_id,type,title,message,link) VALUES (?,?,?,?,?,?)');
    const batch = db.transaction((ids: string[]) => {
      ids.forEach((uid, i) => insert.run(`broadcast-${ts}-${i}`, uid, 'BROADCAST', title, message, null));
    });
    batch(userIds);

    const { redirect } = await import('next/navigation');
    redirect(`/dashboard/broadcast?sent=${userIds.length}`);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Broadcast Notifications</h1>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>Send messages to users on the platform</p>
      </div>

      {/* Success banner */}
      {sent && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-2xl"
          style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}>
          <span className="text-xl">✅</span>
          <div>
            <p className="font-semibold text-white">Broadcast sent!</p>
            <p className="text-sm" style={{ color: '#22c55e' }}>{sent} users notified.</p>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="rounded-2xl p-6" style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 className="text-base font-semibold text-white mb-5">New Broadcast</h2>
        <form action={sendBroadcast} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Notification Title</label>
            <input name="title" type="text" required placeholder="e.g. Platform Update"
              className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
              style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Message</label>
            <textarea name="message" rows={4} required placeholder="Write your message here…"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
              style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Target Audience</label>
            <select name="target"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}>
              <option value="all">All Active Users ({totalUsers})</option>
              <option value="workers">Workers only</option>
              <option value="creators">Task Creators only</option>
              <option value="suspended">Suspended Users</option>
            </select>
          </div>
          <button type="submit"
            className="px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #00796B, #00897B)', boxShadow: '0 4px 20px rgba(0,121,107,0.3)' }}>
            📢 Send Broadcast
          </button>
        </form>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="px-6 py-4" style={{ background: '#1e293b', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-sm font-semibold text-white">Recent Broadcasts</p>
          </div>
          <div style={{ background: '#1a2740' }}>
            {history.map((h: any, i: number) => (
              <div key={i} className="px-6 py-4 table-row-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{h.title}</p>
                    <p className="text-xs mt-0.5 line-clamp-2" style={{ color: '#64748b' }}>{h.message}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs" style={{ color: '#475569' }}>
                      {new Date(h.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                    </p>
                    <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block"
                      style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}>BROADCAST</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
