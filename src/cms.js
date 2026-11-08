const BLOCK_TYPES = new Set(['text', 'callout', 'cardGrid', 'faq', 'image', 'linkList', 'map']);
const RESERVED_SLUGS = new Set(['404', '_astro', 'admin', 'api', 'favicon', 'index', 'login', 'members', 'robots', 'sitemap']);
const SAFE_LOCAL_HREF = /^\/(?!\/)[A-Za-z0-9\-._~/?#=&%]*$/;

export function isSafeCmsHref(href) {
  if (typeof href !== 'string' || href.length > 300) return false;
  if (SAFE_LOCAL_HREF.test(href)) return true;
  try {
    return new URL(href).protocol === 'https:';
  } catch {
    return false;
  }
}

export function isCmsSlug(slug) {
  return typeof slug === 'string'
    && slug.length <= 60
    && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
    && !RESERVED_SLUGS.has(slug);
}

/** Return a cleaned CMS page or field paths that need correction. */
export function validateCmsPage(value) {
  const errors = [];
  const page = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  if (!isCmsSlug(page.slug)) errors.push('slug');
  if (page.enabled !== undefined && typeof page.enabled !== 'boolean') errors.push('enabled');
  if (page.status !== undefined && page.status !== 'draft' && page.status !== 'live') errors.push('status');
  for (const field of ['title', 'intro']) {
    const localized = page[field] && typeof page[field] === 'object' ? page[field] : {};
    for (const locale of ['af', 'en']) {
      if (typeof localized[locale] !== 'string' || localized[locale].length > (field === 'title' ? 120 : 2000)) {
        errors.push(`${field}.${locale}`);
      }
    }
  }
  if (!Array.isArray(page.blocks) || page.blocks.length > 30) errors.push('blocks');
  else page.blocks.forEach((block, index) => validateBlock(block, index, errors));
  return errors.length ? { ok: false, errors } : { ok: true, value: { ...page, blocks: page.blocks } };
}

function localized(value, path, errors, max = 2000, required = false) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    errors.push(path);
    return;
  }
  for (const locale of ['af', 'en']) {
    const text = value[locale];
    if (typeof text !== 'string' || text.length > max || (required && !text.trim())) errors.push(`${path}.${locale}`);
  }
}

function validateBlock(block, index, errors) {
  const path = `blocks.${index}`;
  if (!block || typeof block !== 'object' || Array.isArray(block) || !BLOCK_TYPES.has(block.type)) {
    errors.push(`${path}.type`);
    return;
  }
  if (block.type === 'text' || block.type === 'callout') {
    localized(block.heading, `${path}.heading`, errors, 120, block.type === 'callout');
    localized(block.body, `${path}.body`, errors);
    if (block.button !== undefined) {
      localized(block.button?.label, `${path}.button.label`, errors, 100, true);
      if (!isSafeCmsHref(block.button?.href)) errors.push(`${path}.button.href`);
    }
  }
  if (block.type === 'cardGrid') {
    localized(block.heading, `${path}.heading`, errors, 120);
    if (!Array.isArray(block.cards) || block.cards.length > 12) errors.push(`${path}.cards`);
    else block.cards.forEach((card, cardIndex) => {
      localized(card?.title, `${path}.cards.${cardIndex}.title`, errors, 120, true);
      localized(card?.body, `${path}.cards.${cardIndex}.body`, errors, 1000);
    });
  }
  if (block.type === 'faq') {
    if (!Array.isArray(block.items) || block.items.length > 12) errors.push(`${path}.items`);
    else block.items.forEach((item, itemIndex) => {
      localized(item?.question, `${path}.items.${itemIndex}.question`, errors, 300, true);
      localized(item?.answer, `${path}.items.${itemIndex}.answer`, errors, 2000, true);
    });
  }
  if (block.type === 'image') {
    if (!isSafeCmsHref(block.src)) errors.push(`${path}.src`);
    localized(block.alt, `${path}.alt`, errors, 300, true);
    localized(block.caption, `${path}.caption`, errors, 300);
  }
  if (block.type === 'linkList') {
    localized(block.heading, `${path}.heading`, errors, 120);
    if (!Array.isArray(block.links) || block.links.length > 12) errors.push(`${path}.links`);
    else block.links.forEach((link, linkIndex) => {
      localized(link?.label, `${path}.links.${linkIndex}.label`, errors, 100, true);
      if (!isSafeCmsHref(link?.href)) errors.push(`${path}.links.${linkIndex}.href`);
    });
  }
}

export function createEmptyCmsPage(slug, title) {
  if (!isCmsSlug(slug)) throw new TypeError('CMS page slug is invalid or reserved');
  return {
    slug,
    title: { af: title ?? '', en: title ?? '' },
    intro: { af: '', en: '' },
    blocks: [],
    status: 'draft',
  };
}
