import React, { useEffect, useRef, useState } from 'react';
import { localize } from './config.js';
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

export function ChurchVisitMap({ site, locale = site.defaultLocale, labels = {} }) {
  const location = site.location;
  const [copyState, setCopyState] = useState('idle');
  const timer = useRef(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  if (!location) return null;

  const copy = { ...DEFAULT_MAP_COPY[locale], ...labels };
  const address = localize(location.address, locale, site.defaultLocale);
  const name = localize(site.name, locale, site.defaultLocale);

  async function copyAddress() {
    let success = true;
    try { await navigator.clipboard.writeText(address); } catch { success = false; }
    setCopyState(success ? 'copied' : 'failed');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopyState('idle'), 2000);
  }

  return h('section', { className: 'sda-visit', style: { '--sda-primary': site.theme.primary, '--sda-accent': site.theme.accent } },
    h('div', { className: 'sda-visit__details' },
      h('p', { className: 'sda-visit__eyebrow' }, copy.eyebrow),
      h('h2', null, copy.heading),
      h('p', { className: 'sda-visit__label' }, copy.addressLabel),
      h('p', { className: 'sda-visit__address' }, address),
      h('button', { type: 'button', className: 'sda-visit__copy', onClick: copyAddress },
        copyState === 'copied' ? copy.copied : copyState === 'failed' ? copy.failed : copy.copy,
      ),
      site.serviceTimes?.length > 0 && h('div', { className: 'sda-visit__times' }, site.serviceTimes.map((time, index) =>
        h('div', { className: 'sda-visit__time', key: `${time.start}-${index}` },
          h('span', null, localize(time.name, locale, site.defaultLocale)),
          h('strong', null, `${copy.saturday} ${time.start} – ${time.end}`),
        ),
      )),
      h('a', { className: 'sda-visit__directions', href: location.directionsUrl, target: '_blank', rel: 'noopener noreferrer' }, `${copy.directions} →`),
      location.appleMapsUrl && h('a', { className: 'sda-visit__apple', href: location.appleMapsUrl, target: '_blank', rel: 'noopener noreferrer' }, copy.apple),
    ),
    h(ChurchMap, { lat: location.lat, lng: location.lng, name, address, markerUrl: location.markerUrl, className: 'sda-visit__map' }),
  );
}

export function ChurchNavigation({ site, locale = site.defaultLocale, currentPath = '/' }) {
  const links = site.pages
    .filter((page) => page.enabled !== false && page.home !== true && page.navigation !== false)
    .map((page) => ({
      href: `/${page.slug}/`,
      label: localize(page.navigationLabel ?? page.title ?? page.slug, locale, site.defaultLocale),
    }));
  return h('nav', { className: 'sda-nav', 'aria-label': locale === 'af' ? 'Hoofnavigasie' : 'Main navigation' },
    h('a', { className: 'sda-nav__brand', href: '/', 'aria-label': site.name[locale] }, site.name[locale]),
    h('ul', { className: 'sda-nav__links' }, links.map((link) => h('li', { key: link.href },
      h('a', { href: link.href, 'aria-current': currentPath === link.href ? 'page' : undefined }, link.label),
    ))),
  );
}

export function CmsPage({ site, page, locale = site.defaultLocale, currentPath }) {
  const enabled = (page.blocks ?? []).filter((block) => block.enabled !== false);
  return h('div', { className: 'sda-site', style: { '--sda-primary': site.theme.primary, '--sda-accent': site.theme.accent } },
    h(ChurchNavigation, { site, locale, currentPath }),
    h('main', { id: 'main', className: 'sda-page' },
      h('header', { className: 'sda-page__header' },
        page.eyebrow && h('p', { className: 'sda-page__eyebrow' }, localize(page.eyebrow, locale, site.defaultLocale)),
        h('h1', null, localize(page.title, locale, site.defaultLocale)),
        page.intro && h('p', { className: 'sda-page__intro' }, localize(page.intro, locale, site.defaultLocale)),
      ),
      h('div', { className: 'sda-page__blocks' }, enabled.map((block, index) => renderBlock(block, locale, index, site.defaultLocale, site))),
    ),
  );
}

function renderBlock(block, locale, index, fallback, site) {
  const title = (value) => localize(value, locale, fallback);
  switch (block.type) {
    case 'text':
      return h('section', { className: 'sda-block sda-block--text', key: block.id ?? index },
        block.heading && h('h2', null, title(block.heading)),
        ...title(block.body).split(/\n\s*\n/).filter(Boolean).map((paragraph, i) => h('p', { key: i }, paragraph)),
      );
    case 'callout':
      return h('aside', { className: 'sda-block sda-block--callout', key: block.id ?? index },
        h('h2', null, title(block.heading)),
        block.body && h('p', null, title(block.body)),
        block.button && isSafeCmsHref(block.button.href) && h('a', { href: block.button.href }, title(block.button.label)),
      );
    case 'cardGrid':
      return h('section', { className: 'sda-block', key: block.id ?? index },
        block.heading && h('h2', null, title(block.heading)),
        h('div', { className: 'sda-card-grid' }, (block.cards ?? []).map((card, i) => h('article', { className: 'sda-card', key: i },
          card.label && h('p', { className: 'sda-card__label' }, title(card.label)),
          h('h3', null, title(card.title)),
          card.body && h('p', null, title(card.body)),
        ))),
      );
    case 'faq':
      return h('section', { className: 'sda-block sda-faq', key: block.id ?? index },
        block.heading && h('h2', null, title(block.heading)),
        ...(block.items ?? []).map((item, i) => h('details', { key: i }, h('summary', null, title(item.question)), h('p', null, title(item.answer)))),
      );
    case 'image':
      return h('figure', { className: 'sda-block sda-image', key: block.id ?? index },
        h('img', { src: block.src, alt: title(block.alt), loading: 'lazy' }),
        block.caption && h('figcaption', null, title(block.caption)),
      );
    case 'linkList':
      return h('section', { className: 'sda-block', key: block.id ?? index },
        block.heading && h('h2', null, title(block.heading)),
        h('ul', null, (block.links ?? []).filter((link) => isSafeCmsHref(link.href)).map((link, i) => h('li', { key: i }, h('a', { href: link.href }, title(link.label))))),
      );
    case 'map':
      return h(ChurchVisitMap, { key: block.id ?? index, site, locale });
    default:
      return null;
  }
}
