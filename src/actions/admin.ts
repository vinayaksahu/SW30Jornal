'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { Role, NewsImpact } from '@prisma/client';
import { z } from 'zod';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
    throw new Error('Forbidden: Administrator access required');
  }
  return session;
}

export async function getSystemStats() {
  await requireAdmin();

  const [
    totalUsers,
    totalAccounts,
    totalTrades,
    totalViolations,
    activeNewsEvents,
    recentAuditLogsCount,
  ] = await Promise.all([
    db.user.count(),
    db.account.count(),
    db.trade.count(),
    db.ruleViolation.count({ where: { status: 'VIOLATED' } }),
    db.newsEvent.count({ where: { isActive: true } }),
    db.auditLog.count(),
  ]);

  const tradesAggregate = await db.trade.aggregate({
    _sum: {
      volume: true,
      profitLoss: true,
    },
  });

  return {
    totalUsers,
    totalAccounts,
    totalTrades,
    totalViolations,
    activeNewsEvents,
    recentAuditLogsCount,
    totalVolumeTraded: Number(tradesAggregate._sum.volume || 0),
    totalGrossPnL: Number(tradesAggregate._sum.profitLoss || 0),
  };
}

export async function getAdminUsers() {
  await requireAdmin();

  const users = await db.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          accounts: true,
          trades: true,
          strategies: true,
        },
      },
    },
  });

  return users;
}

export async function updateUserRole(userId: string, newRole: Role) {
  const session = await requireAdmin();

  if (userId === session.user.id && newRole !== Role.ADMIN) {
    throw new Error('You cannot remove your own admin privileges');
  }

  const updated = await db.user.update({
    where: { id: userId },
    data: { role: newRole },
    select: { id: true, name: true, email: true, role: true },
  });

  // Create audit log
  await db.auditLog.create({
    data: {
      adminId: session.user.id,
      action: 'USER_ROLE_UPDATED',
      targetType: 'USER',
      targetId: userId,
      details: {
        targetUserId: userId,
        newRole,
        performedBy: session.user.email,
      },
    },
  });

  revalidatePath('/admin');
  revalidatePath('/admin/users');
  return updated;
}

export interface AuditLogQueryParams {
  action?: string;
  targetType?: string;
  limit?: number;
  skip?: number;
}

export async function getAuditLogs(params?: AuditLogQueryParams) {
  await requireAdmin();

  const limit = params?.limit || 50;
  const skip = params?.skip || 0;

  const where: any = {};
  if (params?.action && params.action !== 'ALL') where.action = params.action;
  if (params?.targetType && params.targetType !== 'ALL') where.targetType = params.targetType;

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
      include: {
        admin: { select: { name: true, email: true } },
      },
    }),
    db.auditLog.count({ where }),
  ]);

  return { logs, total };
}

const customNewsEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  country: z.string().min(1, 'Currency/Country is required'),
  impact: z.nativeEnum(NewsImpact),
  eventTime: z.string().or(z.date()),
  forecast: z.string().optional(),
  previous: z.string().optional(),
  actual: z.string().optional(),
});

export async function createCustomNewsEvent(data: z.infer<typeof customNewsEventSchema>) {
  const session = await requireAdmin();
  const validated = customNewsEventSchema.parse(data);

  const eventTime = new Date(validated.eventTime);

  const event = await db.newsEvent.create({
    data: {
      eventName: validated.title,
      impact: validated.impact,
      eventTime,
      source: 'MANUAL_ADMIN',
      isManual: true,
      isActive: true,
      symbolMappings: {
        create: [
          {
            symbol: validated.country.toUpperCase(),
          },
        ],
      },
    },
  });

  await db.auditLog.create({
    data: {
      adminId: session.user.id,
      action: 'NEWS_EVENT_CREATED',
      targetType: 'NEWS_EVENT',
      targetId: event.id,
      details: {
        title: validated.title,
        country: validated.country,
        impact: validated.impact,
        eventTime: eventTime.toISOString(),
      },
    },
  });

  revalidatePath('/news');
  revalidatePath('/admin/news');
  return event;
}

export async function deleteNewsEvent(eventId: string) {
  const session = await requireAdmin();

  await db.newsEvent.delete({
    where: { id: eventId },
  });

  await db.auditLog.create({
    data: {
      adminId: session.user.id,
      action: 'NEWS_EVENT_DELETED',
      targetType: 'NEWS_EVENT',
      targetId: eventId,
      details: {
        eventId,
      },
    },
  });

  revalidatePath('/news');
  revalidatePath('/admin/news');
  return { success: true };
}
