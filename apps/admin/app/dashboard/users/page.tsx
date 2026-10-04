import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
}

const AVATAR_COLORS = ['#00796B','#1565C0','#6A1B9A','#AD1457','#E65100','#2E7D32','#37474F'];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const { q: rawQ, filter: rawFilter } = await searchParams;
  const q      = (rawQ      ?? '').trim();
  const filter = (rawFilter ?? 'all');

  let query = `SELECT id, full_name, email, role, tasks_completed, tasks_posted,
                      total_earned_paise, points, is_suspended, is_verified,
                      verification_pending, community_drives, volunteer_hours, created_at
               FROM users WHERE 1=1`;
  const params: any[] = [];
  if (q) {
    query += ` AND (full_name LIKE ? OR email LIKE ?)`;
    params.push(`%${q}%`, `%${q}%`);
  }
  if (filter === 'active')    { query += ` AND is_suspended=0`; }
  if (filter === 'suspended') { query += ` AND is_suspended=1`; }
  if (filter === 'verified')  { query += ` AND is_verified=1`; }
  if (filter === 'pending')   { query += ` AND verification_pending=1`; }
  query += ` ORDER BY created_at DESC`;

  const users = db.prepare(query).all(...params) as any[];

  const totalCount     = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;
  const activeCount    = (db.prepare("SELECT COUNT(*) as c FROM users WHERE is_suspended=0").get() as any).c;
  const suspendedCount = (db.prepare("SELECT COUNT(*) as c FROM users WHERE is_suspended=1").get() as any).c;
  const verifiedCount  = (db.prepare("SELECT COUNT(*) as c FROM users WHERE is_verified=1").get() as any).c;

  async function toggleSuspend(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const cur = formData.get('is_suspended') as string;
    db.prepare('UPDATE users SET is_suspended = ? WHERE id = ?').run(cur === '1' ? 0 : 1, id);
    revalidatePath('/dashboard/users');
  }

  async function grantVerification(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    db.prepare('UPDATE users SET is_verified = 1, verification_pending = 0 WHERE id = ?').run(id);
    const nid = `notif-${Date.now()}`;
    db.prepare('INSERT INTO notifications (id,user_id,type,title,message,link) VALUES (?,?,?,?,?,?)')
      .run(nid, id, 'VERIFIED', '✓ Identity Verified!', 'Your identity has been verified by SAVJ admin.', '/profile');
    revalidatePath('/dashboard/users');
  }

  const FILTERS = [
    { key: 'all',       label: `All (${totalCount})` },
    { key: 'active',    label: `Active (${activeCount})` },
    { key: 'suspended', label: `Suspended (${suspendedCount})` },
    { key: 'verified',  label: `Verified (${verifiedCount})` },
    { key: 'pending',   label: 'Pending Verify' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>
          {users.length} result{users.length !== 1 ? 's' : ''} · {totalCount} total users
        </p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total',     value: totalCount,     color: '#00796B' },
          { label: 'Active',    value: activeCount,    color: '#22c55e' },
          { label: 'Suspended', value: suspendedCount, color: '#ef4444' },
          { label: 'Verified',  value: verifiedCount,  color: '#3b82f6' },
        ].map(s => (
          <div key={s.label} className="rounded-xl px-4 py-3 stat-card"
            style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap gap-3">
        <form method="GET" className="flex-1 min-w-48">
          <input name="q" defaultValue={q} placeholder="Search by name or email…"
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }} />
          {filter !== 'all' && <input type="hidden" name="filter" value={filter} />}
        </form>
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map(f => (
            <a key={f.key} href={`?filter=${f.key}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
              className="px-3 py-2 rounded-xl text-xs font-medium transition-all"
              style={filter === f.key
                ? { background: 'rgba(0,121,107,0.2)', color: '#00796B', border: '1px solid rgba(0,121,107,0.4)' }
                : { background: '#1e293b', color: '#64748b', border: '1px solid rgba(255,255,255,0.06)' }}>
              {f.label}
            </a>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="overflow-x-auto" style={{ background: '#1a2740' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {['User', 'Email', 'Tasks', 'Earned', 'Points', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: '#475569', background: '#1e293b' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center" style={{ color: '#475569' }}>
                  No users found.
                </td></tr>
              ) : users.map((u: any) => {
                const bg = avatarColor(u.full_name);
                return (
                  <tr key={u.id} className="table-row-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    {/* Avatar + name */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: bg }}>
                          {initials(u.full_name)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-white truncate">{u.full_name}</p>
                            {u.is_verified ? <span style={{ color: '#3b82f6', fontSize: 10 }}>✓</span> : null}
                            {u.verification_pending ? <span style={{ color: '#f59e0b', fontSize: 9 }}>⏳</span> : null}
                          </div>
                          <p className="text-xs" style={{ color: '#475569' }}>
                            Joined {new Date(u.created_at).toLocaleDateString('en-IN', { month:'short', year:'numeric' })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs max-w-[160px] truncate" style={{ color: '#64748b' }}>{u.email}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="font-semibold text-white">{u.tasks_completed}</span>
                      <span className="text-xs" style={{ color: '#475569' }}> done</span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold" style={{ color: '#22c55e' }}>
                      ₹{(u.total_earned_paise / 100).toFixed(0)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs px-2 py-1 rounded-full font-semibold"
                        style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                        {u.points} pts
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                        style={u.is_suspended
                          ? { background: 'rgba(239,68,68,0.15)', color: '#ef4444' }
                          : { background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
                        {u.is_suspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <form action={toggleSuspend}>
                          <input type="hidden" name="id" value={u.id} />
                          <input type="hidden" name="is_suspended" value={u.is_suspended} />
                          <button type="submit"
                            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                            style={u.is_suspended
                              ? { background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }
                              : { background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
                            {u.is_suspended ? 'Unsuspend' : 'Suspend'}
                          </button>
                        </form>
                        {u.verification_pending && !u.is_verified && (
                          <form action={grantVerification}>
                            <input type="hidden" name="id" value={u.id} />
                            <button type="submit"
                              className="text-xs px-3 py-1.5 rounded-lg font-medium"
                              style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}>
                              Verify ✓
                            </button>
                          </form>
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
