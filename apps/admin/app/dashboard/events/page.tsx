import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  CLOSED: 'bg-gray-100 text-gray-500',
};

const EVENT_EMOJI: Record<string, string> = {
  CLEANUP: '🧹', PLANTATION: '🌱', TEACHING: '📚', DONATION: '🎁', OTHER: '🤝',
};

export default function EventsPage() {
  const events = db
    .prepare(
      `SELECT id, title, event_type, event_date, event_time, location_label,
              status, participants_count, capacity, organizer_name
       FROM community_events
       ORDER BY created_at DESC`
    )
    .all() as any[];

  async function approveEvent(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    db.prepare("UPDATE community_events SET status = 'OPEN' WHERE id = ?").run(id);
    revalidatePath('/dashboard/events');
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Community Events</h1>
        <span className="text-sm text-gray-500">{events.length} total</span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-5 py-3.5 font-semibold text-gray-600">Title</th>
                <th className="px-5 py-3.5 font-semibold text-gray-600">Type</th>
                <th className="px-5 py-3.5 font-semibold text-gray-600">Organizer</th>
                <th className="px-5 py-3.5 font-semibold text-gray-600">Date</th>
                <th className="px-5 py-3.5 font-semibold text-gray-600 text-center">Participants</th>
                <th className="px-5 py-3.5 font-semibold text-gray-600 text-center">Status</th>
                <th className="px-5 py-3.5 font-semibold text-gray-600 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-gray-400">No events found.</td>
                </tr>
              ) : (
                events.map((evt) => (
                  <tr key={evt.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-800 max-w-xs truncate">{evt.title}</td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {EVENT_EMOJI[evt.event_type] ?? '🤝'} {evt.event_type}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{evt.organizer_name}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{evt.event_date} {evt.event_time}</td>
                    <td className="px-5 py-3.5 text-center text-gray-700">
                      {evt.participants_count} / {evt.capacity}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_COLORS[evt.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {evt.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {evt.status === 'PENDING' ? (
                        <form action={approveEvent}>
                          <input type="hidden" name="id" value={evt.id} />
                          <button type="submit"
                            className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                            Approve
                          </button>
                        </form>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
