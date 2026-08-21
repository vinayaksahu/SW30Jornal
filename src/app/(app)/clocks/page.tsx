import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ClocksClient from './clocks-client';

export const metadata = {
  title: 'Market Clocks & Trading Sessions | SW30 Prop Firm Journal',
  description: 'Live global market sessions (London, New York, Tokyo, Sydney) and London-NY overlap tracker.',
};

export default async function ClocksPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  return <ClocksClient />;
}
