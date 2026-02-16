'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function ManageApplicationsPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user, token } = useAuth();
    const [intern, setIntern] = useState<any>(null);
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id || !token) return;

        setLoading(true);
        // Fetch internship details + applications
        Promise.all([
            api.getInternship(id as string),
            api.getInternshipApplications(id as string).catch(() => ({ content: [] }))
        ]).then(([internData, appsData]) => {
            // Permission check on client (backend also checks)
            if (user?.id !== internData.provider?.id) {
                router.push('/dashboard');
                return;
            }
            setIntern(internData);
            setApplications(appsData.content || []);
        })
            .catch(() => router.push('/dashboard'))
            .finally(() => setLoading(false));
    }, [id, token, user, router]);

    const handleStatusUpdate = async (appId: string, status: string) => {
        if (!confirm(`Are you sure you want to mark this applicant as ${status}?`)) return;
        try {
            await api.updateApplicationStatus(appId, status);
            // Optimistic update
            setApplications(apps => apps.map(a =>
                a.id === appId ? { ...a, status } : a
            ));
        } catch (err: any) {
            alert('Failed to update status');
        }
    };

    if (loading) return <div className="p-10 text-center">Loading applications...</div>;
    if (!intern) return null;

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={`/internships/${id}`} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
                            ← Back to Internship
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Manage Applications: {intern.title}
                        </h1>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                    {applications.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Applicant</th>
                                        <th className="px-6 py-4">Education</th>
                                        <th className="px-6 py-4">Applying For</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {applications.map((app) => (
                                        <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-gray-900 dark:text-white">{app.student.fullName}</span>
                                                    <span className="text-sm text-gray-500">{app.student.email}</span>
                                                    {app.student.resumeUrl && (
                                                        <a href={app.student.resumeUrl} target="_blank" className="text-xs text-primary-600 hover:underline mt-1">
                                                            View Resume ↗
                                                        </a>
                                                    )}
                                                </div>
                                                {app.coverNote && (
                                                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg max-w-sm">
                                                        "{app.coverNote}"
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                                {app.student.educationLevel}<br />
                                                <span className="text-gray-400">{app.student.university}</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(app.appliedAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize
                                                    ${app.status === 'accepted' ? 'bg-green-100 text-green-700 border border-green-200' :
                                                        app.status === 'rejected' ? 'bg-red-100 text-red-700 border border-red-200' :
                                                            app.status === 'shortlisted' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                                                'bg-blue-50 text-blue-700 border border-blue-200'
                                                    }`}>
                                                    {app.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {app.status === 'applied' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleStatusUpdate(app.id, 'shortlisted')}
                                                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors"
                                                            >
                                                                Shortlist
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusUpdate(app.id, 'rejected')}
                                                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors"
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}
                                                    {app.status === 'shortlisted' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleStatusUpdate(app.id, 'accepted')}
                                                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors"
                                                            >
                                                                Accept
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusUpdate(app.id, 'rejected')}
                                                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors"
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}
                                                    {(app.status === 'accepted' || app.status === 'rejected') && (
                                                        <span className="text-xs text-gray-400">No actions</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <span className="text-4xl block mb-2">📭</span>
                            <p className="text-gray-500">No applications yet for this internship.</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
