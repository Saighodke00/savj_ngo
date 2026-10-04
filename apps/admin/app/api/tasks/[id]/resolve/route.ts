import { cookies } from 'next/headers';
import db from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_access_token')?.value;
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: taskId } = await params;
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
  if (!task) return Response.json({ error: 'Task not found' }, { status: 404 });
  if (task.status !== 'DISPUTED') return Response.json({ error: 'Task is not disputed' }, { status: 400 });

  const { decision, admin_note } = await request.json();
  // decision: 'approve' (pay worker) | 'reject' (cancel, refund creator)

  if (decision === 'approve') {
    // Side with worker — complete the task and create payment
    db.prepare(`UPDATE tasks SET status = 'COMPLETED', updated_at = datetime('now') WHERE id = ?`).run(taskId);
    const payId = `pay-${Date.now()}`;
    db.prepare(`INSERT INTO payments (id, task_id, payer_id, payee_id, amount_paise, status) VALUES (?, ?, ?, ?, ?, 'RELEASED')`)
      .run(payId, taskId, task.creator_id, task.worker_id, task.budget_paise);
    db.prepare(`UPDATE users SET tasks_completed = tasks_completed + 1, total_earned_paise = total_earned_paise + ?, points = points + 10 WHERE id = ?`)
      .run(task.budget_paise, task.worker_id);

    // Notify both parties
    const notifId1 = `notif-${Date.now()}-a`;
    const notifId2 = `notif-${Date.now()}-b`;
    db.prepare('INSERT INTO notifications (id, user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)')
      .run(notifId1, task.worker_id, 'DISPUTE_RESOLVED', '✅ Dispute Resolved — In Your Favour',
        `Admin reviewed the dispute for "${task.title}" and approved payment.`, `/tasks/${taskId}`);
    db.prepare('INSERT INTO notifications (id, user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)')
      .run(notifId2, task.creator_id, 'DISPUTE_RESOLVED', '⚖️ Dispute Resolved',
        `Admin reviewed your dispute for "${task.title}" and sided with the worker. Payment has been released.`, `/tasks/${taskId}`);
  } else {
    // Side with creator — cancel the task
    db.prepare(`UPDATE tasks SET status = 'CANCELLED', updated_at = datetime('now') WHERE id = ?`).run(taskId);

    const notifId1 = `notif-${Date.now()}-a`;
    const notifId2 = `notif-${Date.now()}-b`;
    db.prepare('INSERT INTO notifications (id, user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)')
      .run(notifId1, task.creator_id, 'DISPUTE_RESOLVED', '✅ Dispute Resolved — In Your Favour',
        `Admin reviewed your dispute for "${task.title}" and cancelled the task. No payment was released.`, `/tasks/${taskId}`);
    db.prepare('INSERT INTO notifications (id, user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)')
      .run(notifId2, task.worker_id, 'DISPUTE_RESOLVED', '⚖️ Dispute Resolved',
        `Admin reviewed the dispute for "${task.title}" and sided with the creator. Task has been cancelled.`, `/tasks/${taskId}`);
  }

  return Response.json({ success: true, decision });
}
