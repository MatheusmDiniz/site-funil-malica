import { formatRelativeTime } from './relative-time';

export type FeedOffer = {
  titulo: string;
  imagem: string | null;
  preco: number | null;
  preco_anterior: number | null;
  loja: string;
  /** Preservado internamente — cards não navegam para a loja. */
  link?: string;
  atualizado_em?: string;
  /** Só exibido se vier no JSON — nunca calculamos no front. */
  desconto?: number | null;
  categoria?: string | null;
  marca?: string | null;
};

export type OffersMode = 'preview' | 'catalog';

type OfferSortId = 'recent' | 'price' | 'discount';

type OfferWithMeta = FeedOffer & { storeKey: string };

type FeedConfig = {
  mode: OffersMode;
  previewLimit: number;
  catalogPageSize: number;
  catalogMax: number;
};

const FETCH_TIMEOUT_MS = 8000;
const PLACEHOLDER_IMAGE = '/images/malica-mascote.png';
const DEFAULT_PREVIEW_LIMIT = 8;
const DEFAULT_CATALOG_PAGE = 12;
const DEFAULT_CATALOG_MAX = 100;
const SEARCH_DEBOUNCE_MS = 300;

let allOffers: OfferWithMeta[] = [];
let activeStore = 'todas';
let activeSort: OfferSortId = 'recent';
let searchQuery = '';
let searchTimer: number | null = null;
let visibleCount = DEFAULT_PREVIEW_LIMIT;
let config: FeedConfig = {
  mode: 'preview',
  previewLimit: DEFAULT_PREVIEW_LIMIT,
  catalogPageSize: DEFAULT_CATALOG_PAGE,
  catalogMax: DEFAULT_CATALOG_MAX,
};
let fetchPromise: Promise<void> | null = null;

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function storeKeyFrom(loja: string | undefined): string {
  const raw = loja?.trim();
  if (!raw) return 'outras';
  return normalizeText(raw).replace(/\s+/g, '-');
}

function isFeedOffer(value: unknown): value is FeedOffer {
  if (!value || typeof value !== 'object') return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.titulo === 'string' &&
    o.titulo.trim().length > 0 &&
    typeof o.link === 'string' &&
    o.link.trim().length > 0
  );
}

function truncateTitle(title: string, max = 72): string {
  const t = title.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function setVisible(el: HTMLElement | null, visible: boolean): void {
  if (!el) return;
  if (visible) el.removeAttribute('hidden');
  else el.setAttribute('hidden', '');
}

function readConfig(root: HTMLElement): FeedConfig {
  const mode = root.dataset.offersMode === 'catalog' ? 'catalog' : 'preview';
  return {
    mode,
    previewLimit: Number(root.dataset.offersPreviewLimit) || DEFAULT_PREVIEW_LIMIT,
    catalogPageSize: Number(root.dataset.offersPageSize) || DEFAULT_CATALOG_PAGE,
    catalogMax: Number(root.dataset.offersMax) || DEFAULT_CATALOG_MAX,
  };
}

function getDiscountValue(offer: FeedOffer): number | null {
  if (offer.desconto != null && Number.isFinite(offer.desconto) && offer.desconto > 0) {
    return offer.desconto;
  }
  return null;
}

function getPriceValue(offer: FeedOffer): number | null {
  if (offer.preco != null && Number.isFinite(offer.preco)) return offer.preco;
  return null;
}

function getUpdatedAt(offer: FeedOffer): number | null {
  const t = Date.parse(offer.atualizado_em ?? '');
  return Number.isFinite(t) ? t : null;
}

function compareOffers(a: OfferWithMeta, b: OfferWithMeta): number {
  if (activeSort === 'price') {
    const pa = getPriceValue(a);
    const pb = getPriceValue(b);
    if (pa == null && pb == null) return 0;
    if (pa == null) return 1;
    if (pb == null) return -1;
    return pa - pb;
  }

  if (activeSort === 'discount') {
    const da = getDiscountValue(a);
    const db = getDiscountValue(b);
    if (da == null && db == null) return 0;
    if (da == null) return 1;
    if (db == null) return -1;
    return db - da;
  }

  const ta = getUpdatedAt(a);
  const tb = getUpdatedAt(b);
  if (ta == null && tb == null) return 0;
  if (ta == null) return 1;
  if (tb == null) return -1;
  return tb - ta;
}

function getFilteredOffers(): OfferWithMeta[] {
  const query = normalizeText(searchQuery.trim());

  const filtered = allOffers.filter((o) => {
    const matchStore = activeStore === 'todas' || o.storeKey === activeStore;
    if (!matchStore) return false;
    if (!query) return true;

    const haystack = normalizeText(
      [o.titulo, o.marca, o.categoria, o.loja]
        .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
        .join(' '),
    );
    return haystack.includes(query);
  });

  return filtered.slice().sort(compareOffers);
}

function applyOffer(card: HTMLElement, offer: FeedOffer, index: number): void {
  card.classList.remove('offers__card--skeleton');
  card.removeAttribute('aria-hidden');

  const affiliate = offer.link?.trim() ?? '';
  if (card instanceof HTMLAnchorElement) {
    card.href = affiliate || '#';
    card.target = '_blank';
    card.rel = 'noopener noreferrer sponsored';
    card.setAttribute('data-track', 'offer-card');
    card.setAttribute(
      'aria-label',
      `Ver oferta: ${truncateTitle(offer.titulo, 60)}`,
    );
  }

  if (affiliate) {
    card.dataset.offerLink = affiliate;
  } else {
    delete card.dataset.offerLink;
  }

  const skeletonMedia = card.querySelector<HTMLElement>('.offers__skeleton-media');
  if (skeletonMedia) setVisible(skeletonMedia, false);

  const img = card.querySelector<HTMLImageElement>('[data-offer-image]');
  const name = card.querySelector<HTMLElement>('[data-offer-name]');
  const from = card.querySelector<HTMLElement>('[data-offer-from]');
  const to = card.querySelector<HTMLElement>('[data-offer-to]');
  const discount = card.querySelector<HTMLElement>('[data-offer-discount]');
  const store = card.querySelector<HTMLElement>('[data-offer-store]');
  const time = card.querySelector<HTMLElement>('[data-offer-time]');
  const seal = card.querySelector<HTMLElement>('[data-offer-seal]');

  if (img) {
    const src = offer.imagem?.trim() || PLACEHOLDER_IMAGE;
    img.src = src;
    img.alt = offer.titulo;
    img.loading = index < 4 ? 'eager' : 'lazy';
    if (index < 2) img.fetchPriority = 'high';
    img.onerror = () => {
      img.onerror = null;
      img.src = PLACEHOLDER_IMAGE;
    };
    img.removeAttribute('hidden');
  }

  if (name) {
    name.textContent = truncateTitle(offer.titulo);
    setVisible(name, true);
  }

  const hasPrev =
    offer.preco_anterior != null && Number.isFinite(offer.preco_anterior);
  const hasPrice = offer.preco != null && Number.isFinite(offer.preco);

  if (from) {
    if (hasPrev) {
      from.textContent = `De ${formatBRL(offer.preco_anterior!)}`;
      setVisible(from, true);
    } else {
      from.textContent = '';
      setVisible(from, false);
    }
  }

  if (to) {
    if (hasPrice) {
      to.textContent = formatBRL(offer.preco!);
      setVisible(to, true);
    } else {
      to.textContent = '';
      setVisible(to, false);
    }
  }

  if (discount) {
    const d = offer.desconto;
    if (d != null && Number.isFinite(d) && d > 0) {
      discount.textContent = `🔥 ${Math.round(d)}% OFF`;
      setVisible(discount, true);
    } else {
      discount.textContent = '';
      setVisible(discount, false);
    }
  }

  if (store) {
    const loja = offer.loja?.trim();
    if (loja) {
      store.textContent = loja;
      setVisible(store, true);
    } else {
      store.textContent = '';
      setVisible(store, false);
    }
  }

  if (time) {
    const relative = formatRelativeTime(offer.atualizado_em);
    const label = time.querySelector<HTMLElement>('[data-offer-time-label]');
    if (relative) {
      if (label) label.textContent = `Encontrado ${relative}`;
      else time.textContent = `Encontrado ${relative}`;
      time.setAttribute('datetime', offer.atualizado_em!);
      setVisible(time, true);
    } else {
      if (label) label.textContent = '';
      else time.textContent = '';
      time.removeAttribute('datetime');
      setVisible(time, false);
    }
  }

  if (seal) setVisible(seal, true);
}

function cloneTemplate(template: HTMLTemplateElement): HTMLElement | null {
  const node = template.content.firstElementChild?.cloneNode(true);
  return node instanceof HTMLElement ? node : null;
}

function buildStoreFilters(root: HTMLElement): void {
  const wrap = root.querySelector<HTMLElement>('[data-offers-store-filters]');
  if (!wrap) return;

  const stores = new Map<string, string>();
  for (const offer of allOffers) {
    const label = offer.loja?.trim() || 'Outras';
    const key = offer.storeKey;
    if (!stores.has(key)) stores.set(key, label);
  }

  wrap.innerHTML = '';

  const makeBtn = (key: string, label: string, active: boolean) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `offers__filter${active ? ' offers__filter--active' : ''}`;
    btn.dataset.offerStore = key;
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    btn.textContent = label;
    wrap.appendChild(btn);
  };

  makeBtn('todas', 'Todas as lojas', activeStore === 'todas');

  [...stores.entries()]
    .sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'))
    .forEach(([key, label]) => {
      makeBtn(key, label, activeStore === key);
    });

  setVisible(wrap, true);

  const controls = root.querySelector<HTMLElement>('[data-offers-controls]');
  if (controls) setVisible(controls, true);
}

function setActiveStoreButtons(root: HTMLElement, key: string): void {
  root.querySelectorAll<HTMLButtonElement>('[data-offer-store]').forEach((btn) => {
    const active = btn.dataset.offerStore === key;
    btn.classList.toggle('offers__filter--active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function setActiveSortButtons(root: HTMLElement, id: OfferSortId): void {
  root.querySelectorAll<HTMLButtonElement>('[data-offer-sort]').forEach((btn) => {
    const active = btn.dataset.offerSort === id;
    btn.classList.toggle('offers__filter--active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function buildGrid(root: HTMLElement): void {
  const grid = root.querySelector<HTMLElement>('[data-offers-grid]');
  const cardTpl = root.querySelector<HTMLTemplateElement>('#offer-card-template');
  const moreWrap = root.querySelector<HTMLElement>('[data-offers-more-wrap]');
  const loadMore = root.querySelector<HTMLButtonElement>('[data-offers-more]');
  const moreLink = root.querySelector<HTMLAnchorElement>('[data-offers-more-link]');
  const feedCta = root.querySelector<HTMLElement>('[data-offers-cta]');
  const emptyFilter = root.querySelector<HTMLElement>('[data-offers-filter-empty]');

  if (!grid || !cardTpl) return;

  const filtered = getFilteredOffers();
  const slice = filtered.slice(0, visibleCount);

  grid.innerHTML = '';

  slice.forEach((offer, index) => {
    const cardWrap = cloneTemplate(cardTpl);
    if (!cardWrap) return;

    const card = cardWrap.matches('[data-offer-card]')
      ? cardWrap
      : cardWrap.querySelector<HTMLElement>('[data-offer-card]');
    if (!card) return;

    applyOffer(card, offer, index);
    grid.appendChild(cardWrap);
  });

  const hasCards = slice.length > 0;
  setVisible(grid, hasCards);
  if (emptyFilter) {
    const hasSearch = searchQuery.trim().length > 0;
    const emptyTitle = emptyFilter.querySelector<HTMLElement>(
      '[data-offers-empty-title]',
    );
    const emptyText = emptyFilter.querySelector<HTMLElement>(
      '[data-offers-empty-text]',
    );

    if (emptyTitle) {
      emptyTitle.textContent = hasSearch
        ? 'Não encontramos achadinhos com essa busca.'
        : 'Nenhum achadinho nessa loja.';
    }
    if (emptyText) {
      if (hasSearch) {
        emptyText.textContent = 'Tente outro produto, marca ou categoria.';
        setVisible(emptyText, true);
      } else {
        emptyText.textContent = '';
        setVisible(emptyText, false);
      }
    }

    setVisible(emptyFilter, !hasCards && allOffers.length > 0);
  }

  if (config.mode === 'preview') {
    if (moreLink) {
      setVisible(
        moreLink.closest<HTMLElement>('[data-offers-more-wrap]') ?? moreLink,
        allOffers.length > 0,
      );
    }
    if (moreWrap && !moreLink) setVisible(moreWrap, false);
    if (loadMore) setVisible(loadMore, false);
  } else {
    const hasMore = filtered.length > visibleCount;
    if (moreWrap) setVisible(moreWrap, hasMore);
    if (loadMore) {
      setVisible(loadMore, hasMore);
      loadMore.disabled = !hasMore;
    }
    if (moreLink) setVisible(moreLink, false);
  }

  if (feedCta) setVisible(feedCta, hasCards && config.mode === 'preview');

  document.dispatchEvent(new CustomEvent('malica:offers-rendered'));
}

function resetVisibleCount(): void {
  visibleCount =
    config.mode === 'catalog' ? config.catalogPageSize : config.previewLimit;
}

function showEmptyState(root: HTMLElement, reason: 'empty' | 'error'): void {
  const grid = root.querySelector<HTMLElement>('[data-offers-grid]');
  const controls = root.querySelector<HTMLElement>('[data-offers-controls]');
  const search = root.querySelector<HTMLElement>('[data-offers-search]');
  const empty = root.querySelector<HTMLElement>('[data-offers-empty]');
  const moreWrap = root.querySelector<HTMLElement>('[data-offers-more-wrap]');
  const feedCta = root.querySelector<HTMLElement>('[data-offers-cta]');
  const emptyFilter = root.querySelector<HTMLElement>('[data-offers-filter-empty]');

  if (grid) {
    grid.innerHTML = '';
    setVisible(grid, false);
  }
  if (controls) setVisible(controls, false);
  if (search) setVisible(search, false);
  if (moreWrap) setVisible(moreWrap, false);
  if (feedCta) setVisible(feedCta, false);
  if (emptyFilter) setVisible(emptyFilter, false);
  if (empty) setVisible(empty, true);

  root.dataset.offersState = reason;
  document.dispatchEvent(new CustomEvent('malica:offers-rendered'));
}

function showLoaded(root: HTMLElement): void {
  const empty = root.querySelector<HTMLElement>('[data-offers-empty]');
  const grid = root.querySelector<HTMLElement>('[data-offers-grid]');
  const controls = root.querySelector<HTMLElement>('[data-offers-controls]');
  const search = root.querySelector<HTMLElement>('[data-offers-search]');

  if (empty) setVisible(empty, false);
  if (grid) setVisible(grid, true);
  if (controls && config.mode === 'catalog') setVisible(controls, true);
  if (search && config.mode === 'catalog') setVisible(search, true);

  root.dataset.offersState = 'loaded';
}

function bindUi(root: HTMLElement): void {
  if (root.dataset.offersBound === 'true') return;
  root.dataset.offersBound = 'true';

  root
    .querySelector<HTMLElement>('[data-offers-store-filters]')
    ?.addEventListener('click', (event) => {
      const target = event.target as HTMLElement | null;
      const btn = target?.closest<HTMLButtonElement>('[data-offer-store]');
      if (!btn) return;

      const key = btn.dataset.offerStore;
      if (!key || key === activeStore) return;

      activeStore = key;
      resetVisibleCount();
      setActiveStoreButtons(root, key);
      buildGrid(root);

      document.dispatchEvent(
        new CustomEvent('malica:offer-store-filter', { detail: { store: key } }),
      );
    });

  root
    .querySelector<HTMLElement>('[data-offers-sort]')
    ?.addEventListener('click', (event) => {
      const target = event.target as HTMLElement | null;
      const btn = target?.closest<HTMLButtonElement>('[data-offer-sort]');
      if (!btn) return;

      const id = btn.dataset.offerSort as OfferSortId | undefined;
      if (!id || id === activeSort) return;
      if (id !== 'recent' && id !== 'price' && id !== 'discount') return;

      activeSort = id;
      resetVisibleCount();
      setActiveSortButtons(root, id);
      buildGrid(root);
    });

  const searchInput = root.querySelector<HTMLInputElement>(
    '[data-offers-search-input]',
  );
  const searchClear = root.querySelector<HTMLButtonElement>(
    '[data-offers-search-clear]',
  );

  const syncSearchClear = () => {
    if (!searchClear || !searchInput) return;
    setVisible(searchClear, searchInput.value.trim().length > 0);
  };

  const applySearch = (value: string) => {
    searchQuery = value;
    resetVisibleCount();
    buildGrid(root);
  };

  searchInput?.addEventListener('input', () => {
    syncSearchClear();
    if (searchTimer != null) window.clearTimeout(searchTimer);
    const value = searchInput.value;
    searchTimer = window.setTimeout(() => {
      searchTimer = null;
      applySearch(value);
    }, SEARCH_DEBOUNCE_MS);
  });

  searchClear?.addEventListener('click', () => {
    if (!searchInput) return;
    if (searchTimer != null) {
      window.clearTimeout(searchTimer);
      searchTimer = null;
    }
    searchInput.value = '';
    syncSearchClear();
    applySearch('');
    searchInput.focus();
  });

  const loadMore = root.querySelector<HTMLButtonElement>('[data-offers-more]');
  loadMore?.addEventListener('click', () => {
    visibleCount = Math.min(
      visibleCount + config.catalogPageSize,
      config.catalogMax,
    );
    buildGrid(root);
    document.dispatchEvent(new CustomEvent('malica:offers-more'));
  });
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      credentials: 'omit',
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timer);
  }
}

async function loadOffersFeedInternal(url: string): Promise<void> {
  const root = document.querySelector<HTMLElement>('[data-offers-root]');
  if (!root) return;

  config = readConfig(root);
  bindUi(root);

  if (!url) {
    showEmptyState(root, 'error');
    return;
  }

  root.dataset.offersState = 'loading';

  try {
    const res = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
    if (!res.ok) {
      showEmptyState(root, 'error');
      return;
    }

    const data: unknown = await res.json();
    if (!Array.isArray(data)) {
      showEmptyState(root, 'error');
      return;
    }

    const max =
      config.mode === 'catalog' ? config.catalogMax : config.previewLimit;

    allOffers = data
      .filter(isFeedOffer)
      .sort((a, b) => {
        const ta = Date.parse(a.atualizado_em ?? '');
        const tb = Date.parse(b.atualizado_em ?? '');
        const aOk = Number.isFinite(ta);
        const bOk = Number.isFinite(tb);
        if (aOk && bOk) return tb - ta;
        if (aOk) return -1;
        if (bOk) return 1;
        return 0;
      })
      .slice(0, max)
      .map((offer) => ({
        ...offer,
        storeKey: storeKeyFrom(offer.loja),
      }));

    if (allOffers.length === 0) {
      showEmptyState(root, 'empty');
      return;
    }

    activeStore = 'todas';
    activeSort = 'recent';
    searchQuery = '';
    if (searchTimer != null) {
      window.clearTimeout(searchTimer);
      searchTimer = null;
    }
    const searchInput = root.querySelector<HTMLInputElement>(
      '[data-offers-search-input]',
    );
    const searchClear = root.querySelector<HTMLButtonElement>(
      '[data-offers-search-clear]',
    );
    if (searchInput) searchInput.value = '';
    if (searchClear) setVisible(searchClear, false);

    resetVisibleCount();
    visibleCount = Math.min(visibleCount, allOffers.length);

    if (config.mode === 'catalog') {
      buildStoreFilters(root);
      setActiveSortButtons(root, 'recent');
    }

    showLoaded(root);
    buildGrid(root);
  } catch {
    showEmptyState(root, 'error');
  }
}

/** Evita requisições duplicadas ao endpoint na mesma página. */
export function loadOffersFeed(url: string): Promise<void> {
  if (!fetchPromise) {
    fetchPromise = loadOffersFeedInternal(url);
  }
  return fetchPromise;
}
