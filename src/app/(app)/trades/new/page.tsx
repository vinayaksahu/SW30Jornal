import { Suspense } from "react"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { TradeUploadWizard } from "./trade-upload-wizard"

export default async function NewTradePage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  let accounts: any[] = []
  let strategies: any[] = []

  try {
    const [fetchedAccounts, fetchedStrategies] = await Promise.all([
      db.account.findMany({
        where: { userId: session.user.id },
        select: { id: true, name: true }
      }),
      db.strategy.findMany({
        where: { userId: session.user.id },
        select: { id: true, name: true }
      })
    ])
    accounts = fetchedAccounts
    strategies = fetchedStrategies
  } catch (err) {
    console.warn("New trade page DB fallback:", err)
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-100">Log New Trade</h2>
        <p className="text-zinc-400">Upload evidence and map to your strategies and rules.</p>
      </div>

      <Suspense fallback={<div className="text-zinc-400">Loading...</div>}>
        <TradeUploadWizard accounts={accounts} strategies={strategies} />
      </Suspense>
    </div>
  )
}
