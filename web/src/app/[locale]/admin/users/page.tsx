'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function UserManagement() {
    const [users, setUsers] = useState<any[]>([]);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUsers(page);
    }, [page]);

    const loadUsers = (p: number) => {
        setLoading(true);
        api.getUsers(p)
            .then(data => setUsers(data.content)) // Assuming Page<User> returns content array
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    const handleBanToggle = async (user: any) => {
        if (!confirm(`Are you sure you want to ${user.isActive ? 'ban' : 'unban'} ${user.fullName}?`)) return;

        // Optimistic update
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u));

        try {
            if (user.isActive) {
                await api.banUser(user.id);
            } else {
                await api.unbanUser(user.id);
            }
        } catch (err) {
            alert('Action failed');
            // Rollback
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: user.isActive } : u));
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">User Management</h1>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 font-medium">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Joined</th>
                                <th className="px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{user.fullName}</td>
                                    <td className="px-6 py-4 text-gray-500">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-1">
                                            {user.roles.map((r: any) => (
                                                <span key={r.id} className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-xs font-mono">{r.name.replace('ROLE_', '')}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {user.isActive ? 'Active' : 'Banned'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleBanToggle(user)}
                                            disabled={user.roles.some((r: any) => r.name === 'ROLE_ADMIN')}
                                            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${user.isActive
                                                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                    : 'bg-green-50 text-green-600 hover:bg-green-100'
                                                } disabled:opacity-50 disabled:cursor-not-allowed`}
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
                    <div className="p-8 text-center text-gray-500">No users found.</div>
                )}
            </div>
            <div className="flex justify-between items-center mt-4">
                <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-4 py-2 bg-white dark:bg-gray-800 rounded border disabled:opacity-50">Previous</button>
                <span className="text-sm text-gray-500">Page {page + 1}</span>
                <button onClick={() => setPage(p => p + 1)} className="px-4 py-2 bg-white dark:bg-gray-800 rounded border">Next</button>
            </div>
        </div>
    );
}
