import type { CmsPageData } from './index.js';

export function isSafeCmsHref(href: unknown): href is string;
export function isCmsSlug(slug: unknown): slug is string;
export function validateCmsPage(value: unknown): { ok: true; value: CmsPageData } | { ok: false; errors: string[] };
export function createEmptyCmsPage(slug: string, title?: string): CmsPageData & { status: 'draft' };
