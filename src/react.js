import React from 'react';
import { localize } from './config.js';
import { isSafeCmsHref } from './cms.js';

const h = React.createElement;

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
      h('div', { className: 'sda-page__blocks' }, enabled.map((block, index) => renderBlock(block, locale, index, site.defaultLocale))),
    ),
  );
}

function renderBlock(block, locale, index, fallback) {
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
    default:
      return null;
  }
}
