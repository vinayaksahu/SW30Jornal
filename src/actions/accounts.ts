'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { ChallengeStatus } from '@prisma/client';

const accountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  propFirm: z.string().min(1, "Prop firm is required"),
  accountSize: z.coerce.number().min(0, "Account size must be a positive number"),
  startingBalance: z.coerce.number().min(0, "Starting balance must be a positive number"),
  currentBalance: z.coerce.number().min(0, "Current balance must be a positive number"),
  equity: z.coerce.number().min(0, "Equity must be a positive number"),
  profitTarget: z.coerce.number().min(0, "Profit target must be a positive number"),
  dailyDrawdownLimit: z.coerce.number().min(0, "Daily drawdown limit must be a positive number"),
  maxDrawdownLimit: z.coerce.number().min(0, "Max drawdown limit must be a positive number"),
  maxRiskPerTrade: z.coerce.number().min(0).optional(),
  maxTradesPerDay: z.coerce.number().int().min(0).optional(),
  maxLotSize: z.coerce.number().min(0).optional(),
  minTradingDays: z.coerce.number().int().min(0).optional(),
  newsRestrictions: z.boolean().default(true),
  weekendRestrictions: z.boolean().default(true),
  status: z.nativeEnum(ChallengeStatus).default(ChallengeStatus.ACTIVE),
});

export async function getAccounts() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const accounts = await db.account.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return accounts;
}

export async function getAccount(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const account = await db.account.findUnique({
    where: {
      id,
      userId: session.user.id,
    },
  });

  return account;
}

export async function createAccount(data: z.infer<typeof accountSchema>) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const validatedData = accountSchema.parse(data);

  const account = await db.account.create({
    data: {
      ...validatedData,
      userId: session.user.id,
    },
  });

  revalidatePath('/accounts');
  return account;
}

export async function updateAccount(id: string, data: Partial<z.infer<typeof accountSchema>>) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const existing = await db.account.findUnique({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    throw new Error('Account not found');
  }

  const account = await db.account.update({
    where: { id },
    data,
  });

  revalidatePath('/accounts');
  return account;
}

export async function deleteAccount(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const existing = await db.account.findUnique({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    throw new Error('Account not found');
  }

  await db.account.delete({
    where: { id },
  });

  revalidatePath('/accounts');
}

export async function setActiveAccount(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const existing = await db.account.findUnique({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    throw new Error('Account not found');
  }

  await db.userSettings.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      defaultAccountId: id,
    },
    update: {
      defaultAccountId: id,
    },
  });

  revalidatePath('/accounts');
  return { success: true };
}
