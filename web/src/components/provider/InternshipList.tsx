'use client';

import Link from 'next/link';

interface Internship {
    id: string;
    title: string;
    status: string;
    category?: string;
    locationCity: string;
    locationState: string;
    createdAt: string;
    applicantCount?: number;
}

export default function InternshipList({ internships }: { internships: Internship[] }) {
    if (internships.length === 0) {
        return (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                <div className="text-4xl mb-4">📝</div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No internships posted yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Get started by creating your first internship opportunity.</p>
                <Link
                    href="/provider/internships/new"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-primary-500/25"
                >
                    + Post Internship
                </Link>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Internships</h2>
                <Link
                    href="/provider/internships/new"
                    className="text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors"
                >
                    + Post New
                </Link>
            </div>

            <div className="grid gap-4">
                {internships.map((internship) => (
                    <div key={internship.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{internship.title}</h3>
                                    <span className={`badge ${internship.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                                        {internship.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                    {internship.category && (
                                        <span className="badge badge-info text-xs">{internship.category}</span>
                                    )}
                                    <span className="flex items-center gap-1">
                                        📍 {internship.locationCity}, {internship.locationState}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        📅 {new Date(internship.createdAt).toLocaleDateString()}
                                    </span>
                                    {internship.applicantCount !== undefined && (
                                        <span className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300">
                                            👥 {internship.applicantCount} applicants
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Link href={`/internships/${internship.id}`}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                                    View
                                </Link>
                                <Link href={`/provider/internships/${internship.id}/applications`}
                                    className="px-4 py-2 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors">
                                    Applications →
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
