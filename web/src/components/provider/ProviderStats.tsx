'use client';

export default function ProviderStats({ internships }: { internships: any[] }) {
    const activeCount = internships.filter(i => i.status === 'active').length;
    const totalApplicants = internships.reduce((sum, i) => sum + (i.applicantCount || 0), 0);
    const avgApplicants = internships.length > 0 ? Math.round(totalApplicants / internships.length) : 0;

    const stats = [
        { icon: '💼', label: 'Active Internships', value: activeCount, gradient: 'bg-green-50 dark:bg-green-900/30' },
        { icon: '👥', label: 'Total Applicants', value: totalApplicants, gradient: 'bg-blue-50 dark:bg-blue-900/30' },
        { icon: '📊', label: 'Avg per Internship', value: avgApplicants, gradient: 'bg-purple-50 dark:bg-purple-900/30' },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((s) => (
                <div key={s.label} className="stat-card">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl ${s.gradient} flex items-center justify-center text-xl`}>
                            {s.icon}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{s.label}</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white animate-count-up">{s.value}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
