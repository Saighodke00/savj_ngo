import db from '@/lib/db';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const KIND_CONFIG: Record<string, { color: string; label: string; icon: string }> = {
  payment:      { color: '#22c55e', label: 'Payment',  icon: '💰' },
  task_created: { color: '#00796B', label: 'Task',     icon: '📋' },
  user_joined:  { color: '#8b5cf6', label: 'User',     icon: '👤' },
};

export default function ActivityLogPage() {
  // Build unified activity feed from 3 sources
  const paymentEvents = db.prepare(
    `SELECT 'payment' as kind, p.created_at, p.amount_paise, p.status,
            t.title as description, c.full_name as actor
     FROM payments p
     JOIN tasks t ON t.id=p.task_id
     JOIN users c ON c.id=p.payer_id`
  ).all() as any[];

  const taskEvents = db.prepare(
    `SELECT 'task_created' as kind, t.created_at, t.title as description,
            t.status, u.full_name as actor
     FROM tasks t JOIN users u ON u.id=t.creator_id`
  ).all() as any[];

  const userEvents = db.prepare(
    `SELECT 'user_joined' as kind, u.created_at, u.full_name as actor,
            u.email as description
     FROM users u`
  ).all() as any[];

  const all = [...paymentEvents, ...taskEvents, ...userEvents]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 80);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Activity Log</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>
            Last {all.length} events across the platform
          </p>
        </div>
        <div className="flex gap-3 text-xs">
          {Object.entries(KIND_CONFIG).map(([k, v]) => (
            <div key={k} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: `${v.color}15`, border: `1px solid ${v.color}30` }}>
              <div className="w-2 h-2 rounded-full" style={{ background: v.color }} />
              <span style={{ color: v.color }}>{v.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        {all.length === 0 ? (
          <div className="px-6 py-16 text-center" style={{ background: '#1a2740' }}>
            <p className="text-4xl mb-3">📜</p>
            <p style={{ color: '#475569' }}>No activity yet.</p>
          </div>
        ) : (
          <div style={{ background: '#1a2740' }}>
            {all.map((event: any, i: number) => {
              const cfg = KIND_CONFIG[event.kind] ?? { color: '#64748b', label: event.kind, icon: '•' };
              let detail = '';
              if (event.kind === 'payment') {
                detail = `₹${(event.amount_paise / 100).toFixed(0)} — ${event.status}`;
              } else if (event.kind === 'task_created') {
                detail = event.description;
              } else {
                detail = event.description;
              }

              return (
                <div key={i} className="flex items-start gap-4 px-6 py-4 table-row-hover"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
                      style={{ background: `${cfg.color}20` }}>
                      {cfg.icon}
                    </div>
                    {i < all.length - 1 && (
                      <div className="w-0.5 h-4 mt-1" style={{ background: 'rgba(255,255,255,0.05)' }} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs px-2 py-0.5 rounded font-semibold"
                        style={{ background: `${cfg.color}20`, color: cfg.color }}>
                        {cfg.label}
                      </span>
                      <span className="text-xs" style={{ color: '#475569' }}>{timeAgo(event.created_at)}</span>
                    </div>
                    <p className="text-sm font-medium text-white truncate">
                      {event.actor}
                      {event.kind === 'task_created' && <span style={{ color: '#64748b' }}> posted</span>}
                      {event.kind === 'user_joined' && <span style={{ color: '#64748b' }}> joined</span>}
                      {event.kind === 'payment' && <span style={{ color: '#64748b' }}> paid</span>}
                    </p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: '#64748b' }}>{detail}</p>
                  </div>

                  {/* Timestamp */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs" style={{ color: '#334155' }}>
                      {new Date(event.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#334155' }}>
                      {new Date(event.created_at).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
