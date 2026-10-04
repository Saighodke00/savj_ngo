import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  OPEN:        { bg: 'rgba(0,121,107,0.15)',   color: '#00796B' },
  IN_PROGRESS: { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b' },
  SUBMITTED:   { bg: 'rgba(59,130,246,0.15)',  color: '#3b82f6' },
  COMPLETED:   { bg: 'rgba(34,197,94,0.15)',   color: '#22c55e' },
  CANCELLED:   { bg: 'rgba(100,116,139,0.15)', color: '#64748b' },
  DISPUTED:    { bg: 'rgba(239,68,68,0.15)',   color: '#ef4444' },
};

const ALL_STATUSES = ['ALL', 'OPEN', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED', 'DISPUTED', 'CANCELLED'];

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status: rawStatus, q: rawQ } = await searchParams;
  const statusFilter = (rawStatus ?? 'ALL').toUpperCase();
  const q            = (rawQ ?? '').trim();

  let query = `SELECT t.id, t.title, t.budget_paise, t.status, t.scheduled_date,
                      t.location_label, t.created_at,
                      u.full_name as creator_name,
                      w.full_name as worker_name,
                      c.name as category_name, c.icon as category_icon
               FROM tasks t
               JOIN users u ON u.id = t.creator_id
               LEFT JOIN users w ON w.id = t.worker_id
               LEFT JOIN categories c ON c.id = t.category_id
               WHERE 1=1`;
  const params: any[] = [];
  if (statusFilter !== 'ALL') { query += ` AND t.status = ?`; params.push(statusFilter); }
  if (q)                      { query += ` AND (t.title LIKE ? OR u.full_name LIKE ?)`; params.push(`%${q}%`, `%${q}%`); }
  query += ` ORDER BY t.created_at DESC`;

  const tasks = db.prepare(query).all(...params) as any[];

  // Count per status for tab badges
  const counts: Record<string, number> = { ALL: 0 };
  ALL_STATUSES.slice(1).forEach(s => {
    counts[s] = (db.prepare(`SELECT COUNT(*) as c FROM tasks WHERE status=?`).get(s) as any).c;
    counts.ALL += counts[s];
  });

  async function cancelTask(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    db.prepare("UPDATE tasks SET status='CANCELLED', updated_at=datetime('now') WHERE id=?").run(id);
    revalidatePath('/dashboard/tasks');
  }

  async function forceComplete(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const task = db.prepare('SELECT * FROM tasks WHERE id=?').get(id) as any;
    if (!task || task.status !== 'IN_PROGRESS') return;
    db.prepare("UPDATE tasks SET status='COMPLETED', updated_at=datetime('now') WHERE id=?").run(id);
    if (task.worker_id) {
      db.prepare('UPDATE users SET tasks_completed=tasks_completed+1, total_earned_paise=total_earned_paise+? WHERE id=?')
        .run(task.budget_paise, task.worker_id);
      const nid = `notif-${Date.now()}`;
      db.prepare('INSERT INTO notifications (id,user_id,type,title,message,link) VALUES (?,?,?,?,?,?)')
        .run(nid, task.worker_id, 'PAYMENT', '✅ Task Force-Completed', `Admin marked "${task.title}" complete.`, `/tasks/${id}`);
    }
    revalidatePath('/dashboard/tasks');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Tasks</h1>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>{counts.ALL} total tasks</p>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-1.5">
        {ALL_STATUSES.map(s => {
          const ss = STATUS_STYLE[s] ?? { bg: 'rgba(255,255,255,0.06)', color: '#64748b' };
          const isActive = statusFilter === s;
          return (
            <a key={s} href={`?status=${s}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={isActive
                ? { background: ss.bg, color: ss.color, border: `1px solid ${ss.color}40` }
                : { background: '#1e293b', color: '#475569', border: '1px solid rgba(255,255,255,0.06)' }}>
              {s === 'ALL' ? 'All' : s.replace('_', ' ')} <span style={{ opacity: 0.7 }}>({counts[s] ?? 0})</span>
            </a>
          );
        })}
      </div>

      {/* Search */}
      <form method="GET">
        {statusFilter !== 'ALL' && <input type="hidden" name="status" value={statusFilter} />}
        <input name="q" defaultValue={q} placeholder="Search by title or creator…"
          className="w-full max-w-sm px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }} />
      </form>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="overflow-x-auto" style={{ background: '#1a2740' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {['Title', 'Category', 'Creator', 'Worker', 'Budget', 'Status', 'Date', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: '#475569', background: '#1e293b' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center" style={{ color: '#475569' }}>
                  No tasks found.
                </td></tr>
              ) : tasks.map((t: any) => {
                const ss = STATUS_STYLE[t.status] ?? STATUS_STYLE.CANCELLED;
                const budgetColor = t.budget_paise > 100000 ? '#22c55e' : t.budget_paise > 20000 ? '#f59e0b' : '#64748b';
                const isDisputed = t.status === 'DISPUTED';
                return (
                  <tr key={t.id} className="table-row-hover"
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      background: isDisputed ? 'rgba(239,68,68,0.04)' : undefined,
                    }}>
                    <td className="px-5 py-3.5 font-medium text-white max-w-[200px]">
                      <p className="truncate">{t.title}</p>
                      <p className="text-xs truncate mt-0.5" style={{ color: '#475569' }}>{t.location_label}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: '#64748b' }}>
                      {t.category_icon} {t.category_name ?? '—'}
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: '#94a3b8' }}>{t.creator_name}</td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: t.worker_name ? '#94a3b8' : '#334155' }}>
                      {t.worker_name ?? '—'}
                    </td>
                    <td className="px-5 py-3.5 font-bold" style={{ color: budgetColor }}>
                      ₹{(t.budget_paise / 100).toFixed(0)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs px-2 py-1 rounded-full font-semibold whitespace-nowrap"
                        style={{ background: ss.bg, color: ss.color }}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: '#475569' }}>
                      {new Date(t.scheduled_date || t.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1.5">
                        {t.status === 'OPEN' && (
                          <form action={cancelTask}>
                            <input type="hidden" name="id" value={t.id} />
                            <button type="submit"
                              className="text-xs px-2.5 py-1.5 rounded-lg font-medium"
                              style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
                              Cancel
                            </button>
                          </form>
                        )}
                        {t.status === 'IN_PROGRESS' && (
                          <form action={forceComplete}>
                            <input type="hidden" name="id" value={t.id} />
                            <button type="submit"
                              className="text-xs px-2.5 py-1.5 rounded-lg font-medium"
                              style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}>
                              Force ✓
                            </button>
                          </form>
                        )}
                        {isDisputed && (
                          <a href="/dashboard/disputes"
                            className="text-xs px-2.5 py-1.5 rounded-lg font-medium"
                            style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
                            Resolve ⚖️
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
