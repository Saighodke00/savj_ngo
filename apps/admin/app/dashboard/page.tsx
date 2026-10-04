import db from '@/lib/db';

function StatCard({
  label, value, icon, accent, sub,
}: { label: string; value: string | number; icon: string; accent: string; sub?: string }) {
  return (
    <div className="stat-card rounded-2xl p-5 relative overflow-hidden"
      style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: `${accent}20` }}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm font-medium" style={{ color: '#94a3b8' }}>{label}</p>
      {sub && <p className="text-xs mt-1" style={{ color: '#64748b' }}>{sub}</p>}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />
    </div>
  );
}

function AlertBadge({ count, label, color }: { count: number; label: string; color: string }) {
  if (count === 0) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl"
      style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
      <span className="text-sm font-medium" style={{ color }}>{label}</span>
      <span className="text-sm font-bold px-2 py-0.5 rounded-full"
        style={{ background: `${color}25`, color }}>{count}</span>
    </div>
  );
}

export default function DashboardOverview() {
  // ── All-time stats ──────────────────────────────────────────────
  const totalUsers     = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;
  const activeUsers    = (db.prepare("SELECT COUNT(*) as c FROM users WHERE is_suspended=0").get() as any).c;
  const suspendedUsers = (db.prepare("SELECT COUNT(*) as c FROM users WHERE is_suspended=1").get() as any).c;
  const openTasks      = (db.prepare("SELECT COUNT(*) as c FROM tasks WHERE status='OPEN'").get() as any).c;
  const inProgressTasks= (db.prepare("SELECT COUNT(*) as c FROM tasks WHERE status='IN_PROGRESS'").get() as any).c;
  const completedTasks = (db.prepare("SELECT COUNT(*) as c FROM tasks WHERE status='COMPLETED'").get() as any).c;
  const disputedTasks  = (db.prepare("SELECT COUNT(*) as c FROM tasks WHERE status='DISPUTED'").get() as any).c;
  const totalEvents    = (db.prepare("SELECT COUNT(*) as c FROM community_events WHERE status='OPEN'").get() as any).c;
  const volunteerHours = (db.prepare('SELECT COALESCE(SUM(volunteer_hours),0) as s FROM users').get() as any).s;
  const totalRevenue   = (db.prepare("SELECT COALESCE(SUM(amount_paise),0) as s FROM payments WHERE status='RELEASED'").get() as any).s;
  const pendingVerify  = (db.prepare('SELECT COUNT(*) as c FROM users WHERE verification_pending=1').get() as any).c;
  const totalBadges    = (db.prepare('SELECT COUNT(*) as c FROM user_badges').get() as any).c;

  // ── Today stats ──────────────────────────────────────────────────
  const todayUsers  = (db.prepare("SELECT COUNT(*) as c FROM users WHERE date(created_at)=date('now')").get() as any).c;
  const todayTasks  = (db.prepare("SELECT COUNT(*) as c FROM tasks WHERE date(created_at)=date('now')").get() as any).c;
  const todayDone   = (db.prepare("SELECT COUNT(*) as c FROM tasks WHERE status='COMPLETED' AND date(updated_at)=date('now')").get() as any).c;

  // ── Task status breakdown (for CSS bar chart) ────────────────────
  const totalTasks = openTasks + inProgressTasks + completedTasks + disputedTasks;
  const statusBars = [
    { label: 'Open',        count: openTasks,       pct: totalTasks ? Math.round((openTasks/totalTasks)*100) : 0,        color: '#00796B' },
    { label: 'In Progress', count: inProgressTasks,  pct: totalTasks ? Math.round((inProgressTasks/totalTasks)*100) : 0,  color: '#f59e0b' },
    { label: 'Completed',   count: completedTasks,   pct: totalTasks ? Math.round((completedTasks/totalTasks)*100) : 0,   color: '#22c55e' },
    { label: 'Disputed',    count: disputedTasks,    pct: totalTasks ? Math.round((disputedTasks/totalTasks)*100) : 0,    color: '#ef4444' },
  ];

  // ── Recent activity (last 10 notifications across all users) ─────
  const activity = db.prepare(
    `SELECT n.title, n.message, n.type, n.created_at, u.full_name
     FROM notifications n
     JOIN users u ON u.id = n.user_id
     ORDER BY n.created_at DESC LIMIT 10`
  ).all() as any[];

  // ── Recent payments ──────────────────────────────────────────────
  const recentPayments = db.prepare(
    `SELECT p.amount_paise, p.status, p.created_at, t.title as task_title,
            c.full_name as payer, w.full_name as payee
     FROM payments p
     JOIN tasks t ON t.id=p.task_id
     JOIN users c ON c.id=p.payer_id
     JOIN users w ON w.id=p.payee_id
     ORDER BY p.created_at DESC LIMIT 5`
  ).all() as any[];

  const TYPE_COLORS: Record<string, string> = {
    PAYMENT: '#22c55e', BADGE: '#f59e0b', DISPUTE: '#ef4444',
    APPLICATION: '#00796B', ACCEPTED: '#22c55e', VERIFIED: '#3b82f6',
    BROADCAST: '#8b5cf6', DEFAULT: '#64748b',
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>
            Live data · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {/* Today strip */}
        <div className="flex gap-3">
          {[
            { label: 'New Users Today', value: todayUsers, color: '#00796B' },
            { label: 'Tasks Posted', value: todayTasks, color: '#f59e0b' },
            { label: 'Completed', value: todayDone, color: '#22c55e' },
          ].map((t) => (
            <div key={t.label} className="text-center px-4 py-2 rounded-xl"
              style={{ background: `${t.color}15`, border: `1px solid ${t.color}30` }}>
              <p className="text-xl font-bold" style={{ color: t.color }}>{t.value}</p>
              <p className="text-xs" style={{ color: '#64748b' }}>{t.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {(disputedTasks > 0 || pendingVerify > 0 || suspendedUsers > 0) && (
        <div className="grid grid-cols-3 gap-3">
          <AlertBadge count={disputedTasks} label="⚠️ Disputed Tasks" color="#ef4444" />
          <AlertBadge count={pendingVerify} label="🪪 Pending Verifications" color="#f59e0b" />
          <AlertBadge count={suspendedUsers} label="🚫 Suspended Users" color="#94a3b8" />
        </div>
      )}

      {/* Main stat grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={totalUsers} icon="👥" accent="#00796B" sub={`${activeUsers} active`} />
        <StatCard label="Platform Revenue" value={`₹${(totalRevenue/100).toFixed(0)}`} icon="💰" accent="#22c55e" sub="Released payments" />
        <StatCard label="Tasks Completed" value={completedTasks} icon="✅" accent="#22c55e" sub={`${openTasks} open now`} />
        <StatCard label="Active Events" value={totalEvents} icon="🌿" accent="#00796B" sub="Community drives" />
        <StatCard label="Volunteer Hours" value={`${volunteerHours}h`} icon="⏱️" accent="#8b5cf6" />
        <StatCard label="Badges Awarded" value={totalBadges} icon="🏆" accent="#f59e0b" />
        <StatCard label="In Progress" value={inProgressTasks} icon="⚡" accent="#f59e0b" sub="Being worked on" />
        <StatCard label="Disputed" value={disputedTasks} icon="⚖️" accent="#ef4444" sub="Need resolution" />
      </div>

      {/* Two-col: task breakdown + recent activity */}
      <div className="grid grid-cols-2 gap-6">

        {/* Task status breakdown */}
        <div className="rounded-2xl p-6" style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-base font-semibold text-white mb-5">Task Status Breakdown</h2>
          <div className="space-y-3">
            {statusBars.map((bar) => (
              <div key={bar.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span style={{ color: '#94a3b8' }}>{bar.label}</span>
                  <span className="font-semibold" style={{ color: bar.color }}>{bar.count} · {bar.pct}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${bar.pct}%`, background: bar.color }} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs mt-4" style={{ color: '#475569' }}>{totalTasks} total tasks</p>
        </div>

        {/* Recent activity */}
        <div className="rounded-2xl p-6" style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-base font-semibold text-white mb-5">Recent Activity</h2>
          {activity.length === 0 ? (
            <p className="text-sm" style={{ color: '#475569' }}>No activity yet.</p>
          ) : (
            <div className="space-y-3">
              {activity.map((a: any, i: number) => {
                const color = TYPE_COLORS[a.type] ?? TYPE_COLORS.DEFAULT;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                      style={{ background: color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{a.title}</p>
                      <p className="text-xs truncate" style={{ color: '#64748b' }}>
                        {a.full_name} · {new Date(a.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className="text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0"
                      style={{ background: `${color}20`, color }}>
                      {a.type}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent payments */}
      {recentPayments.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="px-6 py-4" style={{ background: '#1e293b', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="text-base font-semibold text-white">Recent Payments</h2>
          </div>
          <table className="w-full text-sm" style={{ background: '#1a2740' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {['Task', 'Creator → Worker', 'Amount', 'Status', 'Date'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: '#475569' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentPayments.map((p: any, i: number) => (
                <tr key={i} className="table-row-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td className="px-6 py-3 text-white font-medium truncate max-w-xs">{p.task_title}</td>
                  <td className="px-6 py-3" style={{ color: '#94a3b8' }}>
                    {p.payer} <span style={{ color: '#475569' }}>→</span> {p.payee}
                  </td>
                  <td className="px-6 py-3 font-bold" style={{ color: '#22c55e' }}>
                    ₹{(p.amount_paise / 100).toFixed(0)}
                  </td>
                  <td className="px-6 py-3">
                    <span className="text-xs px-2 py-1 rounded-full font-semibold"
                      style={{
                        background: p.status === 'RELEASED' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                        color: p.status === 'RELEASED' ? '#22c55e' : '#f59e0b',
                      }}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-xs" style={{ color: '#475569' }}>
                    {new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
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
