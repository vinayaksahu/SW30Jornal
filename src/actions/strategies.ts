'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function getStrategies() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const strategies = await db.strategy.findMany({
    where: { userId: session.user.id },
    include: {
      _count: {
        select: { trades: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Optionally calculate win rate here if we fetch trades, but just counts for now
  return strategies
}

export async function getStrategy(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const strategy = await db.strategy.findUnique({
    where: { id }
  })

  if (!strategy || strategy.userId !== session.user.id) {
    throw new Error('Strategy not found or unauthorized')
  }

  return strategy
}

export async function createStrategy(data: any) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const strategy = await db.strategy.create({
    data: {
      ...data,
      userId: session.user.id,
    }
  })

  revalidatePath('/strategies')
  return strategy
}

export async function updateStrategy(id: string, data: any) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const existing = await db.strategy.findUnique({ where: { id } })
  if (!existing || existing.userId !== session.user.id) {
    throw new Error('Strategy not found or unauthorized')
  }

  const strategy = await db.strategy.update({
    where: { id },
    data
  })

  revalidatePath('/strategies')
  return strategy
}

export async function deleteStrategy(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const existing = await db.strategy.findUnique({ where: { id } })
  if (!existing || existing.userId !== session.user.id) {
    throw new Error('Strategy not found or unauthorized')
  }

  await db.strategy.delete({ where: { id } })
  revalidatePath('/strategies')
}
