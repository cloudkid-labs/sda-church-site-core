import type { ComponentType } from 'react';
import type { ChurchSiteConfig, CmsPageData, Locale } from './index.js';

export const ChurchNavigation: ComponentType<{ site: ChurchSiteConfig; locale?: Locale; currentPath?: string }>;
export const CmsPage: ComponentType<{ site: ChurchSiteConfig; page: CmsPageData; locale?: Locale; currentPath?: string }>;
export const ChurchMap: ComponentType<{ lat: number; lng: number; name: string; address: string; markerUrl?: string; zoom?: number; className?: string }>;
export const ChurchVisitMap: ComponentType<{ site: ChurchSiteConfig; locale?: Locale; labels?: Record<string, string> }>;
