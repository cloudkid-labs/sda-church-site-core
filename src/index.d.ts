import type { ComponentType } from 'react';

export type Locale = 'af' | 'en';
export type LocalizedText = Partial<Record<Locale, string>>;
export type ChurchPageConfig = {
  slug: string;
  title?: string | LocalizedText;
  navigationLabel?: string | LocalizedText;
  enabled?: boolean;
  navigation?: boolean;
  home?: boolean;
};
export type ChurchSectionConfig = { id: string; page?: string; type: string; enabled?: boolean; order?: number };
export type ChurchLocationConfig = {
  address: string | LocalizedText;
  lat: number;
  lng: number;
  directionsUrl: string;
  appleMapsUrl?: string;
  markerUrl?: string;
};
export type ChurchServiceTimeConfig = { name: string | LocalizedText; start: string; end: string };
export type ChurchSiteConfig = {
  id: string;
  name: Record<Locale, string>;
  locales: Locale[];
  defaultLocale: Locale;
  timezone: string;
  url: string;
  location?: ChurchLocationConfig;
  serviceTimes?: ChurchServiceTimeConfig[];
  theme: { primary: string; accent: string };
  pages: ChurchPageConfig[];
  sections: ChurchSectionConfig[];
  visibility: Record<string, boolean>;
};
export type CmsBlock = { type: string; id?: string; enabled?: boolean; [key: string]: unknown };
export type CmsPageData = {
  slug: string;
  title: LocalizedText;
  eyebrow?: LocalizedText;
  intro?: LocalizedText;
  blocks: CmsBlock[];
  enabled?: boolean;
  status?: 'draft' | 'live';
};

export function defineChurchSite<T extends Omit<ChurchSiteConfig, 'timezone' | 'url' | 'theme' | 'pages' | 'sections' | 'visibility'> & Partial<Pick<ChurchSiteConfig, 'timezone' | 'url' | 'theme' | 'pages' | 'sections' | 'visibility'>>>(input: T): ChurchSiteConfig;
export function isVisible(config: Pick<ChurchSiteConfig, 'visibility'>, key: string): boolean;
export function enabledPages(config: ChurchSiteConfig): ChurchPageConfig[];
export function navigationPages(config: ChurchSiteConfig, locale?: Locale): { slug: string; href: string; label: string }[];
export function enabledSections(config: ChurchSiteConfig, page?: string): ChurchSectionConfig[];
export function localize(value: string | LocalizedText, locale: Locale, fallback?: Locale): string;
export function isSafeCmsHref(href: unknown): href is string;
export function isCmsSlug(slug: unknown): slug is string;
export function validateCmsPage(value: unknown): { ok: true; value: CmsPageData } | { ok: false; errors: string[] };
export function createEmptyCmsPage(slug: string, title?: string): CmsPageData & { status: 'draft' };
export { ChurchLanguageSwitcher, ChurchLocaleProvider, useChurchLocale } from './locale.js';
export const ChurchNavigation: ComponentType<{ site: ChurchSiteConfig; locale?: Locale; currentPath?: string }>;
export const CmsPage: ComponentType<{ site: ChurchSiteConfig; page: CmsPageData; locale?: Locale; currentPath?: string }>;
export const ChurchMap: ComponentType<{ lat: number; lng: number; name: string; address: string; markerUrl?: string; zoom?: number; className?: string }>;
export const ChurchVisitMap: ComponentType<{ site: ChurchSiteConfig; locale?: Locale; labels?: Record<string, string>; visibilityPrefix?: string }>;

