import { Suspense } from "react"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { TradesClient } from "./trades-client"

export default async function TradesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  let trades: any[] = []

  try {
    trades = await db.trade.findMany({
      where: { userId: session.user.id },
      include: {
        account: true,
        strategy: true,
        ruleViolations: true,
      },
      orderBy: { entryTime: "desc" },
    })
  } catch (err) {
    console.warn("Trades DB query warning (using dev fallback):", err)
  }

  // Basic stats calculation for summary cards
  const totalTrades = trades.length
  let totalProfit = 0
  let totalLoss = 0
  let wins = 0

  trades.forEach(t => {
    const pl = Number(t.profitLoss || 0)
    if (pl > 0) {
      wins++
      totalProfit += pl
    } else {
      totalLoss += Math.abs(pl)
    }
  })

  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0
  const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0
  const totalPnL = totalProfit - totalLoss

  const stats = {
    totalTrades,
    winRate: Number(winRate.toFixed(2)),
    profitFactor: Number(profitFactor.toFixed(2)),
    totalPnL: Number(totalPnL.toFixed(2)),
    avgRR: 0
  }

  // Serialize complex data
  const serializedTrades = trades.map(t => ({
    id: t.id,
    symbol: t.symbol,
    direction: t.direction,
    volume: Number(t.volume),
    entryPrice: Number(t.entryPrice),
    exitPrice: t.exitPrice ? Number(t.exitPrice) : null,
    stopLoss: t.stopLoss ? Number(t.stopLoss) : null,
    takeProfit: t.takeProfit ? Number(t.takeProfit) : null,
    profitLoss: t.profitLoss ? Number(t.profitLoss) : null,
    entryTime: new Date(t.entryTime).toISOString(),
    exitTime: t.exitTime ? new Date(t.exitTime).toISOString() : null,
    durationSeconds: t.durationSeconds,
    strategyId: t.strategyId,
    strategyName: t.strategy?.name,
    accountId: t.accountId,
    accountName: t.account?.name,
    rrRatio: t.rrRatio ? Number(t.rrRatio) : null,
    ruleStatus: t.ruleStatus || 'FOLLOWED',
    newsStatus: t.newsStatus || 'Clear',
  }))

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Suspense fallback={<div className="text-zinc-400">Loading trades...</div>}>
        <TradesClient initialTrades={serializedTrades} stats={stats} />
      </Suspense>
    </div>
  )
}
