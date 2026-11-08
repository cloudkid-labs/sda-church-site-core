import React, { useEffect, useRef, useState } from 'react';
import { isVisible, localize } from './config.js';
import { isSafeCmsHref } from './cms.js';

const h = React.createElement;

const DEFAULT_MAP_COPY = {
  af: {
    eyebrow: 'Besoek', heading: 'Beplan jou besoek', addressLabel: 'Adres', copy: 'Kopieer adres',
    copied: 'Gekopieer', failed: 'Kon nie kopieer nie', directions: 'Kry aanwysings', apple: 'Maak oop in Apple Maps', saturday: 'Sabbat',
  },
  en: {
    eyebrow: 'Visit', heading: 'Plan your visit', addressLabel: 'Address', copy: 'Copy address',
    copied: 'Copied', failed: 'Could not copy', directions: 'Get directions', apple: 'Open in Apple Maps', saturday: 'Sabbath',
  },
};

export function ChurchMap({ lat, lng, name, address, markerUrl, zoom = 16, className = '' }) {
  const element = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let map;
    setError(false);
    import('leaflet').then((module) => {
      if (cancelled || !element.current) return;
      const L = module.default ?? module;
      map = L.map(element.current, {
        scrollWheelZoom: false,
        dragging: !L.Browser.mobile,
        tap: false,
        attributionControl: true,
      }).setView([lat, lng], zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      const icon = markerUrl
        ? L.icon({ iconUrl: markerUrl, iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -18], className: 'sda-map-marker' })
        : L.divIcon({ className: 'sda-map-marker sda-map-marker--plain', html: '<span></span>', iconSize: [28, 28], iconAnchor: [14, 14] });
      const marker = L.marker([lat, lng], { icon, alt: name }).addTo(map);
      const popup = document.createElement('div');
      const heading = document.createElement('strong');
      heading.textContent = name;
      const line = document.createElement('br');
      const addressText = document.createTextNode(address);
      popup.append(heading, line, addressText);
      marker.bindPopup(popup).openPopup();
    }).catch(() => {
      if (!cancelled) setError(true);
    });
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [lat, lng, name, address, markerUrl, zoom]);

  return h('div', { className: `sda-map-shell ${className}`.trim() },
    h('div', { ref: element, className: 'sda-map', role: 'region', 'aria-label': name, tabIndex: 0 }),
    error && h('div', { className: 'sda-map-error', role: 'status' }, `Map unavailable. ${address}`),
  );
}

export function ChurchVisitMap({ site, locale = site.defaultLocale, labels = {}, visibilityPrefix = 'visit' }) {
  const location = site.location;
  const [copyState, setCopyState] = useState('idle');
  const timer = useRef(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const show = (key) => isVisible(site, `${visibilityPrefix}.${key}`);
  if (!location || !isVisible(site, visibilityPrefix)) return null;

  const copy = { ...DEFAULT_MAP_COPY[locale], ...labels };
  const address = localize(location.address, locale, site.defaultLocale);
  const name = localize(site.name, locale, site.defaultLocale);
  const serviceTimes = (site.serviceTimes ?? []).map((time, index) => {
    const key = `${visibilityPrefix}.service-times.${index}`;
    if (!show('service-times') || !isVisible(site, key)) return null;
    return h('div', { className: 'sda-visit__time', key: `${time.start}-${index}` },
      isVisible(site, `${key}.name`) && h('span', null, localize(time.name, locale, site.defaultLocale)),
      isVisible(site, `${key}.time`) && h('strong', null, `${copy.saturday} ${time.start} – ${time.end}`),
    );
  });

  async function copyAddress() {
    let success = true;
    try { await navigator.clipboard.writeText(address); } catch { success = false; }
    setCopyState(success ? 'copied' : 'failed');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopyState('idle'), 2000);
  }

  const details = [
    show('eyebrow') && h('p', { className: 'sda-visit__eyebrow' }, copy.eyebrow),
    show('heading') && h('h2', null, copy.heading),
    show('address-label') && h('p', { className: 'sda-visit__label' }, copy.addressLabel),
    show('address') && h('p', { className: 'sda-visit__address' }, address),
    show('copy-address') && h('button', { type: 'button', className: 'sda-visit__copy', onClick: copyAddress },
      copyState === 'copied' ? copy.copied : copyState === 'failed' ? copy.failed : copy.copy,
    ),
    serviceTimes.some(Boolean) && h('div', { className: 'sda-visit__times' }, serviceTimes),
    show('directions') && h('a', { className: 'sda-visit__directions', href: location.directionsUrl, target: '_blank', rel: 'noopener noreferrer' }, `${copy.directions} →`),
    show('apple-maps') && location.appleMapsUrl && h('a', { className: 'sda-visit__apple', href: location.appleMapsUrl, target: '_blank', rel: 'noopener noreferrer' }, copy.apple),
  ].filter(Boolean);

  return h('section', { className: 'sda-visit', style: { '--sda-primary': site.theme.primary, '--sda-accent': site.theme.accent } },
    details.length > 0 && h('div', { className: 'sda-visit__details' }, details),
    show('map') && h(ChurchMap, { lat: location.lat, lng: location.lng, name, address, markerUrl: location.markerUrl, className: 'sda-visit__map' }),
  );
}
export function ChurchNavigation({ site, locale = site.defaultLocale, currentPath = '/' }) {
  if (!isVisible(site, 'navigation')) return null;
  const links = site.pages
    .filter((page) => page.enabled !== false && page.home !== true && page.navigation !== false && isVisible(site, `navigation.page.${page.slug}`))
    .map((page) => ({
      href: `/${page.slug}/`,
      label: localize(page.navigationLabel ?? page.title ?? page.slug, locale, site.defaultLocale),
    }));
  const brand = isVisible(site, 'navigation.brand')
    ? h('a', { className: 'sda-nav__brand', href: '/', 'aria-label': site.name[locale] }, site.name[locale])
    : null;
  const items = isVisible(site, 'navigation.links') && links.length > 0
    ? h('ul', { className: 'sda-nav__links' }, links.map((link) => h('li', { key: link.href },
      h('a', { href: link.href, 'aria-current': currentPath === link.href ? 'page' : undefined }, link.label),
    )))
    : null;
  if (!brand && !items) return null;
  return h('nav', { className: 'sda-nav', 'aria-label': locale === 'af' ? 'Hoofnavigasie' : 'Main navigation' }, brand, items);
}
export function CmsPage({ site, page, locale = site.defaultLocale, currentPath }) {
  const pageKey = `page.${page.slug}`;
  if (!isVisible(site, pageKey)) return null;
  const blocks = (page.blocks ?? [])
    .map((block, index) => ({ block, index }))
    .filter(({ block, index }) => block.enabled !== false && isVisible(site, `${pageKey}.block.${block.id ?? index}`));
  const eyebrow = isVisible(site, `${pageKey}.eyebrow`) && page.eyebrow
    ? h('p', { className: 'sda-page__eyebrow' }, localize(page.eyebrow, locale, site.defaultLocale))
    : null;
  const heading = isVisible(site, `${pageKey}.title`)
    ? h('h1', null, localize(page.title, locale, site.defaultLocale))
    : null;
  const intro = isVisible(site, `${pageKey}.intro`) && page.intro
    ? h('p', { className: 'sda-page__intro' }, localize(page.intro, locale, site.defaultLocale))
    : null;
  const header = eyebrow || heading || intro
    ? h('header', { className: 'sda-page__header' }, eyebrow, heading, intro)
    : null;

  return h('div', { className: 'sda-site', style: { '--sda-primary': site.theme.primary, '--sda-accent': site.theme.accent } },
    h(ChurchNavigation, { site, locale, currentPath }),
    h('main', { id: 'main', className: 'sda-page' },
      header,
      blocks.length > 0 && h('div', { className: 'sda-page__blocks' },
        blocks.map(({ block, index }) => renderBlock(block, locale, index, site.defaultLocale, site, page.slug)),
      ),
    ),
  );
}

function renderBlock(block, locale, index, fallback, site, pageSlug) {
  const title = (value) => localize(value, locale, fallback);
  const key = `page.${pageSlug}.block.${block.id ?? index}`;
  const show = (part) => isVisible(site, `${key}.${part}`);
  switch (block.type) {
    case 'text': {
      const paragraphs = show('body')
        ? title(block.body).split(/\n\s*\n/).filter(Boolean)
            .map((paragraph, i) => isVisible(site, `${key}.body.paragraph.${i}`) && h('p', { key: i }, paragraph))
        : [];
      return h('section', { className: 'sda-block sda-block--text', key: block.id ?? index },
        show('heading') && block.heading && h('h2', null, title(block.heading)),
        ...paragraphs,
      );
    }
    case 'callout':
      return h('aside', { className: 'sda-block sda-block--callout', key: block.id ?? index },
        show('heading') && h('h2', null, title(block.heading)),
        show('body') && block.body && h('p', null, title(block.body)),
        show('button') && block.button && isSafeCmsHref(block.button.href) && h('a', { href: block.button.href }, title(block.button.label)),
      );
    case 'cardGrid':
      return h('section', { className: 'sda-block', key: block.id ?? index },
        show('heading') && block.heading && h('h2', null, title(block.heading)),
        h('div', { className: 'sda-card-grid' }, (block.cards ?? []).map((card, i) => {
          const cardKey = `${key}.card.${i}`;
          return isVisible(site, cardKey) && h('article', { className: 'sda-card', key: i },
            isVisible(site, `${cardKey}.label`) && card.label && h('p', { className: 'sda-card__label' }, title(card.label)),
            isVisible(site, `${cardKey}.title`) && h('h3', null, title(card.title)),
            isVisible(site, `${cardKey}.body`) && card.body && h('p', null, title(card.body)),
          );
        })),
      );
    case 'faq':
      return h('section', { className: 'sda-block sda-faq', key: block.id ?? index },
        show('heading') && block.heading && h('h2', null, title(block.heading)),
        ...(block.items ?? []).map((item, i) => {
          const itemKey = `${key}.item.${i}`;
          if (!isVisible(site, itemKey)) return null;
          const question = isVisible(site, `${itemKey}.question`) && h('summary', null, title(item.question));
          const answer = isVisible(site, `${itemKey}.answer`) && h('p', null, title(item.answer));
          return question || answer ? h('details', { key: i }, question, answer) : null;
        }),
      );
    case 'image':
      return h('figure', { className: 'sda-block sda-image', key: block.id ?? index },
        show('image') && h('img', { src: block.src, alt: title(block.alt), loading: 'lazy' }),
        show('caption') && block.caption && h('figcaption', null, title(block.caption)),
      );
    case 'linkList':
      return h('section', { className: 'sda-block', key: block.id ?? index },
        show('heading') && block.heading && h('h2', null, title(block.heading)),
        h('ul', null, (block.links ?? []).filter((link, i) =>
          isSafeCmsHref(link.href) && isVisible(site, `${key}.link.${i}`) && isVisible(site, `${key}.link.${i}.label`),
        ).map((link, i) => h('li', { key: i }, h('a', { href: link.href }, title(link.label))))),
      );
    case 'map':
      return h(ChurchVisitMap, { key: block.id ?? index, site, locale, visibilityPrefix: key });
    default:
      return null;
  }
}
