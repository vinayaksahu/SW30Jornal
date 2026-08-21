'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export interface BackupPayload {
  version: string;
  exportedAt: string;
  user: {
    name: string | null;
    email: string;
    role: string;
  };
  accounts: any[];
  strategies: any[];
  tradingRules: any[];
  trades: any[];
  newsSettings: any[];
  newsWindows: any[];
}

export async function exportFullDatabaseJson(): Promise<BackupPayload> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const userId = session.user.id;

  const [user, accounts, strategies, tradingRules, trades, newsSettings, newsWindows] =
    await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, role: true },
      }),
      db.account.findMany({
        where: { userId },
      }),
      db.strategy.findMany({
        where: { userId },
      }),
      db.tradingRule.findMany({
        where: { userId },
      }),
      db.trade.findMany({
        where: { userId },
        include: {
          mt5Evidence: true,
          chartEvidence: true,
          ruleViolations: true,
        },
      }),
      db.newsSettings.findMany({
        where: { account: { userId } },
      }),
      db.newsWindow.findMany({
        where: { account: { userId } },
      }),
    ]);

  if (!user) throw new Error('User not found');

  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    user,
    accounts,
    strategies,
    tradingRules,
    trades,
    newsSettings,
    newsWindows,
  };
}

export async function exportTradesCsv(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const trades = await db.trade.findMany({
    where: { userId: session.user.id },
    orderBy: { entryTime: 'asc' },
    include: {
      account: { select: { name: true, propFirm: true } },
      strategy: { select: { name: true } },
    },
  });

  const headers = [
    'ID',
    'Ticket Number',
    'Account Name',
    'Prop Firm',
    'Symbol',
    'Direction',
    'Volume (Lots)',
    'Entry Price',
    'Exit Price',
    'Stop Loss',
    'Take Profit',
    'Gross P/L ($)',
    'Commission ($)',
    'Swap ($)',
    'Net P/L ($)',
    'RR Ratio',
    'Strategy',
    'Rule Status',
    'News Status',
    'Entry Time (UTC)',
    'Exit Time (UTC)',
    'Duration (Seconds)',
    'Notes',
  ];

  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = trades.map((t) => {
    const profitLoss = Number(t.profitLoss || 0);
    const commission = Number(t.commission || 0);
    const swap = Number(t.swap || 0);
    const netPnL = profitLoss - commission - swap;

    return [
      escapeCsv(t.id),
      escapeCsv(t.ticketNumber || ''),
      escapeCsv(t.account?.name || ''),
      escapeCsv(t.account?.propFirm || ''),
      escapeCsv(t.symbol),
      escapeCsv(t.direction),
      escapeCsv(Number(t.volume)),
      escapeCsv(Number(t.entryPrice)),
      escapeCsv(t.exitPrice ? Number(t.exitPrice) : ''),
      escapeCsv(t.stopLoss ? Number(t.stopLoss) : ''),
      escapeCsv(t.takeProfit ? Number(t.takeProfit) : ''),
      escapeCsv(profitLoss),
      escapeCsv(commission),
      escapeCsv(swap),
      escapeCsv(netPnL),
      escapeCsv(t.rrRatio ? Number(t.rrRatio) : ''),
      escapeCsv(t.strategy?.name || ''),
      escapeCsv(t.ruleStatus || 'COMPLIANT'),
      escapeCsv(t.newsStatus || 'CLEAN'),
      escapeCsv(t.entryTime.toISOString()),
      escapeCsv(t.exitTime ? t.exitTime.toISOString() : ''),
      escapeCsv(t.durationSeconds || ''),
      escapeCsv(t.notes || ''),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export async function importFullDatabaseJson(data: BackupPayload) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const userId = session.user.id;

  if (!data || !data.version) {
    throw new Error('Invalid backup file format: missing version header');
  }

  // Import accounts first
  const accountIdMap = new Map<string, string>();
  if (Array.isArray(data.accounts)) {
    for (const acc of data.accounts) {
      const existing = await db.account.findFirst({
        where: { userId, name: acc.name },
      });

      if (existing) {
        accountIdMap.set(acc.id, existing.id);
      } else {
        const created = await db.account.create({
          data: {
            userId,
            name: acc.name,
            propFirm: acc.propFirm,
            accountSize: Number(acc.accountSize),
            startingBalance: Number(acc.startingBalance),
            currentBalance: Number(acc.currentBalance),
            equity: Number(acc.equity),
            profitTarget: Number(acc.profitTarget),
            dailyDrawdownLimit: Number(acc.dailyDrawdownLimit),
            maxDrawdownLimit: Number(acc.maxDrawdownLimit),
            maxRiskPerTrade: acc.maxRiskPerTrade ? Number(acc.maxRiskPerTrade) : null,
            maxTradesPerDay: acc.maxTradesPerDay,
            maxLotSize: acc.maxLotSize ? Number(acc.maxLotSize) : null,
            minTradingDays: acc.minTradingDays,
            newsRestrictions: acc.newsRestrictions ?? true,
            weekendRestrictions: acc.weekendRestrictions ?? true,
            status: acc.status || 'ACTIVE',
          },
        });
        accountIdMap.set(acc.id, created.id);
      }
    }
  }

  // Import strategies
  const strategyIdMap = new Map<string, string>();
  if (Array.isArray(data.strategies)) {
    for (const strat of data.strategies) {
      const existing = await db.strategy.findFirst({
        where: { userId, name: strat.name },
      });

      if (existing) {
        strategyIdMap.set(strat.id, existing.id);
      } else {
        const created = await db.strategy.create({
          data: {
            userId,
            name: strat.name,
            notes: (strat as any).notes || (strat as any).description || '',
            market: strat.market || 'Forex',
            timeframe: strat.timeframe || '15m',
            isActive: strat.isActive ?? true,
          },
        });
        strategyIdMap.set(strat.id, created.id);
      }
    }
  }

  // Import trading rules
  if (Array.isArray(data.tradingRules)) {
    for (const rule of data.tradingRules) {
      const mappedAccountId = rule.accountId ? accountIdMap.get(rule.accountId) : null;
      if (!mappedAccountId) continue;

      const existing = await db.tradingRule.findFirst({
        where: {
          userId,
          name: rule.name,
          accountId: mappedAccountId,
        },
      });

      if (!existing) {
        await db.tradingRule.create({
          data: {
            userId,
            accountId: mappedAccountId,
            name: rule.name,
            description: rule.description,
            ruleType: rule.ruleType,
            category: rule.category || 'ACCOUNT',
            config: rule.config || {},
            status: rule.status || 'ENABLED',
          },
        });
      }
    }
  }

  // Import trades
  let importedTradesCount = 0;
  if (Array.isArray(data.trades)) {
    for (const trade of data.trades) {
      const mappedAccountId = accountIdMap.get(trade.accountId);
      if (!mappedAccountId) continue;

      const mappedStrategyId = trade.strategyId ? strategyIdMap.get(trade.strategyId) : null;

      // Check if trade already exists by ticket number or entry time + symbol
      const existing = trade.ticketNumber
        ? await db.trade.findFirst({
            where: { accountId: mappedAccountId, ticketNumber: trade.ticketNumber },
          })
        : null;

      if (!existing) {
        await db.trade.create({
          data: {
            userId,
            accountId: mappedAccountId,
            ticketNumber: trade.ticketNumber,
            symbol: trade.symbol,
            direction: trade.direction,
            volume: Number(trade.volume),
            entryPrice: Number(trade.entryPrice),
            exitPrice: trade.exitPrice ? Number(trade.exitPrice) : null,
            stopLoss: trade.stopLoss ? Number(trade.stopLoss) : null,
            takeProfit: trade.takeProfit ? Number(trade.takeProfit) : null,
            profitLoss: trade.profitLoss ? Number(trade.profitLoss) : 0,
            commission: trade.commission ? Number(trade.commission) : 0,
            swap: trade.swap ? Number(trade.swap) : 0,
            entryTime: new Date(trade.entryTime),
            exitTime: trade.exitTime ? new Date(trade.exitTime) : null,
            durationSeconds: trade.durationSeconds,
            strategyId: mappedStrategyId,
            notes: trade.notes,
            ruleStatus: trade.ruleStatus || 'COMPLIANT',
            newsStatus: trade.newsStatus || 'CLEAN',
            mt5Evidence: {
              create: (trade.mt5Evidence || []).map((ev: any) => ({
                filePath: ev.filePath,
                fileType: ev.fileType || 'MT5_HISTORY',
                ocrRawText: ev.ocrRawText,
                ocrConfidence: ev.ocrConfidence ? Number(ev.ocrConfidence) : null,
                metadata: ev.metadata || {},
              })),
            },
            chartEvidence: {
              create: (trade.chartEvidence || []).map((ev: any, idx: number) => ({
                filePath: ev.filePath,
                caption: ev.caption,
                timeframe: ev.timeframe,
                notes: ev.notes,
                displayOrder: ev.displayOrder ?? idx,
              })),
            },
          },
        });
        importedTradesCount++;
      }
    }
  }

  revalidatePath('/dashboard');
  revalidatePath('/trades');
  revalidatePath('/accounts');
  revalidatePath('/strategies');
  revalidatePath('/rules');
  revalidatePath('/calendar');
  revalidatePath('/analytics');

  return {
    success: true,
    importedAccounts: accountIdMap.size,
    importedStrategies: strategyIdMap.size,
    importedTradesCount,
  };
}

export async function syncGithubGist(params: {
  token: string;
  gistId?: string;
  description?: string;
  isPublic?: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const { token, gistId, description = 'SW30 Prop Firm Trading Journal Backup', isPublic = false } = params;

  if (!token || token.trim().length === 0) {
    throw new Error('GitHub Personal Access Token (PAT) is required');
  }

  // Export full JSON database
  const backupData = await exportFullDatabaseJson();
  const backupContent = JSON.stringify(backupData, null, 2);

  const payload = {
    description,
    public: isPublic,
    files: {
      'sw30-journal-backup.json': {
        content: backupContent,
      },
    },
  };

  const url = gistId ? `https://api.github.com/gists/${gistId}` : 'https://api.github.com/gists';
  const method = gistId ? 'PATCH' : 'POST';

  const res = await fetch(url, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'SW30-Trading-Journal',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(`GitHub Gist API error (${res.status}): ${errorBody.message || res.statusText}`);
  }

  const result = await res.json();

  return {
    success: true,
    gistId: result.id,
    htmlUrl: result.html_url,
    updatedAt: result.updated_at,
  };
}
