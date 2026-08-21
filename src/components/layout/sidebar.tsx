'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Wallet, 
  BookOpen, 
  CalendarDays, 
  LineChart, 
  BrainCircuit, 
  ScrollText, 
  Clock, 
  Newspaper, 
  Settings,
  ShieldAlert,
  Users,
  Radio,
  FileDigit,
  ChevronLeft,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { User } from 'next-auth';

interface SidebarProps {
  user: User & { role?: string };
}

export default function Sidebar({ user }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const isAdmin = user.role === 'ADMIN';

  const mainRoutes = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Accounts', href: '/accounts', icon: Wallet },
    { name: 'Trade Log', href: '/trades', icon: BookOpen },
    { name: 'Calendar', href: '/calendar', icon: CalendarDays },
    { name: 'Analytics', href: '/analytics', icon: LineChart },
    { name: 'Strategy Maker', href: '/strategies', icon: BrainCircuit },
    { name: 'Rule Maker', href: '/rules', icon: ScrollText },
    { name: 'Market Clocks', href: '/clocks', icon: Clock },
    { name: 'News Center', href: '/news', icon: Newspaper },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const adminRoutes = [
    { name: 'Admin Dashboard', href: '/admin', icon: ShieldAlert },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'News Management', href: '/admin/news', icon: Radio },
    { name: 'Audit Logs', href: '/admin/audit', icon: FileDigit },
  ];

  return (
    <aside
      className={cn(
        'relative flex h-full flex-col border-r border-zinc-800 bg-zinc-950/50 transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-zinc-800 px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2 font-bold tracking-tight text-emerald-500">
            <TrendingUp className="h-5 w-5" />
            <span>SW30</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard" className="mx-auto text-emerald-500">
            <TrendingUp className="h-5 w-5" />
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100',
            collapsed && 'absolute -right-3 top-4 z-10 bg-zinc-900 border border-zinc-800'
          )}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        <nav className="space-y-1 px-2">
          {mainRoutes.map((route) => {
            const isActive = pathname.startsWith(route.href);
            const Icon = route.icon;
            
            return (
              <Link
                key={route.name}
                href={route.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive 
                    ? 'bg-zinc-800/80 text-emerald-500' 
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100',
                  collapsed && 'justify-center px-0'
                )}
                title={collapsed ? route.name : undefined}
              >
                <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-emerald-500' : 'text-zinc-400')} />
                {!collapsed && <span>{route.name}</span>}
              </Link>
            );
          })}
        </nav>

        {isAdmin && (
          <div className="mt-8">
            {!collapsed && (
              <h3 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Administration
              </h3>
            )}
            {collapsed && <div className="mx-4 my-2 border-t border-zinc-800" />}
            <nav className="space-y-1 px-2">
              {adminRoutes.map((route) => {
                const isActive = pathname.startsWith(route.href);
                const Icon = route.icon;
                
                return (
                  <Link
                    key={route.name}
                    href={route.href}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive 
                        ? 'bg-zinc-800/80 text-emerald-500' 
                        : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100',
                      collapsed && 'justify-center px-0'
                    )}
                    title={collapsed ? route.name : undefined}
                  >
                    <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-emerald-500' : 'text-zinc-400')} />
                    {!collapsed && <span>{route.name}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </aside>
  );
}
