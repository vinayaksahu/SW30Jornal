'use client';

import React from 'react';

interface CurrencyBadgeProps {
  country: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const CURRENCY_CONFIG: Record<
  string,
  { label: string; flag: string; bg: string; text: string; border: string }
> = {
  USD: {
    label: 'USD',
    flag: '🇺🇸',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
  },
  EUR: {
    label: 'EUR',
    flag: '🇪🇺',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/20',
  },
  GBP: {
    label: 'GBP',
    flag: '🇬🇧',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/20',
  },
  JPY: {
    label: 'JPY',
    flag: '🇯🇵',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/20',
  },
  AUD: {
    label: 'AUD',
    flag: '🇦🇺',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
  },
  CAD: {
    label: 'CAD',
    flag: '🇨🇦',
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/20',
  },
  NZD: {
    label: 'NZD',
    flag: '🇳🇿',
    bg: 'bg-teal-500/10',
    text: 'text-teal-400',
    border: 'border-teal-500/20',
  },
  CHF: {
    label: 'CHF',
    flag: '🇨🇭',
    bg: 'bg-violet-500/10',
    text: 'text-violet-400',
    border: 'border-violet-500/20',
  },
  XAU: {
    label: 'GOLD',
    flag: '🥇',
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400',
    border: 'border-yellow-500/20',
  },
  GOLD: {
    label: 'GOLD',
    flag: '🥇',
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400',
    border: 'border-yellow-500/20',
  },
};

export function CurrencyBadge({ country, className = '', size = 'md' }: CurrencyBadgeProps) {
  const code = (country || 'USD').toUpperCase();
  const config = CURRENCY_CONFIG[code] || {
    label: code,
    flag: '🌐',
    bg: 'bg-zinc-800',
    text: 'text-zinc-300',
    border: 'border-zinc-700',
  };

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-0.5 gap-1.5',
    lg: 'text-sm px-2.5 py-1 gap-2',
  };

  return (
    <span
      className={`inline-flex items-center font-mono font-medium rounded-md border ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]} ${className}`}
    >
      <span className="select-none leading-none">{config.flag}</span>
      <span>{config.label}</span>
    </span>
  );
}
