import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import DashboardClient from './dashboard-client';

export const metadata = {
  title: 'Dashboard | SW30 Prop Firm Journal',
  description: 'Trading dashboard overview, equity curve, prop firm challenge status, and recent trades.',
};

export default async function DashboardPage() {
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

  // Determine active account
  let activeAccountRaw = null;
  if (userSettings?.defaultAccountId) {
    activeAccountRaw = accountsRaw.find((a) => a.id === userSettings.defaultAccountId) || null;
  }
  if (!activeAccountRaw && accountsRaw.length > 0) {
    activeAccountRaw = accountsRaw[0];
  }

  // 3. Fetch trades for active account (or all user's trades if no account)
  const tradesRaw = await db.trade.findMany({
    where: {
      userId: session.user.id,
      ...(activeAccountRaw ? { accountId: activeAccountRaw.id } : {}),
    },
    orderBy: { entryTime: 'asc' },
    include: {
      strategy: { select: { id: true, name: true } },
      account: { select: { id: true, name: true } },
    },
  });

  // 4. Fetch enabled trading rules for the active account
  const rulesRaw = activeAccountRaw
    ? await db.tradingRule.findMany({
        where: {
          accountId: activeAccountRaw.id,
          userId: session.user.id,
          status: 'ENABLED',
        },
      })
    : [];

  // 5. Fetch strategies
  const strategiesRaw = await db.strategy.findMany({
    where: { userId: session.user.id, isActive: true },
  });

  // Safe Serialization for Next.js App Router (Convert Decimals and Dates)
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
    maxRiskPerTrade: a.maxRiskPerTrade ? Number(a.maxRiskPerTrade) : null,
    maxTradesPerDay: a.maxTradesPerDay,
    maxLotSize: a.maxLotSize ? Number(a.maxLotSize) : null,
    minTradingDays: a.minTradingDays,
    newsRestrictions: a.newsRestrictions,
    weekendRestrictions: a.weekendRestrictions,
    status: a.status,
    createdAt: a.createdAt.toISOString(),
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
        maxRiskPerTrade: activeAccountRaw.maxRiskPerTrade
          ? Number(activeAccountRaw.maxRiskPerTrade)
          : null,
        maxTradesPerDay: activeAccountRaw.maxTradesPerDay,
        maxLotSize: activeAccountRaw.maxLotSize ? Number(activeAccountRaw.maxLotSize) : null,
        minTradingDays: activeAccountRaw.minTradingDays,
        newsRestrictions: activeAccountRaw.newsRestrictions,
        weekendRestrictions: activeAccountRaw.weekendRestrictions,
        status: activeAccountRaw.status,
        createdAt: activeAccountRaw.createdAt.toISOString(),
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

  const rules = rulesRaw.map((r) => ({
    id: r.id,
    accountId: r.accountId,
    category: r.category,
    ruleType: r.ruleType,
    name: r.name,
    description: r.description,
    config: r.config,
    status: r.status,
  }));

  const strategies = strategiesRaw.map((s) => ({
    id: s.id,
    name: s.name,
    market: s.market,
    timeframe: s.timeframe,
    isActive: s.isActive,
  }));

  return (
    <DashboardClient
      accounts={accounts}
      activeAccount={activeAccount}
      trades={trades}
      rules={rules}
      strategies={strategies}
    />
  );
}
