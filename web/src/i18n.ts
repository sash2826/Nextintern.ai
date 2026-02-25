import { getRequestConfig } from 'next-intl/server';

import { notFound } from 'next/navigation';
import { SUPPORTED_LOCALES, Locale, DEFAULT_LOCALE } from './config/locales';

export default getRequestConfig(async ({ requestLocale }) => {
    // Resolve the locale from the request (set by middleware)
    const locale = await requestLocale;

    // Validate - throw notFound if missing or unsupported
    if (!locale || !SUPPORTED_LOCALES.includes(locale as Locale)) {
        notFound();
    }

    return {
        locale,
        messages: (await import(`./messages/${locale}.json`)).default
    };
});
