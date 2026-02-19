'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function AuditLogs() {
    const [logs, setLogs] = useState<any[]>([]);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLogs(page);
    }, [page]);

    const loadLogs = (p: number) => {
        setLoading(true);
        api.getAuditLogs(p)
            .then(data => setLogs(data.content))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Audit Logs</h1>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 font-medium">
                            <tr>
                                <th className="px-6 py-4">Timestamp</th>
                                <th className="px-6 py-4">Actor ID</th>
                                <th className="px-6 py-4">Action</th>
                                <th className="px-6 py-4">Target Type</th>
                                <th className="px-6 py-4">Details</th>
                                <th className="px-6 py-4">IP Address</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {logs.map(log => (
                                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                                    <td className="px-6 py-4 font-mono text-xs text-gray-500" title={log.actorId}>{log.actorId.substring(0, 8)}...</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-bold">
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">{log.targetType} <span className="text-gray-400 font-normal">#{log.targetId ? log.targetId.substring(0, 6) : 'N/A'}</span></td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 max-w-xs truncate" title={log.details}>{log.details}</td>
                                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{log.ipAddress}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {logs.length === 0 && !loading && (
                    <div className="p-8 text-center text-gray-500">No logs found.</div>
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
