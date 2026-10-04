import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  RELEASED: { bg: 'rgba(34,197,94,0.15)',   color: '#22c55e' },
  HELD:     { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b' },
  REFUNDED: { bg: 'rgba(59,130,246,0.15)',  color: '#3b82f6' },
  FAILED:   { bg: 'rgba(239,68,68,0.15)',   color: '#ef4444' },
};

export default function PaymentsPage() {
  const payments = db.prepare(
    `SELECT p.id, p.amount_paise, p.status, p.created_at,
            t.title as task_title, t.id as task_id,
            c.full_name as payer_name, c.email as payer_email,
            w.full_name as payee_name, w.email as payee_email
     FROM payments p
     JOIN tasks t ON t.id = p.task_id
     JOIN users c ON c.id = p.payer_id
     JOIN users w ON w.id = p.payee_id
     ORDER BY p.created_at DESC`
  ).all() as any[];

  const totalReleased = payments.filter(p => p.status === 'RELEASED').reduce((s, p) => s + p.amount_paise, 0);
  const totalHeld     = payments.filter(p => p.status === 'HELD').reduce((s, p) => s + p.amount_paise, 0);
  const countReleased = payments.filter(p => p.status === 'RELEASED').length;
  const countPending  = payments.filter(p => p.status === 'HELD').length;

  async function markRefunded(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(id) as any;
    if (!payment || payment.status !== 'HELD') return;
    db.prepare("UPDATE payments SET status = 'REFUNDED' WHERE id = ?").run(id);
    const n1 = `notif-${Date.now()}-a`, n2 = `notif-${Date.now()}-b`;
    db.prepare('INSERT INTO notifications (id,user_id,type,title,message,link) VALUES (?,?,?,?,?,?)')
      .run(n1, payment.payer_id, 'PAYMENT', '↩️ Payment Refunded', `Your payment for task has been refunded by admin.`, null);
    db.prepare('INSERT INTO notifications (id,user_id,type,title,message,link) VALUES (?,?,?,?,?,?)')
      .run(n2, payment.payee_id, 'PAYMENT', '↩️ Payment Reversed', `The payment for your task has been reversed by admin.`, null);
    revalidatePath('/dashboard/payments');
  }

  const summaryCards = [
    { label: 'Total Released', value: `₹${(totalReleased/100).toFixed(0)}`, color: '#22c55e' },
    { label: 'Total Held',     value: `₹${(totalHeld/100).toFixed(0)}`,     color: '#f59e0b' },
    { label: 'Released Count', value: countReleased,                         color: '#22c55e' },
    { label: 'Pending Count',  value: countPending,                          color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Payments</h1>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>All platform transactions · DEMO mode</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        {summaryCards.map((c) => (
          <div key={c.label} className="rounded-2xl p-4 stat-card"
            style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</p>
            <p className="text-xs mt-1" style={{ color: '#64748b' }}>{c.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="px-6 py-4" style={{ background: '#1e293b', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-sm font-semibold text-white">{payments.length} transactions</p>
        </div>
        {payments.length === 0 ? (
          <div className="px-6 py-16 text-center" style={{ background: '#1a2740' }}>
            <p className="text-4xl mb-3">💳</p>
            <p style={{ color: '#475569' }}>No payments yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto" style={{ background: '#1a2740' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {['Task', 'Creator', 'Worker', 'Amount', 'Status', 'Date', 'Action'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: '#475569' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p: any) => {
                  const s = STATUS_STYLE[p.status] ?? STATUS_STYLE.HELD;
                  return (
                    <tr key={p.id} className="table-row-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td className="px-5 py-3 text-white font-medium max-w-[180px] truncate">{p.task_title}</td>
                      <td className="px-5 py-3" style={{ color: '#94a3b8' }}>{p.payer_name}</td>
                      <td className="px-5 py-3" style={{ color: '#94a3b8' }}>{p.payee_name}</td>
                      <td className="px-5 py-3 font-bold" style={{ color: '#22c55e' }}>₹{(p.amount_paise/100).toFixed(0)}</td>
                      <td className="px-5 py-3">
                        <span className="text-xs px-2 py-1 rounded-full font-semibold"
                          style={{ background: s.bg, color: s.color }}>{p.status}</span>
                      </td>
                      <td className="px-5 py-3 text-xs" style={{ color: '#475569' }}>
                        {new Date(p.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                      </td>
                      <td className="px-5 py-3">
                        {p.status === 'HELD' ? (
                          <form action={markRefunded}>
                            <input type="hidden" name="id" value={p.id} />
                            <button type="submit"
                              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                              style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}>
                              Refund
                            </button>
                          </form>
                        ) : <span style={{ color: '#334155' }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
