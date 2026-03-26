'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const ACTION_COLORS: Record<string, string> = {
    CREATE: 'badge-success',
    UPDATE: 'badge-info',
    DELETE: 'badge-error',
    LOGIN: 'badge-neutral',
    BAN: 'badge-warning',
    UNBAN: 'badge-success',
};

export default function AuditLogs() {
    const { token } = useAuth();
    const [logs, setLogs] = useState<any[]>([]);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLogs(page);
    }, [page]);

    const loadLogs = (p: number) => {
        setLoading(true);
        api.getAuditLogs(token!, p)
            .then(data => setLogs(data.content))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    const formatTimestamp = (ts: string) => {
        const d = new Date(ts);
        const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        return { date, time };
    };

    if (loading && logs.length === 0) {
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
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Review all system activity and administrative actions.</p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Actor</th>
                                <th>Action</th>
                                <th>Target</th>
                                <th>Details</th>
                                <th>IP Address</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => {
                                const { date, time } = formatTimestamp(log.createdAt);
                                return (
                                    <tr key={log.id}>
                                        <td>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{date}</p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">{time}</p>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="font-mono text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded" title={log.actorId}>
                                                {log.actorId.substring(0, 8)}…
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${ACTION_COLORS[log.action?.toUpperCase()] || 'badge-neutral'}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="text-gray-900 dark:text-white font-medium">{log.targetType}</span>
                                            <span className="text-gray-400 dark:text-gray-500 ml-1 text-xs font-mono">#{log.targetId ? log.targetId.substring(0, 6) : 'N/A'}</span>
                                        </td>
                                        <td>
                                            <span className="text-gray-600 dark:text-gray-300 max-w-[200px] truncate block" title={log.details}>
                                                {log.details || '—'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{log.ipAddress}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {logs.length === 0 && !loading && (
                    <div className="p-12 text-center">
                        <div className="text-3xl mb-2">📋</div>
                        <p className="text-gray-500 dark:text-gray-400">No audit logs found.</p>
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
