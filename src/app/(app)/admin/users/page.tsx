import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAdminUsers } from '@/actions/admin';
import UsersClient from './users-client';

export const metadata = {
  title: 'User Management | SW30 Admin Console',
  description: 'Manage users, roles, and view trader activity statistics.',
};

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const users = await getAdminUsers();

  return <UsersClient initialUsers={users} currentUserId={session.user.id} />;
}
