'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/ui/ToastProvider';

export default function UserManagement() {
    const [users, setUsers] = useState<any[]>([]);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const { token } = useAuth();
    const toast = useToast();

    useEffect(() => {
        loadUsers(page);
    }, [page]);

    const loadUsers = (p: number) => {
        setLoading(true);
        api.getUsers(token!, p)
            .then(data => setUsers(data.content))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    const handleBanToggle = async (user: any) => {
        if (!confirm(`Are you sure you want to ${user.isActive ? 'ban' : 'unban'} ${user.fullName}?`)) return;

        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u));

        try {
            if (user.isActive) {
                await api.banUser(token!, user.id);
                toast.success(`${user.fullName} has been banned`);
            } else {
                await api.unbanUser(token!, user.id);
                toast.success(`${user.fullName} has been unbanned`);
            }
        } catch (err) {
            toast.error('Action failed');
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: user.isActive } : u));
        }
    };

    if (loading && users.length === 0) {
        return (
            <div className="space-y-6">
                <div className="h-10 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg animate-shimmer" />
                <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-shimmer" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">View and manage all platform users.</p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td className="font-medium text-gray-900 dark:text-white">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300">
                                                {user.fullName?.charAt(0)?.toUpperCase()}
                                            </div>
                                            {user.fullName}
                                        </div>
                                    </td>
                                    <td className="text-gray-500 dark:text-gray-400">{user.email}</td>
                                    <td>
                                        <div className="flex gap-1">
                                            {user.roles.map((r: any) => (
                                                <span key={r.id} className="badge badge-info text-xs">{r.name.replace('ROLE_', '')}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${user.isActive ? 'badge-success' : 'badge-error'}`}>
                                            {user.isActive ? 'Active' : 'Banned'}
                                        </span>
                                    </td>
                                    <td className="text-gray-500 dark:text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <button
                                            onClick={() => handleBanToggle(user)}
                                            disabled={user.roles.some((r: any) => r.name === 'ROLE_ADMIN')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${user.isActive
                                                ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40'
                                                : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40'
                                                } disabled:opacity-40 disabled:cursor-not-allowed`}
                                        >
                                            {user.isActive ? 'Ban' : 'Unban'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {users.length === 0 && !loading && (
                    <div className="p-12 text-center">
                        <div className="text-3xl mb-2">👤</div>
                        <p className="text-gray-500 dark:text-gray-400">No users found.</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center">
                <button
                    disabled={page === 0}
                    onClick={() => setPage(p => p - 1)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
                >
                    ← Previous
                </button>
                <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Page {page + 1}</span>
                <button
                    onClick={() => setPage(p => p + 1)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                    Next →
                </button>
            </div>
        </div>
    );
}
