'use client';

// import Link from 'next/link'; // Replaced by next-intl Link
import { Link, usePathname, useRouter } from '@/navigation';
import { useAuth } from '@/lib/auth';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';

export function Navbar() {
    const { user, token, logout, loading } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const t = useTranslations('Navbar');
    const router = useRouter();
    const pathname = usePathname();

    const handleLocaleChange = async (newLocale: string) => {
        if (user && token) {
            try {
                await api.updateLocale(token, newLocale);
            } catch (e) {
                console.error('Failed to update locale preference', e);
            }
        }
        router.replace(pathname, { locale: newLocale });
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <img 
                            src="/nextintern-logo-transparent.png" 
                            alt="NextIntern.ai" 
                            className="h-16 w-auto object-contain scale-125 origin-left"
                        />
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-5">
                        <Link href="/internships" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-primary-600 transition-colors">
                            {t('internships')}
                        </Link>
                        {user?.roles.includes('ROLE_STUDENT') && (
                            <Link href="/dashboard" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-primary-600 transition-colors">
                                {t('dashboard')}
                            </Link>
                        )}
                        {user?.roles.includes('ROLE_PROVIDER') && (
                            <Link href="/provider/dashboard" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-primary-600 transition-colors">
                                {t('provider')}
                            </Link>
                        )}
                        {user?.roles.includes('ROLE_ADMIN') && (
                            <Link href="/admin/dashboard" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-primary-600 transition-colors">
                                {t('admin')}
                            </Link>
                        )}

                        {/* Language Switcher */}
                        <select
                            onChange={(e) => handleLocaleChange(e.target.value)}
                            className="bg-transparent text-sm font-medium text-gray-600 dark:text-gray-300 focus:outline-none cursor-pointer"
                            defaultValue=""
                        >
                            <option value="" disabled>🌐</option>
                            <option value="en">English</option>
                            <option value="hi">हिंदी</option>
                        </select>

                        {/* Divider */}
                        {!loading && <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />}

                        {!loading && (
                            user ? (
                                <div className="flex items-center gap-3">
                                    <Link 
                                        href={user.roles.includes('ROLE_ADMIN') ? '/admin/dashboard' : '/dashboard'} 
                                        className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 rounded-xl transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                                    >
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                            {user.fullName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="text-left">
                                            <span className="text-sm font-bold text-gray-900 dark:text-white block leading-tight">{user.fullName}</span>
                                            <span className="text-[10px] font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                                                {user.roles.includes('ROLE_ADMIN') ? 'Admin' : user.roles.includes('ROLE_PROVIDER') ? 'Provider' : 'Student'}
                                            </span>
                                        </div>
                                    </Link>
                                    <button
                                        onClick={logout}
                                        className="text-sm px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 font-bold transition-all hover:shadow-sm flex items-center gap-1.5"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        {t('logout')}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <Link href="/login" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-primary-600 transition-colors">
                                        {t('login')}
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="text-sm px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                                    >
                                        Get Started
                                    </Link>
                                </div>
                            )
                        )}
                    </div>

                    {/* Mobile toggle */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {menuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Mobile Menu */}
                {menuOpen && (
                    <div className="md:hidden pb-4 space-y-2">
                        <Link href="/internships" className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                            {t('internships')}
                        </Link>
                        {user?.roles.includes('ROLE_STUDENT') && (
                            <Link href="/dashboard" className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                                {t('dashboard')}
                            </Link>
                        )}
                        {/* Mobile Language Switcher */}
                        <div className="px-3 py-2">
                            <select
                                onChange={(e) => handleLocaleChange(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 focus:outline-none"
                            >
                                <option value="en">English</option>
                                <option value="hi">हिंदी</option>
                            </select>
                        </div>
                        {user ? (
                            <div className="px-3 pt-2 space-y-3 border-t border-gray-100 dark:border-gray-800 mt-2">
                                <div className="flex items-center gap-3 py-2">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                        {user.fullName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white block">{user.fullName}</span>
                                        <span className="text-[10px] font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                                            {user.roles.includes('ROLE_ADMIN') ? 'Admin' : user.roles.includes('ROLE_PROVIDER') ? 'Provider' : 'Student'}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={logout}
                                    className="w-full text-sm px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-bold transition-all flex items-center justify-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    {t('logout')}
                                </button>
                            </div>
                        ) : (
                            <>
                                <Link href="/login" className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                                    {t('login')}
                                </Link>
                                <Link href="/register" className="block mx-3 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-primary-600 to-accent-600 text-white text-center shadow-md">
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
}
