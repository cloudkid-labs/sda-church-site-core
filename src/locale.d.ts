import type { ComponentType, ReactNode } from 'react';
import type { ChurchSiteConfig, Locale } from './index.js';

export const ChurchLocaleProvider: ComponentType<{ site: ChurchSiteConfig; storageKey?: string; children?: ReactNode }>;
export function useChurchLocale(): { locale: Locale; setLocale: (locale: Locale) => void };
export const ChurchLanguageSwitcher: ComponentType<{ site: ChurchSiteConfig; className?: string }>;

