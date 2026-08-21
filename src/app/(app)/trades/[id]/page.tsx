import { Suspense } from 'react';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { TradeDetailClient } from './trade-detail-client';

export default async function TradeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { id } = await params;

  const trade = await db.trade.findUnique({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      account: true,
      strategy: true,
      mt5Evidence: true,
      chartEvidence: true,
      ruleViolations: {
        include: { rule: true },
      },
    },
  });

  if (!trade) notFound();

  // Serialize complex data
  const serializedTrade = {
    ...trade,
    volume: Number(trade.volume),
    entryPrice: Number(trade.entryPrice),
    exitPrice: trade.exitPrice ? Number(trade.exitPrice) : null,
    stopLoss: trade.stopLoss ? Number(trade.stopLoss) : null,
    takeProfit: trade.takeProfit ? Number(trade.takeProfit) : null,
    profitLoss: trade.profitLoss ? Number(trade.profitLoss) : null,
    commission: Number(trade.commission),
    swap: Number(trade.swap),
    rrRatio: trade.rrRatio ? Number(trade.rrRatio) : null,
    entryTime: trade.entryTime.toISOString(),
    exitTime: trade.exitTime ? trade.exitTime.toISOString() : null,
    createdAt: trade.createdAt.toISOString(),
    updatedAt: trade.updatedAt.toISOString(),
    mt5Evidence: trade.mt5Evidence.map((e) => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
    })),
    chartEvidence: trade.chartEvidence.map((e) => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    })),
    ruleViolations: trade.ruleViolations.map((rv) => ({
      ...rv,
      createdAt: rv.createdAt.toISOString(),
    })),
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-7xl mx-auto">
      <Suspense fallback={<div className="text-zinc-400">Loading trade...</div>}>
        <TradeDetailClient trade={serializedTrade as any} />
      </Suspense>
    </div>
  );
}
