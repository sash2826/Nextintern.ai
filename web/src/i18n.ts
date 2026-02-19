import { getRequestConfig } from 'next-intl/server';

export const locales = ['en', 'hi'] as const;
export type AppLocale = (typeof locales)[number];

export default getRequestConfig(async ({ requestLocale }) => {
    // Resolve the locale from the request (set by middleware)
    let locale = await requestLocale;

    // Validate - fallback to 'en' if missing or unsupported
    if (!locale || !locales.includes(locale as AppLocale)) {
        locale = 'en';
    }

    return {
        locale,
        messages: (await import(`./messages/${locale}.json`)).default
    };
});
