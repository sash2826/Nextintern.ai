import { createNavigation } from 'next-intl/navigation';
import { SUPPORTED_LOCALES as locales } from './config/locales';

export const { Link, redirect, usePathname, useRouter } = createNavigation({ locales, localePrefix: 'always' });
