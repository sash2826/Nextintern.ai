'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Applicant {
    id: string; // Application ID
    status: string;
    coverNote: string;
    appliedAt: string;
    applicant: {
        id: string; // Student ID
        fullName: string;
        email: string;
        resumeUrl?: string;
        educationLevel?: string;
        university?: string;
    };
}

export default function ApplicationList({ internshipId }: { internshipId: string }) {
    const [applications, setApplications] = useState<Applicant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchApps = async () => {
            try {
                const data = await api.getApplicants(internshipId);
                // The API returns page object, content is the array
                setApplications(data.content || []);
            } catch (err: any) {
                setError(err.message || 'Failed to load applications');
            } finally {
                setLoading(false);
            }
        };
        fetchApps();
    }, [internshipId]);

    const handleStatusUpdate = async (appId: string, newStatus: string) => {
        // Optimistic Update
        const previousApps = [...applications];
        setApplications(prev => prev.map(app =>
            app.id === appId ? { ...app, status: newStatus } : app
        ));

        try {
            await api.updateApplicationStatus(appId, newStatus);
        } catch (err) {
            // Rollback
            setApplications(previousApps);
            alert('Failed to update status');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading applications...</div>;
    if (error) return <div className="p-4 text-center text-red-500 bg-red-50 rounded-lg">{error}</div>;

    if (applications.length === 0) {
        return (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <p className="text-gray-500">No applications received yet.</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Applicants ({applications.length})</h3>
            </div>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {applications.map((app) => (
                    <li key={app.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {app.applicant.fullName}
                                </h4>
                                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    <p>{app.applicant.university} • {app.applicant.educationLevel}</p>
                                    <p className="mt-1">Applied: {new Date(app.appliedAt).toLocaleDateString()}</p>
                                </div>
                                {app.coverNote && (
                                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm text-gray-600 dark:text-gray-300 italic border border-gray-100 dark:border-gray-800">
                                        "{app.coverNote}"
                                    </div>
                                )}
                                {app.applicant.resumeUrl && (
                                    <a href={app.applicant.resumeUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-primary-600 hover:underline">
                                        View Resume ↗
                                    </a>
                                )}
                            </div>

                            <div className="flex flex-col items-end gap-3">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border
                                    ${app.status === 'APPLIED' ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400' :
                                        app.status === 'SHORTLISTED' ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400' :
                                            app.status === 'ACCEPTED' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400' :
                                                app.status === 'REJECTED' ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400' :
                                                    'bg-gray-100 text-gray-800'}`}>
                                    {app.status}
                                </span>

                                <div className="flex gap-2">
                                    {app.status === 'APPLIED' && (
                                        <button
                                            onClick={() => handleStatusUpdate(app.id, 'SHORTLISTED')}
                                            className="px-3 py-1.5 text-xs font-medium rounded-md text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200"
                                        >
                                            Shortlist
                                        </button>
                                    )}
                                    {['APPLIED', 'SHORTLISTED'].includes(app.status) && (
                                        <>
                                            <button
                                                onClick={() => handleStatusUpdate(app.id, 'ACCEPTED')}
                                                className="px-3 py-1.5 text-xs font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 border border-green-200"
                                            >
                                                Hire
                                            </button>
                                            <button
                                                onClick={() => handleStatusUpdate(app.id, 'REJECTED')}
                                                className="px-3 py-1.5 text-xs font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 border border-red-200"
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
