'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { NewsImpact, NewsProtectionMode, Prisma } from '@prisma/client';
import { z } from 'zod';
import {
  getNewsProvider,
  NewsItem,
  NewsProtectionEngine,
  NewsCheckResult,
  DEFAULT_PROTECTION_CONFIG,
  getAffectedCurrenciesForSymbol,
  parseAndNormalizeNewsJson,
} from '@/lib/services/news-service';

export interface GetNewsEventsParams {
  from?: string | Date;
  to?: string | Date;
  impact?: NewsImpact | 'ALL';
  country?: string;
  search?: string;
}

const newsSettingSchema = z.object({
  impactLevel: z.nativeEnum(NewsImpact),
  beforeMinutes: z.coerce.number().min(0).max(360),
  afterMinutes: z.coerce.number().min(0).max(360),
  mode: z.nativeEnum(NewsProtectionMode),
});

const updateNewsSettingsSchema = z.object({
  accountId: z.string().min(1),
  settings: z.array(newsSettingSchema),
});

/**
 * Fetch news events from database, with auto-sync fallback if database is empty
 */
export async function getNewsEvents(params?: GetNewsEventsParams): Promise<NewsItem[]> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const now = new Date();
  
  // Default range: 7 days in past to 14 days in future
  const fromDate = params?.from
    ? new Date(params.from)
    : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const toDate = params?.to
    ? new Date(params.to)
    : new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  // Check if events exist in DB
  const totalCount = await prisma.newsEvent.count();
  if (totalCount === 0) {
    await syncNewsEventsInternal();
  }

  const where: Prisma.NewsEventWhereInput = {
    isActive: true,
    eventTime: {
      gte: fromDate,
      lte: toDate,
    },
  };

  if (params?.impact && params.impact !== 'ALL') {
    where.impact = params.impact;
  }

  if (params?.country && params.country !== 'ALL') {
    where.symbolMappings = {
      some: {
        symbol: {
          equals: params.country.toUpperCase(),
          mode: 'insensitive',
        },
      },
    };
  }

  if (params?.search && params.search.trim()) {
    const term = params.search.trim();
    where.OR = [
      { eventName: { contains: term, mode: 'insensitive' } },
      {
        symbolMappings: {
          some: {
            symbol: { contains: term, mode: 'insensitive' },
          },
        },
      },
    ];
  }

  const dbEvents = await prisma.newsEvent.findMany({
    where,
    include: {
      symbolMappings: true,
    },
    orderBy: {
      eventTime: 'asc',
    },
  });

  return dbEvents.map((e) => ({
    id: e.id,
    title: e.eventName,
    country: e.symbolMappings[0]?.symbol || 'USD',
    impact: e.impact as 'LOW' | 'MEDIUM' | 'HIGH',
    time: e.eventTime,
    source: e.source || 'Economic Calendar',
  }));
}

/**
 * Get account-specific news protection settings (or seed defaults)
 */
export async function getAccountNewsSettings(accountId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const account = await prisma.account.findFirst({
    where: { id: accountId, userId: session.user.id },
  });
  if (!account) throw new Error('Account not found or unauthorized');

  let settings = await prisma.newsSettings.findMany({
    where: { accountId },
  });

  // If settings are not initialized for all 3 impact levels, seed them
  const requiredLevels: NewsImpact[] = ['HIGH', 'MEDIUM', 'LOW'];
  const missingLevels = requiredLevels.filter(
    (lvl) => !settings.some((s) => s.impactLevel === lvl)
  );

  if (missingLevels.length > 0) {
    for (const lvl of missingLevels) {
      const def = DEFAULT_PROTECTION_CONFIG[lvl];
      const created = await prisma.newsSettings.upsert({
        where: {
          accountId_impactLevel: {
            accountId,
            impactLevel: lvl,
          },
        },
        update: {},
        create: {
          accountId,
          userId: session.user.id,
          impactLevel: lvl,
          beforeMinutes: def.beforeMinutes,
          afterMinutes: def.afterMinutes,
          mode: def.mode,
        },
      });
      settings.push(created);
    }
  }

  // Sort HIGH, MEDIUM, LOW
  const order: Record<NewsImpact, number> = { HIGH: 1, MEDIUM: 2, LOW: 3 };
  return settings.sort((a, b) => order[a.impactLevel] - order[b.impactLevel]);
}

/**
 * Update account-specific news protection thresholds
 */
export async function updateAccountNewsSettings(
  accountId: string,
  settings: {
    impactLevel: NewsImpact;
    beforeMinutes: number;
    afterMinutes: number;
    mode: NewsProtectionMode;
  }[]
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const parsed = updateNewsSettingsSchema.parse({ accountId, settings });

  const account = await prisma.account.findFirst({
    where: { id: parsed.accountId, userId: session.user.id },
  });
  if (!account) throw new Error('Account not found or unauthorized');

  const results = await prisma.$transaction(
    parsed.settings.map((s) =>
      prisma.newsSettings.upsert({
        where: {
          accountId_impactLevel: {
            accountId: parsed.accountId,
            impactLevel: s.impactLevel,
          },
        },
        update: {
          beforeMinutes: s.beforeMinutes,
          afterMinutes: s.afterMinutes,
          mode: s.mode,
        },
        create: {
          accountId: parsed.accountId,
          userId: session.user.id,
          impactLevel: s.impactLevel,
          beforeMinutes: s.beforeMinutes,
          afterMinutes: s.afterMinutes,
          mode: s.mode,
        },
      })
    )
  );

  revalidatePath('/news');
  revalidatePath('/trades/new');
  revalidatePath('/trades');
  revalidatePath('/accounts');

  return results;
}

/**
 * Server action to evaluate whether a symbol/timestamp is currently in a news window
 */
export async function checkTradeNewsStatus(
  symbol: string,
  timestamp?: string | Date,
  accountId?: string
): Promise<NewsCheckResult> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  let targetAccountId = accountId;

  if (!targetAccountId) {
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    });
    if (userSettings?.defaultAccountId) {
      targetAccountId = userSettings.defaultAccountId;
    } else {
      const firstAccount = await prisma.account.findFirst({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
      });
      targetAccountId = firstAccount?.id;
    }
  }

  const tradeTime = timestamp ? new Date(timestamp) : new Date();

  return await NewsProtectionEngine.checkNewsProtection(
    symbol,
    tradeTime,
    targetAccountId
  );
}

/**
 * Admin override action with mandatory audit log creation
 */
export async function overrideNewsWindow(windowId: string, reason: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  if (session.user.role !== 'ADMIN') {
    throw new Error('Forbidden: Only administrator users can override news restrictions.');
  }

  const result = await NewsProtectionEngine.overrideNewsWindow(
    windowId,
    session.user.id,
    reason
  );

  revalidatePath('/news');
  revalidatePath('/trades/new');
  revalidatePath('/trades');
  revalidatePath('/admin/audit');

  return result;
}

/**
 * Create or Override a News Window for an active event and account (Admin only)
 */
export async function createAndOverrideNewsWindow(
  newsEventId: string,
  accountId: string,
  reason: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  if (session.user.role !== 'ADMIN') {
    throw new Error('Forbidden: Only administrator users can override news restrictions.');
  }

  if (!reason || reason.trim().length < 5) {
    throw new Error('Mandatory override reason (min 5 chars) is required.');
  }

  const event = await prisma.newsEvent.findUnique({
    where: { id: newsEventId },
  });
  if (!event) throw new Error('News event not found');

  const account = await prisma.account.findUnique({
    where: { id: accountId },
  });
  if (!account) throw new Error('Account not found');

  // Look for existing window
  let window = await prisma.newsWindow.findFirst({
    where: { newsEventId, accountId },
  });

  if (window) {
    return await NewsProtectionEngine.overrideNewsWindow(
      window.id,
      session.user.id,
      reason
    );
  }

  // Create news window and override it in transaction
  const newWindow = await prisma.$transaction(async (tx) => {
    const nw = await tx.newsWindow.create({
      data: {
        newsEventId,
        accountId,
        startTime: new Date(event.eventTime.getTime() - 15 * 60 * 1000),
        endTime: new Date(event.eventTime.getTime() + 15 * 60 * 1000),
        mode: NewsProtectionMode.PROTECTION,
        isOverridden: true,
        overriddenById: session.user.id,
        overrideReason: reason.trim(),
      },
    });

    await tx.auditLog.create({
      data: {
        adminId: session.user.id,
        action: 'NEWS_WINDOW_OVERRIDE',
        targetType: 'NewsWindow',
        targetId: nw.id,
        reason: reason.trim(),
        details: {
          windowId: nw.id,
          accountId,
          accountName: account.name,
          newsEventId,
          eventName: event.eventName,
          overrideTimestamp: new Date(),
        },
      },
    });

    return nw;
  });

  revalidatePath('/news');
  revalidatePath('/trades/new');
  revalidatePath('/trades');

  return { success: true, window: newWindow };
}

/**
 * Manual JSON Import Action for ForexFactory, Investing.com, DailyFX, FXStreet feeds
 */
export async function importNewsFromJson(jsonContent: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const normalizedEvents = parseAndNormalizeNewsJson(jsonContent);

    if (!normalizedEvents || normalizedEvents.length === 0) {
      return { error: 'No valid news events found in JSON string' };
    }

    let importedCount = 0;

    for (const event of normalizedEvents) {
      const existing = await prisma.newsEvent.findFirst({
        where: {
          eventName: event.eventName,
          eventTime: event.eventTime,
        },
      });

      if (!existing) {
        await prisma.newsEvent.create({
          data: {
            eventName: event.eventName,
            impact: event.impact,
            eventTime: event.eventTime,
            source: event.source,
            isManual: true,
            isActive: true,
            symbolMappings: {
              create: [{ symbol: event.country.toUpperCase() }],
            },
          },
        });
        importedCount++;
      } else {
        await prisma.newsEvent.update({
          where: { id: existing.id },
          data: {
            impact: event.impact,
          },
        });
      }
    }

    revalidatePath('/news');
    revalidatePath('/admin/news');
    revalidatePath('/trades/new');
    revalidatePath('/trades');

    return { success: true, count: importedCount };
  } catch (error: any) {
    return { error: error.message || 'Failed to import JSON news data' };
  }
}

/**
 * Triggers fetch from news provider and updates database NewsEvent and NewsSymbolMapping tables
 */
export async function syncNewsEvents() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const count = await syncNewsEventsInternal();

  revalidatePath('/news');
  revalidatePath('/trades/new');
  revalidatePath('/trades');

  return { success: true, count };
}

/**
 * Internal synchronizer that loads news items into DB
 */
async function syncNewsEventsInternal(): Promise<number> {
  const provider = getNewsProvider();
  const now = new Date();
  const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const endDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const events = await provider.fetchEvents(startDate, endDate);
  let savedCount = 0;

  for (const item of events) {
    try {
      const impactEnum = item.impact as NewsImpact;

      // Find or create news event
      const existing = await prisma.newsEvent.findFirst({
        where: {
          eventName: item.title,
          eventTime: item.time,
        },
      });

      if (!existing) {
        const created = await prisma.newsEvent.create({
          data: {
            eventName: item.title,
            impact: impactEnum,
            eventTime: item.time,
            source: item.source || 'Economic Calendar',
            isActive: true,
            symbolMappings: {
              create: [
                { symbol: item.country.toUpperCase() },
              ],
            },
          },
        });
        savedCount++;
      }
    } catch {
      // Continue next event
    }
  }

  return savedCount;
}

/**
 * Fetch all currently active news windows for a user or specific account
 */
export async function getActiveNewsStatus(accountId?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const majorSymbols = ['USD', 'EUR', 'GBP', 'JPY', 'XAUUSD', 'US30'];
  const activeResults: NewsCheckResult[] = [];

  for (const sym of majorSymbols) {
    const res = await checkTradeNewsStatus(sym, new Date(), accountId);
    if (res.activeEvents.length > 0) {
      activeResults.push(res);
    }
  }

  return activeResults;
}
