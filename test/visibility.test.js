import assert from 'node:assert/strict';
import test from 'node:test';
import { defineChurchSite, isVisible } from '../src/config.js';

test('visibility defaults on, honors false, and rejects invalid config', () => {
  const site = defineChurchSite({
    id: 'sample-church',
    name: { af: 'SDA Voorbeeld', en: 'Sample SDA Church' },
    locales: ['af', 'en'],
    defaultLocale: 'af',
    visibility: { 'page.home.title': false },
  });

  assert.equal(isVisible(site, 'page.home.title'), false);
  assert.equal(isVisible(site, 'page.home.intro'), true);
  assert.throws(() => defineChurchSite({
    id: 'sample-church',
    name: { af: 'SDA Voorbeeld', en: 'Sample SDA Church' },
    locales: ['af', 'en'],
    defaultLocale: 'af',
    visibility: { 'page..title': false },
  }), /visibility/);
});
