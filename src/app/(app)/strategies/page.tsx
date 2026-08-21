import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import StrategiesClient from './strategies-client'
import { redirect } from 'next/navigation'

export default async function StrategiesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const strategies = await db.strategy.findMany({
    where: { userId: session.user.id },
    include: {
      _count: {
        select: { trades: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Strategy Maker</h2>
      </div>
      <StrategiesClient initialStrategies={strategies} />
    </div>
  )
}
