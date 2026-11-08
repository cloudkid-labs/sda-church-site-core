# SDA church site core

`@cloudkid-labs/sda-church-site-core` is the versioned UX and content contract used by independent SDA church sites. It provides validated site configuration, navigation and section switches, a bilingual CMS page renderer, and safe CMS page validation. A church site keeps its own content, storage, accounts, domain, and Cloudflare resources.

## Install

The package is published to GitHub Packages. Configure npm for the organization scope and authenticate with a classic GitHub token that has `read:packages`:

```ini
# .npmrc
@cloudkid-labs:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

Then install it in a site that already uses React:

```sh
npm install @cloudkid-labs/sda-church-site-core
```

The package requires React 18 or 19 as a peer dependency. Import `@cloudkid-labs/sda-church-site-core/styles.css` once in the site's global stylesheet.

## Site configuration

```js
import { defineChurchSite, enabledSections, navigationPages } from '@cloudkid-labs/sda-church-site-core';

export const site = defineChurchSite({
  id: 'sample-church',
  name: { af: 'SDA Voorbeeld', en: 'Sample SDA Church' },
  locales: ['af', 'en'],
  defaultLocale: 'af',
  theme: { primary: '#17334d', accent: '#dd7b33' },
  location: {
    address: { af: 'Kerkstraat 1, Dorp', en: '1 Church Street, Town' },
    lat: -33.9,
    lng: 18.6,
    directionsUrl: 'https://maps.google.com/?q=sample+church',
    markerUrl: '/map-marker.svg',
  },
  serviceTimes: [{ name: { af: 'Erediens', en: 'Divine service' }, start: '11:00', end: '12:00' }],
  pages: [
    { slug: '', home: true, navigation: false },
    { slug: 'about', title: { af: 'Oor ons', en: 'About' } },
  ],
  sections: [
    { id: 'service-times', type: 'infoCard', enabled: true },
    { id: 'youth', type: 'cardGrid', enabled: false },
  ],
});

const nav = navigationPages(site);
const homeSections = enabledSections(site);
```

Pages and sections are data. Each site can enable or omit routes and CMS blocks without forking the shared renderer. `CmsPage` renders the supported block types, including a `map` block that uses the site's location, service times, and theme. Its `ChurchMap` component uses Leaflet and OpenStreetMap with the required tile attribution. A site can keep church-specific blocks in its own application and render them alongside the core components.

## CMS contract

`validateCmsPage` validates the shared public page shape and safe links before a site's own Worker persists it. The core package does not choose storage, authentication, mail routing, or hosting. Each church owns that backend and its CMS data. Use Cloudflare Access or an equivalent authenticated boundary for CMS write endpoints.

## Releases and downstream updates

Publish a GitHub Release tagged to match `package.json` (for example, `v1.0.0`). The release workflow publishes that version to GitHub Packages. Keep `1.x` releases backward compatible. Patch and minor releases can be auto-merged by consuming sites after their required build checks pass; major releases remain review PRs. Each church repo updates and deploys independently.

New sites can start from [`sda-church-site-template`](https://github.com/cloudkid-labs/sda-church-site-template). Set a `GH_PACKAGES_READ_TOKEN` Dependabot secret in each consumer repository so it can check for package updates.
