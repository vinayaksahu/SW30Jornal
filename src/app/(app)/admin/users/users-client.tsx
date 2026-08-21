'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Users,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
  Search,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Wallet,
  BookOpen,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { updateUserRole } from '@/actions/admin';
import { Role } from '@/types/enums';
import { toast } from 'sonner';

interface UsersClientProps {
  initialUsers: any[];
  currentUserId: string;
}

export default function UsersClient({ initialUsers, currentUserId }: UsersClientProps) {
  const [users, setUsers] = React.useState(initialUsers);
  const [search, setSearch] = React.useState('');
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  const filteredUsers = React.useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase();
      return (
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        u.role.toLowerCase().includes(q)
      );
    });
  }, [users, search]);

  const handleRoleChange = async (userId: string, newRole: Role) => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

    setUpdatingId(userId);
    try {
      const updated = await updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: updated.role } : u))
      );
      toast.success(`User role updated to ${newRole}!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user role');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin"
              className="text-xs text-zinc-400 hover:text-zinc-100 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-3 w-3" /> Back to Admin Console
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Users className="h-6 w-6 text-emerald-400" />
            User Management & Role Access
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Promote administrators, manage prop firm journal access, and monitor user accounts and trade counts.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/60 text-zinc-400 uppercase tracking-wider text-[10px] border-b border-zinc-800">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">User</th>
                  <th className="px-4 py-3.5 font-semibold">Role</th>
                  <th className="px-4 py-3.5 font-semibold">Trading Accounts</th>
                  <th className="px-4 py-3.5 font-semibold">Logged Trades</th>
                  <th className="px-4 py-3.5 font-semibold">Joined Date</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-zinc-500">
                      No matching users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isSelf = user.id === currentUserId;
                    return (
                      <tr key={user.id} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col">
                            <span className="font-semibold text-zinc-100 flex items-center gap-1.5">
                              {user.name || 'Anonymous User'}
                              {isSelf && (
                                <span className="text-[10px] text-emerald-400 font-normal bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                  (You)
                                </span>
                              )}
                            </span>
                            <span className="text-zinc-400 text-[11px]">{user.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {user.role === 'ADMIN' ? (
                            <Badge
                              variant="outline"
                              className="text-red-400 border-red-500/20 bg-red-500/10 text-[10px]"
                            >
                              <ShieldAlert className="h-2.5 w-2.5 mr-1" /> ADMIN
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-zinc-400 border-zinc-700 bg-zinc-900 text-[10px]"
                            >
                              USER
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-zinc-300">
                          <span className="flex items-center gap-1.5">
                            <Wallet className="h-3.5 w-3.5 text-zinc-500" />
                            {user._count?.accounts || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-zinc-300">
                          <span className="flex items-center gap-1.5">
                            <BookOpen className="h-3.5 w-3.5 text-zinc-500" />
                            {user._count?.trades || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-zinc-400 text-[11px]">
                          {new Date(user.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-right">
                          {!isSelf && (
                            <div className="flex items-center justify-end gap-2">
                              {user.role === 'USER' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={updatingId === user.id}
                                  onClick={() => handleRoleChange(user.id, Role.ADMIN)}
                                  className="h-7 text-[11px] border-red-500/30 text-red-400 hover:bg-red-500/10"
                                >
                                  Promote to Admin
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={updatingId === user.id}
                                  onClick={() => handleRoleChange(user.id, Role.USER)}
                                  className="h-7 text-[11px] border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                                >
                                  Demote to User
                                </Button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
