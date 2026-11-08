import React, { useEffect, useState } from 'react';
import { isVisible } from './config.js';

const h = React.createElement;
const LocaleContext = React.createContext(null);

/** Keep one language choice across the site's separate page roots. */
export function ChurchLocaleProvider({ site, storageKey = `${site.id}-lang`, children }) {
  const [locale, setLocale] = useState(site.defaultLocale);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (site.locales.includes(saved)) setLocale(saved);
    } catch {
      // Private mode / blocked storage: keep the configured default.
    }
  }, [site, storageKey]);

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      window.localStorage.setItem(storageKey, locale);
    } catch {
      // Persistence is a convenience; language switching still works.
    }
  }, [locale, storageKey]);

  return h(LocaleContext.Provider, { value: { locale, setLocale } }, children);
}

export function useChurchLocale() {
  const value = React.useContext(LocaleContext);
  if (!value) throw new Error('useChurchLocale must be used within a ChurchLocaleProvider');
  return value;
}

export function ChurchLanguageSwitcher({ site, className = '' }) {
  const { locale, setLocale } = useChurchLocale();
  if (!isVisible(site, 'language.switcher') || site.locales.length < 2) return null;

  return h('div', {
    className: `sda-language ${className}`.trim(),
    role: 'group',
    'aria-label': locale === 'af' ? 'Taal' : 'Language',
  }, site.locales.map((code) => h('button', {
    key: code,
    type: 'button',
    lang: code,
    'aria-pressed': locale === code,
    onClick: () => setLocale(code),
  }, code.toUpperCase())));
}

