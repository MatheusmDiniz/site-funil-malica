import { getUtmParams, initUtmCapture, type UtmParams } from './utm';

const WHATSAPP_TRACK_SELECTOR = '[data-track="whatsapp-group"]';

function getMetaPixelId(): string {
  return document.body.dataset.metaPixelId ?? '';
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
  window.fbq('track', 'PageView');
}

function trackWhatsAppGroupClick(utmParams: UtmParams): void {
  if (typeof window.fbq !== 'function') return;
  window.fbq('trackCustom', 'WhatsAppGroupClick', utmParams);
}

function handleWhatsAppClick(event: Event): void {
  const link = event.currentTarget as HTMLAnchorElement;
  const href = link.getAttribute('href');

  if (!href || href === '#') return;

  trackWhatsAppGroupClick(getUtmParams());
}

function bindWhatsAppLinks(): void {
  document.querySelectorAll(WHATSAPP_TRACK_SELECTOR).forEach((element) => {
    element.addEventListener('click', handleWhatsAppClick);
  });
}

export function initTracking(): void {
  initUtmCapture();

  const pixelId = getMetaPixelId();
  if (pixelId) {
    loadMetaPixel(pixelId);
  }

  bindWhatsAppLinks();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTracking);
  } else {
    initTracking();
  }
}
