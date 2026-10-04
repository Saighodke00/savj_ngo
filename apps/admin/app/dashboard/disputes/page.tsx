import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

export default function DisputesPage() {
  const disputes = db
    .prepare(
      `SELECT t.id, t.title, t.budget_paise, t.dispute_reason, t.dispute_raised_at,
              t.completion_image_url, t.completion_note,
              c.full_name as creator_name, c.email as creator_email,
              w.full_name as worker_name, w.email as worker_email
       FROM tasks t
       JOIN users c ON c.id = t.creator_id
       LEFT JOIN users w ON w.id = t.worker_id
       WHERE t.status = 'DISPUTED'
       ORDER BY t.dispute_raised_at DESC`
    )
    .all() as any[];

  async function resolveDispute(formData: FormData) {
    'use server';
    const taskId = formData.get('task_id') as string;
    const decision = formData.get('decision') as string; // 'approve' | 'reject'

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
    if (!task || task.status !== 'DISPUTED') return;

    if (decision === 'approve') {
      db.prepare(`UPDATE tasks SET status = 'COMPLETED', updated_at = datetime('now') WHERE id = ?`).run(taskId);
      const payId = `pay-${Date.now()}`;
      db.prepare(`INSERT INTO payments (id, task_id, payer_id, payee_id, amount_paise, status) VALUES (?, ?, ?, ?, ?, 'RELEASED')`)
        .run(payId, taskId, task.creator_id, task.worker_id, task.budget_paise);
      db.prepare(`UPDATE users SET tasks_completed = tasks_completed + 1, total_earned_paise = total_earned_paise + ?, points = points + 10 WHERE id = ?`)
        .run(task.budget_paise, task.worker_id);
      const n1 = `notif-${Date.now()}-a`, n2 = `notif-${Date.now()}-b`;
      db.prepare('INSERT INTO notifications (id, user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)')
        .run(n1, task.worker_id, 'DISPUTE_RESOLVED', '✅ Dispute Resolved — In Your Favour',
          `Admin approved payment for "${task.title}".`, `/tasks/${taskId}`);
      db.prepare('INSERT INTO notifications (id, user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)')
        .run(n2, task.creator_id, 'DISPUTE_RESOLVED', '⚖️ Dispute Resolved',
          `Admin sided with the worker for "${task.title}". Payment released.`, `/tasks/${taskId}`);
    } else {
      db.prepare(`UPDATE tasks SET status = 'CANCELLED', updated_at = datetime('now') WHERE id = ?`).run(taskId);
      const n1 = `notif-${Date.now()}-a`, n2 = `notif-${Date.now()}-b`;
      db.prepare('INSERT INTO notifications (id, user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)')
        .run(n1, task.creator_id, 'DISPUTE_RESOLVED', '✅ Dispute Resolved — In Your Favour',
          `Admin cancelled "${task.title}". No payment released.`, `/tasks/${taskId}`);
      db.prepare('INSERT INTO notifications (id, user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)')
        .run(n2, task.worker_id, 'DISPUTE_RESOLVED', '⚖️ Dispute Resolved',
          `Admin sided with the creator for "${task.title}". Task cancelled.`, `/tasks/${taskId}`);
    }
    revalidatePath('/dashboard/disputes');
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Disputes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{disputes.length} active dispute{disputes.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {disputes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
          <p className="text-4xl mb-3">⚖️</p>
          <p className="text-gray-500">No active disputes. All clear!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((d) => (
            <div key={d.id} className="bg-white rounded-2xl border border-red-100 p-6 shadow-sm">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-bold text-gray-800">{d.title}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    ₹{(d.budget_paise / 100).toFixed(0)} · Raised {d.dispute_raised_at ? new Date(d.dispute_raised_at).toLocaleDateString('en-IN') : 'Unknown'}
                  </p>
                </div>
                <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full flex-shrink-0">DISPUTED</span>
              </div>

              {/* Parties */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Creator (raised dispute)</p>
                  <p className="text-sm font-semibold text-gray-800">{d.creator_name}</p>
                  <p className="text-xs text-gray-500">{d.creator_email}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Worker</p>
                  <p className="text-sm font-semibold text-gray-800">{d.worker_name ?? '—'}</p>
                  <p className="text-xs text-gray-500">{d.worker_email ?? '—'}</p>
                </div>
              </div>

              {/* Dispute reason */}
              {d.dispute_reason && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">
                  <p className="text-xs text-red-500 mb-1 font-medium">Dispute Reason:</p>
                  <p className="text-sm text-gray-700">{d.dispute_reason}</p>
                </div>
              )}

              {/* Worker's submission */}
              {d.completion_note && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4">
                  <p className="text-xs text-blue-500 mb-1 font-medium">Worker&apos;s Completion Note:</p>
                  <p className="text-sm text-gray-700">{d.completion_note}</p>
                </div>
              )}

              {/* Resolution actions */}
              <div className="flex gap-3">
                <form action={resolveDispute} className="flex-1">
                  <input type="hidden" name="task_id" value={d.id} />
                  <input type="hidden" name="decision" value="approve" />
                  <button type="submit"
                    className="w-full py-2.5 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-colors">
                    ✅ Side with Worker (Release Payment)
                  </button>
                </form>
                <form action={resolveDispute} className="flex-1">
                  <input type="hidden" name="task_id" value={d.id} />
                  <input type="hidden" name="decision" value="reject" />
                  <button type="submit"
                    className="w-full py-2.5 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition-colors">
                    ❌ Side with Creator (Cancel Task)
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
