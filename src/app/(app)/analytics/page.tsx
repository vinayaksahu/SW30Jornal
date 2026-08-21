import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import AnalyticsClient from './analytics-client';

export const metadata = {
  title: 'Analytics & Performance | SW30 Prop Firm Journal',
  description: 'Deep trading statistics, equity curve analysis, session edge, and strategy comparisons.',
};

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  // 1. Fetch user settings for default account
  const userSettings = await db.userSettings.findUnique({
    where: { userId: session.user.id },
  });

  // 2. Fetch all user accounts
  const accountsRaw = await db.account.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  let activeAccountRaw = null;
  if (userSettings?.defaultAccountId) {
    activeAccountRaw = accountsRaw.find((a) => a.id === userSettings.defaultAccountId) || null;
  }
  if (!activeAccountRaw && accountsRaw.length > 0) {
    activeAccountRaw = accountsRaw[0];
  }

  // 3. Fetch all trades for the user
  const tradesRaw = await db.trade.findMany({
    where: { userId: session.user.id },
    orderBy: { entryTime: 'asc' },
    include: {
      strategy: { select: { id: true, name: true } },
      account: { select: { id: true, name: true } },
    },
  });

  // Safely serialize for Client Component
  const accounts = accountsRaw.map((a) => ({
    id: a.id,
    name: a.name,
    propFirm: a.propFirm,
    accountSize: Number(a.accountSize),
    startingBalance: Number(a.startingBalance),
    currentBalance: Number(a.currentBalance),
    equity: Number(a.equity),
    profitTarget: Number(a.profitTarget),
    dailyDrawdownLimit: Number(a.dailyDrawdownLimit),
    maxDrawdownLimit: Number(a.maxDrawdownLimit),
    minTradingDays: a.minTradingDays,
    status: a.status,
  }));

  const activeAccount = activeAccountRaw
    ? {
        id: activeAccountRaw.id,
        name: activeAccountRaw.name,
        propFirm: activeAccountRaw.propFirm,
        accountSize: Number(activeAccountRaw.accountSize),
        startingBalance: Number(activeAccountRaw.startingBalance),
        currentBalance: Number(activeAccountRaw.currentBalance),
        equity: Number(activeAccountRaw.equity),
        profitTarget: Number(activeAccountRaw.profitTarget),
        dailyDrawdownLimit: Number(activeAccountRaw.dailyDrawdownLimit),
        maxDrawdownLimit: Number(activeAccountRaw.maxDrawdownLimit),
        minTradingDays: activeAccountRaw.minTradingDays,
        status: activeAccountRaw.status,
      }
    : null;

  const trades = tradesRaw.map((t) => ({
    id: t.id,
    accountId: t.accountId,
    ticketNumber: t.ticketNumber,
    symbol: t.symbol,
    direction: t.direction,
    volume: Number(t.volume),
    entryPrice: Number(t.entryPrice),
    exitPrice: t.exitPrice ? Number(t.exitPrice) : null,
    stopLoss: t.stopLoss ? Number(t.stopLoss) : null,
    takeProfit: t.takeProfit ? Number(t.takeProfit) : null,
    profitLoss: t.profitLoss ? Number(t.profitLoss) : 0,
    commission: t.commission ? Number(t.commission) : 0,
    swap: t.swap ? Number(t.swap) : 0,
    entryTime: t.entryTime.toISOString(),
    exitTime: t.exitTime ? t.exitTime.toISOString() : null,
    durationSeconds: t.durationSeconds,
    strategyId: t.strategyId,
    strategy: t.strategy ? { id: t.strategy.id, name: t.strategy.name } : null,
    account: t.account ? { id: t.account.id, name: t.account.name } : null,
    rrRatio: t.rrRatio ? Number(t.rrRatio) : null,
    ruleStatus: t.ruleStatus,
    newsStatus: t.newsStatus,
    notes: t.notes,
  }));

  return (
    <AnalyticsClient
      accounts={accounts}
      activeAccount={activeAccount}
      trades={trades}
    />
  );
}
