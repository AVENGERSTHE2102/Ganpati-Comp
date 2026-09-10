'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Users,
  Vote,
  LogOut,
  ExternalLink,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Submissions', href: '/admin/submissions', icon: FileText },
  { label: 'Participants', href: '/admin/participants', icon: Users },
  { label: 'Votes Audit', href: '/admin/votes', icon: Vote },
];

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function AdminSidebar({ mobileOpen = false, onCloseMobile }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const sidebarContent = (
    <aside className="w-64 flex-shrink-0 bg-burgundy text-white flex flex-col h-full shadow-xl">
      {/* Brand & Close button for mobile */}
      <div className="px-6 py-6 border-b border-white/10 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-saffron/90 font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Marathi Club</span>
          </div>
          <h1 className="text-xl font-serif font-bold text-white">Admin Panel</h1>
        </div>
        {/* Mobile close button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active =
            pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onCloseMobile}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all group',
                active
                  ? 'bg-saffron text-white shadow-md font-semibold'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 transition-transform group-hover:scale-110',
                  active ? 'text-white' : 'text-saffron/80'
                )}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Quick link to public site & Logout */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1.5">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-xs font-medium text-white/60 hover:bg-white/10 hover:text-white transition-all"
        >
          <span>View Public Site</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <div className="hidden md:flex flex-shrink-0 min-h-[calc(100vh-5rem)]">
        {sidebarContent}
      </div>

      {/* Mobile drawer with backdrop overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Drawer content */}
          <div className="relative z-10 w-64 max-w-[80vw] h-full animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
