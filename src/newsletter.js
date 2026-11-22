import React, { useEffect, useId, useRef, useState } from 'react';
import { isVisible, localize } from './config.js';

const h = React.createElement;
const DEFAULT_COPY = {
  af: {
    title: 'Bly op hoogte', description: 'Ontvang nuus en opdaterings van die kerk.',
    email: 'E-posadres', consent: 'Ek stem in om nuusbriewe te ontvang.',
    privacy: 'Privaatheidsbeleid', submit: 'Teken in', sending: 'Besig om te stuur…',
    success: 'Dankie, ons het jou inskrywing ontvang.',
    error: 'Ons kon nie jou inskrywing verwerk nie. Probeer asseblief weer.',
    captcha: 'Voltooi asseblief die sekuriteitskontrole.',
  },
  en: {
    title: 'Stay in touch', description: 'Receive news and updates from the church.',
    email: 'Email address', consent: 'I agree to receive newsletters.',
    privacy: 'Privacy policy', submit: 'Subscribe', sending: 'Sending…',
    success: 'Thank you, we have received your signup.',
    error: 'We could not process your subscription. Please try again.',
    captcha: 'Please complete the security check.',
  },
};

function turnstile() {
  return typeof window !== 'undefined' ? window.turnstile : undefined;
}

function loadTurnstile(callback) {
  const api = turnstile();
  if (api) { callback(api); return () => {}; }
  let script = document.querySelector('script[data-sda-turnstile]');
  if (!script) {
    script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.dataset.sdaTurnstile = 'true';
    script.addEventListener('load', () => { script.dataset.loaded = 'true'; }, { once: true });
    document.head.appendChild(script);
  }
  if (script.dataset.loaded === 'true') {
    const loaded = turnstile();
    if (loaded) callback(loaded);
    return () => {};
  }
  const onLoad = () => {
    const loaded = turnstile();
    if (loaded) callback(loaded);
  };
  script.addEventListener('load', onLoad, { once: true });
  return () => script.removeEventListener('load', onLoad);
}

export function NewsletterSignup({ site, locale = site.defaultLocale }) {
  const config = site.newsletter;
  const formId = useId();
  const widget = useRef(null);
  const widgetId = useRef(undefined);
  const [enabled, setEnabled] = useState(false);
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    if (!config?.enabled || !config.endpoint || !config.turnstileSiteKey) return;
    let cancelled = false;
    fetch(config.endpoint, { headers: { Accept: 'application/json' }, cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (!cancelled) setEnabled(data?.enabled === true); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [config?.enabled, config?.endpoint, config?.turnstileSiteKey]);

  useEffect(() => {
    if (!enabled || !widget.current || status === 'success' || widgetId.current) return;
    let cancelled = false;
    const render = (api) => {
      if (cancelled || !widget.current || widgetId.current) return;
      widgetId.current = api.render(widget.current, {
        sitekey: config.turnstileSiteKey,
        action: 'newsletter',
        callback: (value) => setToken(value),
        'expired-callback': () => setToken(''),
        'error-callback': () => setToken(''),
      });
    };
    const cleanup = loadTurnstile(render);
    return () => { cancelled = true; cleanup(); };
  }, [enabled, status, config?.turnstileSiteKey]);

  if (!isVisible(site, 'newsletter') || !enabled) return null;
  const fallbackLocale = site.defaultLocale;
  const text = (key) => localize(config.copy?.[key] ?? DEFAULT_COPY[key], locale, fallbackLocale);

  async function submit(event) {
    event.preventDefault();
    if (!token) { setStatus('captcha'); return; }
    const form = new FormData(event.currentTarget);
    setStatus('sending');
    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.get('email'),
          consent: form.get('consent') === 'on',
          token,
        }),
      });
      if (!response.ok) throw new Error('Newsletter signup failed');
      setStatus('success');
    } catch {
      setStatus('error');
      setToken('');
      turnstile()?.reset(widgetId.current);
    }
  }

  const privacyHref = config.privacyHref;
  return h('section', { className: 'sda-newsletter', 'aria-labelledby': `${formId}-title` },
    h('div', { className: 'sda-newsletter__card' },
      h('h2', { id: `${formId}-title` }, text('title')),
      h('p', { className: 'sda-newsletter__description' }, text('description')),
      status === 'success'
        ? h('p', { role: 'status', className: 'sda-newsletter__message' }, text('success'))
        : h('form', { onSubmit: submit },
          h('label', { htmlFor: `${formId}-email` }, text('email')),
          h('div', { className: 'sda-newsletter__controls' },
            h('input', { id: `${formId}-email`, name: 'email', type: 'email', autoComplete: 'email', required: true, maxLength: 254 }),
            h('button', { type: 'submit', disabled: status === 'sending' }, text(status === 'sending' ? 'sending' : 'submit')),
          ),
          h('label', { className: 'sda-newsletter__consent' },
            h('input', { name: 'consent', type: 'checkbox', required: true }),
            h('span', null, text('consent'), privacyHref && h('a', { href: privacyHref }, text('privacy'))),
          ),
          h('div', { ref: widget, className: 'sda-newsletter__captcha' }),
          (status === 'error' || status === 'captcha') && h('p', {
            role: 'alert',
            className: 'sda-newsletter__message',
          }, text(status)),
        ),
    ),
  );
}
