'use client';

interface Internship {
    id: string;
    title: string;
    status: string;
    applicantCount?: number; // Depending on API response
}

export default function ProviderStats({ internships }: { internships: any[] }) {
    const activeInternships = internships.filter(i => i.status === 'active').length;
    // Assuming API returns applicantCount in internship object, or we sum it up if we fetched details
    // For list endpoint, usually we might not have applicant count unless projection.
    // Let's assume for now we just show Active Internships count.

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Internships</h3>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{activeInternships}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Internships</h3>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{internships.length}</p>
            </div>
            {/* Placeholder for total applicants if available */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Actions Needed</h3>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2 text-amber-500">-</p>
            </div>
        </div>
    );
}
