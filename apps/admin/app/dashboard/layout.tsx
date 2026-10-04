import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

const navLinks = [
  { href: '/dashboard', label: 'Overview', icon: '📊' },
  { href: '/dashboard/users', label: 'Users', icon: '👥' },
  { href: '/dashboard/tasks', label: 'Tasks', icon: '📋' },
  { href: '/dashboard/payments', label: 'Payments', icon: '💳' },
  { href: '/dashboard/events', label: 'Events', icon: '🌿' },
  { href: '/dashboard/disputes', label: 'Disputes', icon: '⚖️' },
  { href: '/dashboard/verifications', label: 'Verifications', icon: '✓' },
  { href: '/dashboard/broadcast', label: 'Broadcast', icon: '📢' },
  { href: '/dashboard/activity', label: 'Activity Log', icon: '📜' },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_access_token')?.value;
  if (!token) redirect('/login');

  return (
    <div className="flex h-screen" style={{ background: '#0f172a' }}>
      {/* Sidebar */}
      <aside
        className="w-60 flex flex-col flex-shrink-0 overflow-y-auto"
        style={{
          background: '#1e293b',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          width: '240px',
        }}
      >
        {/* Brand */}
        <div
          className="px-5 py-5 flex items-center gap-3 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #00796B, #00897B)' }}
          >
            <span className="text-white font-black text-sm">S</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">SAVJ</p>
            <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group"
              style={{ color: '#94a3b8' }}
            >
              <span className="text-base leading-none">{link.icon}</span>
              <span className="group-hover:text-white transition-colors">{link.label}</span>
            </Link>
          ))}
        </nav>

        {/* Admin badge at bottom */}
        <div
          className="px-3 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="px-3 py-2 rounded-xl mb-2" style={{ background: 'rgba(0, 121, 107, 0.1)' }}>
            <p className="text-xs font-medium" style={{ color: '#00796B' }}>
              ✓ Admin Access
            </p>
            <p className="text-xs mt-0.5 truncate" style={{ color: '#64748b' }}>
              admin@savj.in
            </p>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors"
              style={{ color: '#64748b' }}
            >
              🚪 Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto flex flex-col">
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-8 py-4 flex-shrink-0"
          style={{
            background: '#1e293b',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <p className="text-sm font-medium" style={{ color: '#94a3b8' }}>
            SAVJ Admin Dashboard
          </p>
          <span
            className="text-xs px-3 py-1 rounded-full font-semibold"
            style={{
              background: 'rgba(0, 121, 107, 0.15)',
              color: '#00796B',
              border: '1px solid rgba(0, 121, 107, 0.3)',
            }}
          >
            ● Admin
          </span>
        </div>

        {/* Page content */}
        <div className="flex-1 p-8">{children}</div>
      </main>
    </div>
  );
}
