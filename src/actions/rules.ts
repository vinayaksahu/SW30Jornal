'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { RuleCategory, RuleStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function getRules(accountId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  // Verify ownership
  const account = await db.account.findUnique({
    where: { id: accountId }
  })
  if (!account || account.userId !== session.user.id) {
    throw new Error('Account not found or unauthorized')
  }

  return await db.tradingRule.findMany({
    where: { accountId },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createRule(accountId: string, data: {
  category: RuleCategory
  ruleType: string
  name: string
  description?: string
  config: any
  status: RuleStatus
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const account = await db.account.findUnique({
    where: { id: accountId }
  })
  if (!account || account.userId !== session.user.id) {
    throw new Error('Account not found or unauthorized')
  }

  const rule = await db.tradingRule.create({
    data: {
      ...data,
      accountId,
      userId: session.user.id,
    }
  })

  revalidatePath('/rules')
  return rule
}

export async function updateRule(id: string, data: any) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const existing = await db.tradingRule.findUnique({ where: { id } })
  if (!existing || existing.userId !== session.user.id) {
    throw new Error('Rule not found or unauthorized')
  }

  const rule = await db.tradingRule.update({
    where: { id },
    data
  })

  revalidatePath('/rules')
  return rule
}

export async function toggleRule(id: string, status: RuleStatus) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const existing = await db.tradingRule.findUnique({ where: { id } })
  if (!existing || existing.userId !== session.user.id) {
    throw new Error('Rule not found or unauthorized')
  }

  const rule = await db.tradingRule.update({
    where: { id },
    data: { status }
  })

  revalidatePath('/rules')
  return rule
}

export async function deleteRule(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const existing = await db.tradingRule.findUnique({ where: { id } })
  if (!existing || existing.userId !== session.user.id) {
    throw new Error('Rule not found or unauthorized')
  }

  await db.tradingRule.delete({ where: { id } })
  revalidatePath('/rules')
}

export async function seedDefaultRules(accountId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const account = await db.account.findUnique({
    where: { id: accountId }
  })
  if (!account || account.userId !== session.user.id) {
    throw new Error('Account not found or unauthorized')
  }

  const defaultRules = [
    {
      accountId,
      userId: session.user.id,
      category: RuleCategory.ACCOUNT,
      ruleType: 'MAX_DRAWDOWN',
      name: 'Max Drawdown Limit',
      description: 'Account equity must not drop below max drawdown limit.',
      config: { maxDrawdownPercent: 10 },
      status: RuleStatus.ENABLED
    },
    {
      accountId,
      userId: session.user.id,
      category: RuleCategory.TRADING,
      ruleType: 'MAX_RISK_PER_TRADE',
      name: 'Max Risk Per Trade',
      description: 'Cannot risk more than 1% of account per trade.',
      config: { maxRiskPercent: 1 },
      status: RuleStatus.ENABLED
    },
    {
      accountId,
      userId: session.user.id,
      category: RuleCategory.TRADING,
      ruleType: 'REQUIRED_STOP_LOSS',
      name: 'Required Stop Loss',
      description: 'Every trade must have a stop loss.',
      config: {},
      status: RuleStatus.ENABLED
    }
  ]

  await db.tradingRule.createMany({
    data: defaultRules
  })

  revalidatePath('/rules')
}
