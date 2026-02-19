import createMiddleware from 'next-intl/middleware';
import { locales } from './i18n';

export default createMiddleware({
    // A list of all locales that are supported
    locales: locales,

    // Used when no locale matches
    defaultLocale: 'en',

    // Always prefix the URL with the locale
    localePrefix: 'always'
});

export const config = {
    // Match only internationalized pathnames
    // Skip API routes, static files, and Next.js internal files
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
