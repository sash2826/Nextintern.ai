import createMiddleware from 'next-intl/middleware';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from './config/locales';

export default createMiddleware({
    // A list of all locales that are supported
    locales: SUPPORTED_LOCALES,

    // Used when no locale matches
    defaultLocale: DEFAULT_LOCALE,

    // Always prefix the URL with the locale
    localePrefix: 'always'
});

export const config = {
    // Match only internationalized pathnames
    // Skip API routes, static files, and Next.js internal files
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
