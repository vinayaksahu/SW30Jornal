import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import AccountsClient from './accounts-client';

export default async function AccountsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  let accounts: any[] = [];
  let userSettings: any = null;

  try {
    const [fetchedAccounts, fetchedSettings] = await Promise.all([
      db.account.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
      }),
      db.userSettings.findUnique({
        where: { userId: session.user.id },
        select: { defaultAccountId: true },
      }),
    ]);
    accounts = fetchedAccounts;
    userSettings = fetchedSettings;
  } catch (err) {
    console.warn('Accounts page DB fallback:', err);
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Prop Firm Accounts & Challenges</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Manage your evaluation profiles, funded accounts, and prop firm risk parameters.
        </p>
      </div>

      <AccountsClient
        accounts={accounts}
        activeAccountId={userSettings?.defaultAccountId || null}
      />
    </div>
  );
}
