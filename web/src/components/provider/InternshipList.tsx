'use client';

import Link from 'next/link';

interface Internship {
    id: string;
    title: string;
    status: string;
    locationCity: string;
    locationState: string;
    createdAt: string;
}

export default function InternshipList({ internships }: { internships: Internship[] }) {
    if (internships.length === 0) {
        return (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No internships posted yet</h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400">Get started by creating your first internship opportunity.</p>
                <div className="mt-6">
                    <Link
                        href="/provider/internships/new"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                        Create Internship
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Your Internships</h3>
                <Link
                    href="/provider/internships/new"
                    className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
                >
                    + Post New
                </Link>
            </div>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {internships.map((internship) => (
                    <li key={internship.id}>
                        <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                            <div>
                                <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                                    {internship.title}
                                </h4>
                                <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400 gap-4">
                                    <span>
                                        📍 {internship.locationCity}, {internship.locationState}
                                    </span>
                                    <span>
                                        📅 {new Date(internship.createdAt).toLocaleDateString()}
                                    </span>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                        ${internship.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                                        {internship.status}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <Link
                                    href={`/provider/internships/${internship.id}/applications`}
                                    className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
                                >
                                    View Applications →
                                </Link>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
