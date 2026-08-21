import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/sidebar';
import Topbar from '@/components/layout/topbar';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <Sidebar user={session.user as any} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar user={session.user as any} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-zinc-950/50">
          {children}
        </main>
      </div>
    </div>
  );
}
