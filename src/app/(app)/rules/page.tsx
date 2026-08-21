import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import RulesClient from './rules-client'
import { redirect } from 'next/navigation'

export default async function RulesPage({
  searchParams,
}: {
  searchParams: Promise<{ accountId?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const accounts = await db.account.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true, propFirm: true }
  })

  if (accounts.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Trading Rules</h1>
        <p className="text-muted-foreground">Please create an account first to manage rules.</p>
      </div>
    )
  }

  const { accountId } = await searchParams
  const selectedAccountId = accountId || accounts[0].id

  const rules = await db.tradingRule.findMany({
    where: { accountId: selectedAccountId },
    include: {
      _count: {
        select: { ruleViolations: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Rules Engine</h2>
      </div>
      <RulesClient 
        accounts={accounts} 
        initialRules={rules} 
        selectedAccountId={selectedAccountId} 
      />
    </div>
  )
}
