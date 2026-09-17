import { getUtmParams, initUtmCapture, type UtmParams } from './utm';

const WHATSAPP_TRACK_SELECTOR = '[data-track="whatsapp-group"]';

function getMetaPixelId(): string {
  return document.body.dataset.metaPixelId ?? '';
}

function isHomePath(): boolean {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  return path === '/' || path === '/index.html';
}

function loadMetaPixel(pixelId: string): void {
  if (!pixelId || window.fbq) return;

  /* Standard Meta Pixel bootstrap */
  const n = (window.fbq = function (...args: unknown[]) {
    if (n.callMethod) {
      n.callMethod(...args);
    } else {
      n.queue.push(args);
    }
  }) as typeof window.fbq & {
    callMethod?: (...args: unknown[]) => void;
    queue: unknown[][];
    loaded?: boolean;
    version?: string;
  };

  if (!window._fbq) window._fbq = n;
  n.queue = [];
  n.loaded = true;
  n.version = '2.0';

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);

  window.fbq('init', pixelId);
  // PageView só na home — /achadinhos já tem OffersCatalogView
  if (isHomePath()) {
    window.fbq('track', 'PageView');
  }
}

function trackCustom(eventName: string, params: Record<string, unknown> = {}): void {
  if (typeof window.fbq !== 'function') return;
  window.fbq('trackCustom', eventName, {
    ...getUtmParams(),
    ...params,
  });
}

/** Posição do CTA WhatsApp no funil (sem valor monetário). */
type CtaPosition = 'hero' | 'feed' | 'final';

function parseCtaPosition(value: string | undefined): CtaPosition | undefined {
  if (value === 'hero' || value === 'feed' || value === 'final') return value;
  return undefined;
}

function trackWhatsAppGroupClick(
  utmParams: UtmParams,
  ctaPosition?: CtaPosition,
): void {
  if (typeof window.fbq !== 'function') return;
  window.fbq('trackCustom', 'WhatsAppGroupClick', {
    ...utmParams,
    ...(ctaPosition ? { cta_position: ctaPosition } : {}),
  });
}

function handleWhatsAppClick(event: Event): void {
  const link = event.currentTarget as HTMLAnchorElement;
  const href = link.getAttribute('href');

  if (!href || href === '#') return;

  const ctaPosition = parseCtaPosition(link.dataset.ctaPosition?.trim());
  trackWhatsAppGroupClick(getUtmParams(), ctaPosition);
}

function bindWhatsAppLinks(root: ParentNode = document): void {
  root.querySelectorAll(WHATSAPP_TRACK_SELECTOR).forEach((element) => {
    if ((element as HTMLElement).dataset.waBound === 'true') return;
    (element as HTMLElement).dataset.waBound = 'true';
    element.addEventListener('click', handleWhatsAppClick);
  });
}

function observeSectionOnce(
  selector: string,
  eventName: string,
  threshold = 0.35,
): void {
  const section = document.querySelector(selector);
  if (!section || typeof IntersectionObserver === 'undefined') return;

  let fired = false;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || fired) continue;
        fired = true;
        trackCustom(eventName);
        observer.disconnect();
      }
    },
    { threshold },
  );

  observer.observe(section);
}

function observeFeedCtas(): void {
  if (typeof IntersectionObserver === 'undefined') return;

  const seen = new Set<string>();

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        const key = el.dataset.feedCta ?? el.dataset.trackSection ?? '';
        if (!key || seen.has(key)) continue;
        seen.add(key);
        trackCustom('FeedCtaView', {
          source:
            key === '1' || key === 'feed_cta_1'
              ? 'feed_cta'
              : key === '2' || key === 'feed_cta_2'
                ? 'feed_cta'
                : key === 'feed-cta'
                  ? 'feed_cta'
                  : key,
        });
        observer.unobserve(el);
      }
    },
    { threshold: 0.4 },
  );

  const watch = () => {
    document.querySelectorAll('[data-feed-cta]').forEach((el) => {
      if ((el as HTMLElement).dataset.observed === 'true') return;
      (el as HTMLElement).dataset.observed = 'true';
      observer.observe(el);
    });
  };

  watch();
  document.addEventListener('malica:offers-rendered', () => {
    bindWhatsAppLinks();
    watch();
  });
}

function bindOfferFilterTracking(): void {
  document.addEventListener('malica:offer-filter', ((event: CustomEvent<{ filter: string }>) => {
    trackCustom('OfferFilterClick', { filter: event.detail?.filter ?? '' });
  }) as EventListener);

  document.addEventListener('malica:offer-store-filter', ((event: CustomEvent<{ store: string }>) => {
    trackCustom('OfferStoreFilterClick', { store: event.detail?.store ?? '' });
  }) as EventListener);
}

function bindSeeAllOffers(): void {
  document.querySelectorAll('[data-track="see-all-offers"]').forEach((el) => {
    if ((el as HTMLElement).dataset.seeAllBound === 'true') return;
    (el as HTMLElement).dataset.seeAllBound = 'true';
    el.addEventListener('click', () => {
      trackCustom('SeeAllOffersClick');
    });
  });
}

function bindOfferCardClicks(): void {
  const root = document.querySelector('[data-offers-root]');
  if (!root || (root as HTMLElement).dataset.offerClickBound === 'true') return;
  (root as HTMLElement).dataset.offerClickBound = 'true';

  root.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    const link = target?.closest<HTMLAnchorElement>('[data-track="offer-card"]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href === '#') return;
    trackCustom('OfferCardClick', {
      loja: link.querySelector('[data-offer-store]')?.textContent ?? '',
    });
  });
}

export function initTracking(): void {
  initUtmCapture();

  const pixelId = getMetaPixelId();
  if (pixelId) {
    loadMetaPixel(pixelId);
  }

  bindWhatsAppLinks();
  observeSectionOnce('[data-track-section="offers"]', 'OffersSectionView');
  observeSectionOnce('[data-track-section="offers-catalog"]', 'OffersCatalogView');
  observeSectionOnce('[data-track-section="final-cta"]', 'FinalCtaView', 0.4);
  observeFeedCtas();
  bindOfferFilterTracking();
  bindSeeAllOffers();
  bindOfferCardClicks();

  document.addEventListener('malica:offers-rendered', () => {
    bindWhatsAppLinks();
    bindSeeAllOffers();
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTracking);
  } else {
    initTracking();
  }
}
