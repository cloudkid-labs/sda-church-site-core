const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEX = /^#[0-9a-fA-F]{6}$/;

/** Validate and freeze the church-owned configuration at build time. */
export function defineChurchSite(input) {
  if (!input || typeof input !== 'object') throw new TypeError('Church site config must be an object');
  const issues = [];
  const id = typeof input.id === 'string' ? input.id.trim() : '';
  if (id.length > 55 || !SLUG.test(id)) issues.push('id must be a lowercase slug of at most 55 characters');
  if (!input.name || typeof input.name.af !== 'string' || typeof input.name.en !== 'string') {
    issues.push('name must contain af and en strings');
  }
  const locales = Array.isArray(input.locales) ? [...new Set(input.locales)] : [];
  if (locales.length === 0 || locales.some((locale) => !['af', 'en'].includes(locale))) {
    issues.push('locales must contain af, en, or both');
  }
  const defaultLocale = input.defaultLocale ?? locales[0];
  if (!locales.includes(defaultLocale)) issues.push('defaultLocale must be listed in locales');

  const pages = Array.isArray(input.pages) ? input.pages : [];
  const seenSlugs = new Set();
  for (const [index, page] of pages.entries()) {
    if (!page || typeof page.slug !== 'string' || (!page.home && !SLUG.test(page.slug))) {
      issues.push(`pages.${index}.slug must be a lowercase route slug`);
      continue;
    }
    if (seenSlugs.has(page.slug)) issues.push(`pages.${index}.slug is duplicated`);
    seenSlugs.add(page.slug);
    if (page.navigationLabel && typeof page.navigationLabel !== 'object') {
      issues.push(`pages.${index}.navigationLabel must be localized text`);
    }
  }

  const sections = Array.isArray(input.sections) ? input.sections : [];
  const seenSections = new Set();
  for (const [index, section] of sections.entries()) {
    if (!section || typeof section.id !== 'string' || !SLUG.test(section.id)) {
      issues.push(`sections.${index}.id must be a lowercase slug`);
      continue;
    }
    if (seenSections.has(section.id)) issues.push(`sections.${index}.id is duplicated`);
    seenSections.add(section.id);
  }

  const theme = input.theme && typeof input.theme === 'object' ? input.theme : {};
  for (const key of ['primary', 'accent']) {
    if (theme[key] !== undefined && (typeof theme[key] !== 'string' || !HEX.test(theme[key]))) {
      issues.push(`theme.${key} must be a six-digit hex color`);
    }
  }
  if (input.url) {
    try {
      if (new URL(input.url).protocol !== 'https:') issues.push('url must use https');
    } catch {
      issues.push('url must be an absolute https URL');
    }
  }

  let location;
  if (input.location !== undefined) {
    const value = input.location && typeof input.location === 'object' ? input.location : {};
    if (!Number.isFinite(value.lat) || value.lat < -90 || value.lat > 90) issues.push('location.lat must be a valid latitude');
    if (!Number.isFinite(value.lng) || value.lng < -180 || value.lng > 180) issues.push('location.lng must be a valid longitude');
    if (!(typeof value.address === 'string' || (value.address && typeof value.address === 'object'))) {
      issues.push('location.address must be text or localized text');
    }
    if (typeof value.directionsUrl !== 'string' || !/^https:\/\//.test(value.directionsUrl)) {
      issues.push('location.directionsUrl must be an https URL');
    }
    if (value.appleMapsUrl !== undefined && (typeof value.appleMapsUrl !== 'string' || !/^https:\/\//.test(value.appleMapsUrl))) {
      issues.push('location.appleMapsUrl must be an https URL');
    }
    if (value.markerUrl !== undefined && (typeof value.markerUrl !== 'string' || (!value.markerUrl.startsWith('/') && !/^https:\/\//.test(value.markerUrl)))) {
      issues.push('location.markerUrl must be a local path or https URL');
    }
    location = {
      address: value.address,
      lat: value.lat,
      lng: value.lng,
      directionsUrl: value.directionsUrl,
      ...(value.appleMapsUrl ? { appleMapsUrl: value.appleMapsUrl } : {}),
      ...(value.markerUrl ? { markerUrl: value.markerUrl } : {}),
    };
  }
  const serviceTimes = Array.isArray(input.serviceTimes) ? input.serviceTimes : [];
  if (serviceTimes.some((time) => !time || !(typeof time.name === 'string' || (time.name && typeof time.name === 'object')) || typeof time.start !== 'string' || typeof time.end !== 'string')) {
    issues.push('serviceTimes entries need a name, start, and end');
  }

  if (issues.length) throw new TypeError(`Invalid church site config:\n- ${issues.join('\n- ')}`);
  return deepFreeze({
    id,
    name: { ...input.name },
    locales,
    defaultLocale,
    timezone: input.timezone ?? 'Africa/Johannesburg',
    url: input.url ?? '',
    ...(location ? { location } : {}),
    serviceTimes: [...serviceTimes],
    theme: { primary: theme.primary ?? '#17334d', accent: theme.accent ?? '#dd7b33' },
    pages: pages.map((page) => ({ enabled: true, ...page })),
    sections: sections.map((section, order) => ({ enabled: true, order, ...section })),
  });
}

export function enabledPages(config) {
  return config.pages.filter((page) => page.enabled !== false);
}

export function navigationPages(config, locale = config.defaultLocale) {
  return enabledPages(config)
    .filter((page) => page.home !== true && page.navigation !== false)
    .map((page) => ({
      slug: page.slug,
      href: `/${page.slug}/`,
      label: localize(page.navigationLabel ?? page.title ?? page.slug, locale, config.defaultLocale),
    }));
}

export function enabledSections(config, page = 'home') {
  return config.sections
    .filter((section) => section.enabled !== false && (section.page ?? 'home') === page)
    .sort((a, b) => a.order - b.order);
}

export function localize(value, locale, fallback = 'af') {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  return value[locale] ?? value[fallback] ?? Object.values(value).find((v) => typeof v === 'string') ?? '';
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}
