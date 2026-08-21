'use client';

import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { Bell, Sun, Moon, LogOut, User as UserIcon } from 'lucide-react';
import { User } from 'next-auth';

interface TopbarProps {
  user: User;
}

export default function Topbar({ user }: TopbarProps) {
  const [time, setTime] = useState<string>('');
  const { theme, setTheme } = useTheme();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      };
      
      const formatted = new Intl.DateTimeFormat('en-IN', options).format(now);
      setTime(`${formatted} IST`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 md:px-6">
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 rounded-md bg-zinc-900/50 px-3 py-1.5 border border-zinc-800/50">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-zinc-300 font-mono">{time || 'Loading time...'}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* News Indicator Placeholder */}
        <div className="hidden sm:flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-500 border border-emerald-500/20">
          <span>High Impact News in 2h 15m</span>
        </div>

        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
        >
          {mounted && theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : mounted ? (
            <Moon className="h-4 w-4" />
          ) : (
            <div className="h-4 w-4" />
          )}
          <span className="sr-only">Toggle theme</span>
        </button>

        <button className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors relative">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500 border border-zinc-950" />
        </button>

        <div className="relative">
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-100 hover:ring-2 hover:ring-emerald-500 hover:ring-offset-2 hover:ring-offset-zinc-950 transition-all"
          >
            <UserIcon className="h-4 w-4" />
          </button>

          {isProfileOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsProfileOpen(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-md border border-zinc-800 bg-zinc-950 py-1 shadow-xl">
                <div className="px-4 py-2 border-b border-zinc-800">
                  <p className="text-sm font-medium text-zinc-100 truncate">{user.name}</p>
                  <p className="text-xs text-zinc-400 truncate">{user.email}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-zinc-900 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
