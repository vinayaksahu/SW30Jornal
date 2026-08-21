'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface NewsImpactBadgeProps {
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  showIcon?: boolean;
  pulse?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export function NewsImpactBadge({
  impact,
  showIcon = true,
  pulse = false,
  className = '',
  size = 'md',
}: NewsImpactBadgeProps) {
  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-0.5';

  if (impact === 'HIGH') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-semibold rounded-full border bg-red-500/10 text-red-400 border-red-500/25 ${sizeClasses} ${className}`}
      >
        {pulse ? (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
        ) : showIcon ? (
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
        ) : null}
        <span>HIGH</span>
      </span>
    );
  }

  if (impact === 'MEDIUM') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-semibold rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/25 ${sizeClasses} ${className}`}
      >
        {pulse ? (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
        ) : showIcon ? (
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
        ) : null}
        <span>MEDIUM</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/25 ${sizeClasses} ${className}`}
    >
      {showIcon && <Info className="h-3.5 w-3.5 shrink-0 text-emerald-400" />}
      <span>LOW</span>
    </span>
  );
}
