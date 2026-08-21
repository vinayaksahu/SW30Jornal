'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Prisma, TradeDirection } from '@prisma/client';

export interface GetTradesParams {
  search?: string;
  page?: number;
  limit?: number;
  symbol?: string;
  winLoss?: 'win' | 'loss';
  strategyId?: string;
  ruleStatus?: string;
  newsStatus?: string;
  accountId?: string;
  dateRange?: { from: Date; to: Date };
}

export async function getTrades(params: GetTradesParams) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const {
    search, page = 1, limit = 10, symbol, winLoss,
    strategyId, ruleStatus, newsStatus, accountId, dateRange
  } = params;

  const skip = (page - 1) * limit;

  const where: Prisma.TradeWhereInput = {
    userId: session.user.id,
    ...(accountId && { accountId }),
    ...(symbol && { symbol: { contains: symbol, mode: 'insensitive' } }),
    ...(strategyId && { strategyId }),
    ...(ruleStatus && { ruleStatus }),
    ...(newsStatus && { newsStatus }),
    ...(dateRange && {
      entryTime: {
        gte: dateRange.from,
        lte: dateRange.to
      }
    }),
    ...(search && {
      OR: [
        { symbol: { contains: search, mode: 'insensitive' } },
        { ticketNumber: { contains: search, mode: 'insensitive' } }
      ]
    })
  };

  if (winLoss === 'win') {
    where.profitLoss = { gt: 0 };
  } else if (winLoss === 'loss') {
    where.profitLoss = { lt: 0 };
  }

  const [trades, total] = await Promise.all([
    prisma.trade.findMany({
      where,
      skip,
      take: limit,
      orderBy: { entryTime: 'desc' },
      include: {
        account: { select: { name: true } },
        strategy: { select: { name: true } }
      }
    }),
    prisma.trade.count({ where })
  ]);

  return {
    trades,
    total,
    pages: Math.ceil(total / limit)
  };
}

export async function getTrade(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const trade = await prisma.trade.findUnique({
    where: { id },
    include: {
      mt5Evidence: true,
      chartEvidence: {
        orderBy: { displayOrder: 'asc' }
      },
      ruleViolations: {
        include: { rule: true }
      },
      strategy: true,
      account: true
    }
  });

  if (!trade || trade.userId !== session.user.id) {
    throw new Error('Trade not found or unauthorized');
  }

  return trade;
}

export interface CreateTradeData {
  accountId: string;
  ticketNumber?: string;
  symbol: string;
  direction: TradeDirection;
  volume: number;
  entryPrice: number;
  exitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  profitLoss?: number;
  commission?: number;
  swap?: number;
  entryTime: Date;
  exitTime?: Date;
  strategyId?: string;
  notes?: string;
  mt5Evidence?: {
    storageUrl: string;
    originalFilename: string;
    fileSize: number;
    mimeType: string;
    ocrRawData?: any;
  }[];
  chartEvidence?: {
    storageUrl: string;
    originalFilename: string;
    fileSize: number;
    mimeType: string;
    caption?: string;
    notes?: string;
  }[];
}

export async function createTrade(data: CreateTradeData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const account = await prisma.account.findFirst({
    where: { id: data.accountId, userId: session.user.id }
  });

  if (!account) throw new Error('Account not found or unauthorized');

  // Evaluate News Protection
  const { NewsProtectionEngine } = await import('@/lib/services/news-service');
  let newsStatus = 'CLEAN';
  try {
    const newsCheck = await NewsProtectionEngine.checkNewsProtection(
      data.symbol,
      data.entryTime,
      data.accountId
    );
    if (newsCheck.isRestricted) {
      newsStatus = 'VIOLATED';
    } else if (newsCheck.isOverridden) {
      newsStatus = 'OVERRIDDEN';
    } else if (newsCheck.activeEvents.length > 0) {
      newsStatus = 'WARNING';
    }
  } catch {
    // news check fallback
  }

  const profitLoss = data.profitLoss || 0;
  const commission = data.commission || 0;
  const swap = data.swap || 0;
  const netProfit = profitLoss - commission - swap;

  const trade = await prisma.$transaction(async (tx) => {
    const newTrade = await tx.trade.create({
      data: {
        userId: session.user.id,
        accountId: data.accountId,
        ticketNumber: data.ticketNumber,
        symbol: data.symbol,
        direction: data.direction,
        volume: data.volume,
        entryPrice: data.entryPrice,
        exitPrice: data.exitPrice,
        stopLoss: data.stopLoss,
        takeProfit: data.takeProfit,
        profitLoss: data.profitLoss,
        commission: data.commission,
        swap: data.swap,
        entryTime: data.entryTime,
        exitTime: data.exitTime,
        strategyId: data.strategyId,
        notes: data.notes,
        newsStatus: newsStatus,
        mt5Evidence: {
          create: data.mt5Evidence || []
        },
        chartEvidence: {
          create: (data.chartEvidence || []).map((ev, idx) => ({
            ...ev,
            displayOrder: idx
          }))
        }
      }
    });

    // Update account balance
    await tx.account.update({
      where: { id: data.accountId },
      data: {
        currentBalance: { increment: netProfit },
        equity: { increment: netProfit }
      }
    });

    return newTrade;
  });

  revalidatePath('/trades');
  revalidatePath('/dashboard');
  revalidatePath('/accounts');
  revalidatePath('/calendar');
  revalidatePath('/analytics');

  return trade;
}

export async function updateTrade(id: string, data: Partial<CreateTradeData>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const existingTrade = await prisma.trade.findFirst({
    where: { id, userId: session.user.id }
  });

  if (!existingTrade) throw new Error('Trade not found');

  // Calculate balance differences
  const oldNetProfit = Number(existingTrade.profitLoss || 0) - Number(existingTrade.commission || 0) - Number(existingTrade.swap || 0);
  
  const newProfitLoss = data.profitLoss !== undefined ? data.profitLoss : Number(existingTrade.profitLoss || 0);
  const newCommission = data.commission !== undefined ? data.commission : Number(existingTrade.commission || 0);
  const newSwap = data.swap !== undefined ? data.swap : Number(existingTrade.swap || 0);
  const newNetProfit = newProfitLoss - newCommission - newSwap;
  
  const balanceDiff = newNetProfit - oldNetProfit;

  const trade = await prisma.$transaction(async (tx) => {
    const updated = await tx.trade.update({
      where: { id },
      data: {
        ticketNumber: data.ticketNumber,
        symbol: data.symbol,
        direction: data.direction,
        volume: data.volume,
        entryPrice: data.entryPrice,
        exitPrice: data.exitPrice,
        stopLoss: data.stopLoss,
        takeProfit: data.takeProfit,
        profitLoss: data.profitLoss,
        commission: data.commission,
        swap: data.swap,
        entryTime: data.entryTime,
        exitTime: data.exitTime,
        strategyId: data.strategyId,
        notes: data.notes,
      }
    });

    if (balanceDiff !== 0) {
      await tx.account.update({
        where: { id: existingTrade.accountId },
        data: {
          currentBalance: { increment: balanceDiff },
          equity: { increment: balanceDiff }
        }
      });
    }

    return updated;
  });

  revalidatePath('/trades');
  revalidatePath('/dashboard');
  revalidatePath('/accounts');
  
  return trade;
}

export async function deleteTrade(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const existingTrade = await prisma.trade.findFirst({
    where: { id, userId: session.user.id }
  });

  if (!existingTrade) throw new Error('Trade not found');

  const oldNetProfit = Number(existingTrade.profitLoss || 0) - Number(existingTrade.commission || 0) - Number(existingTrade.swap || 0);

  await prisma.$transaction(async (tx) => {
    await tx.trade.delete({ where: { id } });

    await tx.account.update({
      where: { id: existingTrade.accountId },
      data: {
        currentBalance: { decrement: oldNetProfit },
        equity: { decrement: oldNetProfit }
      }
    });
  });

  revalidatePath('/trades');
  revalidatePath('/dashboard');
  revalidatePath('/accounts');
}

export async function addTradeEvidence(tradeId: string, data: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const trade = await prisma.trade.findFirst({
    where: { id: tradeId, userId: session.user.id }
  });

  if (!trade) throw new Error('Trade not found');

  const maxOrder = await prisma.tradeChartEvidence.aggregate({
    where: { tradeId },
    _max: { displayOrder: true }
  });

  const evidence = await prisma.tradeChartEvidence.create({
    data: {
      tradeId,
      ...data,
      displayOrder: (maxOrder._max.displayOrder ?? -1) + 1
    }
  });

  revalidatePath(`/trades/${tradeId}`);
  return evidence;
}

export async function deleteTradeEvidence(evidenceId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const evidence = await prisma.tradeChartEvidence.findUnique({
    where: { id: evidenceId },
    include: { trade: true }
  });

  if (!evidence || evidence.trade.userId !== session.user.id) {
    throw new Error('Evidence not found or unauthorized');
  }

  await prisma.tradeChartEvidence.delete({ where: { id: evidenceId } });
  revalidatePath(`/trades/${evidence.tradeId}`);
}

export async function reorderTradeEvidence(tradeId: string, orderedEvidenceIds: string[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const trade = await prisma.trade.findFirst({
    where: { id: tradeId, userId: session.user.id }
  });

  if (!trade) throw new Error('Trade not found');

  await prisma.$transaction(
    orderedEvidenceIds.map((id, index) =>
      prisma.tradeChartEvidence.update({
        where: { id },
        data: { displayOrder: index }
      })
    )
  );

  revalidatePath(`/trades/${tradeId}`);
}
