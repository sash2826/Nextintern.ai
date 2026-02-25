export const SUPPORTED_LOCALES = ['en', 'hi', 'es', 'fr'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';
