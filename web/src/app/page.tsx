import Link from 'next/link';

export default function HomePage() {
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

                    <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-tight tracking-tight">
                        Find Your
                        <br />
                        <span
                            style={{
                                background: 'linear-gradient(135deg, #67e8f9, #a5f3fc, #e0e7ff)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}
                        >
                            Perfect Internship
                        </span>
                    </h1>

                    <p className="mt-6 text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
                        NextIntern.ai matches students with internships using explainable AI.
                        Get personalized recommendations based on your skills, interests, and career goals.
                    </p>

                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/register"
                            className="px-8 py-4 rounded-xl text-lg font-semibold text-white shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-cyan-500/25"
                            style={{
                                background: 'linear-gradient(135deg, #4f46e5, #0891b2)',
                            }}
                        >
                            Get Started — It&apos;s Free
                        </Link>
                        <Link
                            href="/internships"
                            className="px-8 py-4 rounded-xl text-lg font-semibold text-white border-2 border-white/20 hover:bg-white/10 transition-all duration-300"
                        >
                            Browse Internships →
                        </Link>
                    </div>

                    {/* Trust metrics */}
                    <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-white/60 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-white">10+</span>
                            <span>Internships</span>
                        </div>
                        <div className="w-px h-6 bg-white/20" />
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-white">5</span>
                            <span>Companies</span>
                        </div>
                        <div className="w-px h-6 bg-white/20" />
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-white">AI</span>
                            <span>Explainable Matching</span>
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

            {/* ── Features Section ──────────────────────────────── */}
            <section className="py-24 bg-white dark:bg-gray-950">
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
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
                                <span className="text-white font-bold text-sm">NI</span>
                            </div>
                            <span className="text-white font-bold">NextIntern.ai</span>
                        </div>
                        <p className="text-sm">© 2026 NextIntern.ai — AI-powered internship matching</p>
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
