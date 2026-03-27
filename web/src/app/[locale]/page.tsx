'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { MOCK_INTERNSHIPS } from '@/lib/mockInternships';

export default function HomePage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const featuredInternships = MOCK_INTERNSHIPS.slice(0, 3);

    useEffect(() => {
        if (!loading && user) {
            if (user.roles.includes('ROLE_ADMIN')) {
                router.replace('/admin/dashboard');
            } else {
                router.replace('/dashboard');
            }
        }
    }, [user, loading, router]);

    if (loading || user) {
        return (
            <div className="min-h-screen bg-[#1e1b4b] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <main className="min-h-screen">
            {/* ── Hero Section ──────────────────────────────────── */}
            <section
                className="relative min-h-screen flex items-center justify-center overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 25%, #4338ca 50%, #0891b2 100%)',
                    backgroundSize: '200% 200%',
                    animation: 'gradient-shift 12s ease infinite',
                }}
            >
                {/* Floating orbs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div
                        className="absolute w-96 h-96 rounded-full opacity-20"
                        style={{
                            background: 'radial-gradient(circle, #818cf8, transparent)',
                            top: '10%', left: '10%',
                            animation: 'float 8s ease-in-out infinite',
                        }}
                    />
                    <div
                        className="absolute w-80 h-80 rounded-full opacity-15"
                        style={{
                            background: 'radial-gradient(circle, #22d3ee, transparent)',
                            bottom: '15%', right: '15%',
                            animation: 'float 10s ease-in-out infinite 2s',
                        }}
                    />
                    <div
                        className="absolute w-64 h-64 rounded-full opacity-10"
                        style={{
                            background: 'radial-gradient(circle, #a5b4fc, transparent)',
                            top: '50%', left: '60%',
                            animation: 'float 7s ease-in-out infinite 1s',
                        }}
                    />
                </div>

                {/* Grid pattern overlay */}
                <div
                    className="absolute inset-0 opacity-5"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                        backgroundSize: '60px 60px',
                    }}
                />

                <div className="relative z-10 text-center px-4 max-w-5xl mx-auto" style={{ animation: 'fade-in-up 0.8s ease-out' }}>
                    <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm text-sm text-white/90">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        AI-Powered Recommendation Engine
                    </div>

                    <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white px-2 mb-6 tracking-tight" style={{ lineHeight: 1.15 }}>
                        Accelerate Your Career with <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-200 to-indigo-300 drop-shadow-[0_0_30px_rgba(34,211,238,0.3)]">
                            AI-Powered Internships
                        </span>
                    </h1>

                    <p className="mt-8 text-lg sm:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed font-medium">
                        NextIntern.ai matches ambitious students with top companies using explainable AI.
                        Get highly personalized recommendations based on your unique skills and aspirations.
                    </p>

                    <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Link
                            href="/register"
                            className="px-10 py-5 rounded-2xl text-lg font-bold text-indigo-950 bg-white shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all duration-300 hover:-translate-y-1 hover:bg-cyan-50 hover:shadow-[0_0_60px_rgba(34,211,238,0.5)] flex items-center gap-2"
                        >
                            Get Started Free <span>🚀</span>
                        </Link>
                        <Link
                            href="/internships"
                            className="px-10 py-5 rounded-2xl text-lg font-bold text-white border-2 border-white/20 hover:bg-white/10 hover:border-white/40 backdrop-blur-sm transition-all duration-300 flex items-center gap-2"
                        >
                            Explore Opportunities <span>→</span>
                        </Link>
                    </div>

                    {/* Trust metrics */}
                    <div className="mt-20 flex flex-wrap items-center justify-center gap-10 text-white/70 text-base font-medium">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl font-black text-white">10k+</span>
                            <span className="text-left leading-tight">Active<br/>Students</span>
                        </div>
                        <div className="w-px h-10 bg-white/20" />
                        <div className="flex items-center gap-3">
                            <span className="text-3xl font-black text-white">50+</span>
                            <span className="text-left leading-tight">Hiring<br/>Companies</span>
                        </div>
                        <div className="w-px h-10 bg-white/20" />
                        <div className="flex items-center gap-3">
                            <span className="text-3xl font-black text-white">94%</span>
                            <span className="text-left leading-tight">Match<br/>Accuracy</span>
                        </div>
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 animate-bounce">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </div>
            </section>

            {/* ── Trusted by Companies ────────────────────────── */}
            <section className="py-10 bg-white border-y border-gray-100 dark:bg-gray-900/50 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-sm font-bold text-gray-400 tracking-widest uppercase mb-8">Top tech companies hiring talent on NextIntern.ai</p>
                    <div className="flex flex-wrap justify-center items-center gap-10 md:gap-20 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                        {['Google', 'Microsoft', 'Amazon', 'Meta', 'Netflix', 'Stripe'].map(company => (
                            <span key={company} className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white opacity-80">
                                {company}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Featured Internships ──────────────────────── */}
            <section className="py-24 bg-gray-50 dark:bg-gray-950/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                        <div className="max-w-2xl">
                            <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Featured Opportunities</h2>
                            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400 leading-relaxed">Hand-picked internships to kickstart your career. Apply early to secure your spot.</p>
                        </div>
                        <Link href="/internships" className="inline-flex items-center gap-2 text-primary-600 font-bold hover:text-primary-700 hover:gap-3 transition-all">
                            View all internships <span>→</span>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {featuredInternships.map(intern => (
                            <Link key={intern.id} href={`/internships/${intern.id}`}>
                                <div className="group bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-200 dark:border-gray-800 p-8 hover:shadow-2xl hover:shadow-primary-500/10 hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-500 hover:-translate-y-2 cursor-pointer h-full flex flex-col relative overflow-hidden">
                                     <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-primary-500/10 to-accent-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-2xl font-black text-gray-300 dark:text-gray-600 border border-gray-100 dark:border-gray-700">
                                                {intern.provider.companyName.charAt(0)}
                                            </div>
                                            <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 border border-primary-100 dark:border-primary-900/50">
                                                {intern.category}
                                            </span>
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors mb-2 line-clamp-2">
                                            {intern.title}
                                        </h3>
                                        <p className="text-base font-medium text-gray-500 dark:text-gray-400 mb-6">{intern.provider.companyName}</p>
                                        
                                        <div className="flex flex-wrap gap-2 mb-8 mt-auto">
                                            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-800/50">
                                                📍 {intern.locationCity || 'Remote'}
                                            </span>
                                            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-800/50">
                                                ⏳ {intern.durationWeeks} weeks
                                            </span>
                                        </div>
                                        
                                        <div className="pt-5 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                            <span className="text-lg font-black text-gray-900 dark:text-white">
                                                {intern.stipendMin ? `₹${(intern.stipendMin/1000).toFixed(0)}k` : 'Unpaid'}<span className="text-sm text-gray-400 font-medium">/mo</span>
                                            </span>
                                            <span className="text-sm font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-4 py-2 rounded-xl group-hover:bg-primary-600 group-hover:text-white transition-colors flex gap-1 items-center">
                                                Apply <span className="hidden group-hover:inline">Now</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Impact Section ──────────────────────────────── */}
            <section className="py-24 bg-white dark:bg-gray-900 relative overflow-hidden border-y border-gray-100 dark:border-gray-800">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, var(--primary-500) 1px, transparent 0)', backgroundSize: '48px 48px' }} />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
                        {[
                            { label: 'Active Students', value: '10,000+' },
                            { label: 'Internships Posted', value: '5,000+' },
                            { label: 'Partner Companies', value: '500+' },
                            { label: 'Success Match Rate', value: '94%' },
                        ].map((stat, i) => (
                            <div key={i} className="p-6">
                                <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-600 mb-3 drop-shadow-sm">
                                    {stat.value}
                                </div>
                                <div className="text-lg font-bold text-gray-600 dark:text-gray-400">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Features Section ──────────────────────────────── */}
            <section className="py-24 bg-gray-50 dark:bg-gray-950">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 dark:text-white">How It Works</h2>
                        <p className="mt-4 text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                            Three simple steps to finding your ideal internship
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: '📝',
                                title: 'Build Your Profile',
                                desc: 'Add your skills, education, interests, and location. Our AI uses these signals to understand your unique career trajectory.',
                                color: 'from-indigo-500 to-purple-500',
                            },
                            {
                                icon: '🤖',
                                title: 'Get AI Recommendations',
                                desc: 'Our content-based scoring engine analyzes skill overlap, location fit, and interest alignment to rank internships for you.',
                                color: 'from-cyan-500 to-blue-500',
                            },
                            {
                                icon: '💡',
                                title: 'Understand Why',
                                desc: 'Every recommendation comes with an explanation. See which skills matched, what boosted your score, and areas to improve.',
                                color: 'from-emerald-500 to-teal-500',
                            },
                        ].map((feature, i) => (
                            <div
                                key={i}
                                className="relative bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all duration-500 hover:-translate-y-2 group"
                            >
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br mb-5 flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform"
                                    style={{ backgroundImage: `linear-gradient(135deg, var(--primary-500), var(--accent-500))` }}>
                                    {feature.icon}
                                </div>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Step {i + 1}</span>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-2 mb-3">{feature.title}</h3>
                                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA Section ───────────────────────────────────── */}
            <section className="py-24 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)' }}>
                <div className="absolute inset-0 opacity-5" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                    backgroundSize: '40px 40px',
                }} />
                <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
                    <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                        Ready to find your perfect match?
                    </h2>
                    <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto">
                        Join NextIntern.ai and let our AI engine connect you with internships
                        that match your skills and aspirations.
                    </p>
                    <Link
                        href="/register"
                        className="inline-flex px-10 py-4 rounded-xl text-lg font-bold text-indigo-900 bg-white hover:bg-gray-100 transition-all shadow-2xl hover:-translate-y-1"
                    >
                        Create Free Account →
                    </Link>
                </div>
            </section>

            {/* ── Footer ────────────────────────────────────────── */}
            <footer className="bg-gray-950 text-gray-400 py-12 border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <img 
                                src="/nextintern-logo-transparent.png" 
                                alt="NextIntern.ai" 
                                className="h-14 w-auto object-contain"
                            />
                        </div>
                        <p className="text-sm">© 2026 NextIntern.ai — Fueling Careers in AI</p>
                        <div className="flex gap-6 text-sm">
                            <Link href="/internships" className="hover:text-white transition-colors">Browse</Link>
                            <Link href="/login" className="hover:text-white transition-colors">Login</Link>
                            <Link href="/register" className="hover:text-white transition-colors">Sign Up</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </main>
    );
}
