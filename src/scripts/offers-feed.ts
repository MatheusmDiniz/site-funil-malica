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
const DEFAULT_PREVIEW_LIMIT = 3;
const DEFAULT_CATALOG_PAGE = 12;
const DEFAULT_CATALOG_MAX = 100;
/** Home: só 3 hits de prova (sem grid extra). */
const DEFAULT_PREVIEW_MAX = 3;
/** Candidatos recentes para soft-rank na home (exibe só catalogMax). */
const HOME_RANK_POOL = 48;
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
let offersReady = false;
const readyListeners: Array<() => void> = [];

/** Ofertas já carregadas (vazio até o feed resolver). */
export function getLoadedOffers(): FeedOffer[] {
  return allOffers.map(({ storeKey: _sk, ...offer }) => offer);
}

/** Chama o callback quando o feed terminar (sucesso ou falha). */
export function whenOffersReady(callback: () => void): void {
  if (offersReady) {
    callback();
    return;
  }
  readyListeners.push(callback);
}

function notifyOffersReady(): void {
  offersReady = true;
  while (readyListeners.length) {
    const cb = readyListeners.shift();
    try {
      cb?.();
    } catch {
      /* ignore listener errors */
    }
  }
}

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

/** Ambos os preços obrigatórios para qualquer listagem. */
function hasValidPrices(offer: FeedOffer): boolean {
  return (
    offer.preco != null &&
    Number.isFinite(offer.preco) &&
    offer.preco_anterior != null &&
    Number.isFinite(offer.preco_anterior)
  );
}

function truncateTitle(title: string, max = 72): string {
  const t = title.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Sanitiza títulos gritados de marketplace sem destruir marcas/siglas/tamanhos.
 * Usar só na home e mockups — não no catálogo.
 */
export function presentOfferTitle(raw: string, max = 52): string {
  let t = raw.trim();
  if (!t) return t;

  // Remove gritos de urgência, preservando o restante
  t = t
    .replace(/\bCORR+E+\b/gi, '')
    .replace(/\bURGENTE\b/gi, '')
    .replace(/\bIMPERD[IÍ]VEL\b/gi, '')
    .replace(/!{2,}/g, '!')
    .replace(/\s{2,}/g, ' ')
    .trim();

  const letters = t.replace(/[^A-Za-zÀ-ÿ]/g, '');
  const upper = letters.replace(/[^A-ZÀ-Ÿ]/g, '').length;
  const mostlyShouting =
    letters.length >= 8 && upper / letters.length >= 0.72;

  if (mostlyShouting) {
    // Title-case cuidadoso: tokens curtos / com dígitos / & ficam como estão
    t = t
      .split(/(\s+)/)
      .map((token) => {
        if (/^\s+$/.test(token)) return token;
        if (token.length <= 3 && /^[A-Z0-9ÁÉÍÓÚÂÊÔÃÕÇ&x×./+-]+$/i.test(token)) {
          return token.toUpperCase() === token ? token : token;
        }
        if (/\d/.test(token) || /[&/×x]/i.test(token)) return token;
        const lower = token.toLocaleLowerCase('pt-BR');
        return lower.charAt(0).toLocaleUpperCase('pt-BR') + lower.slice(1);
      })
      .join('');
  }

  return truncateTitle(t.replace(/\s{2,}/g, ' ').trim(), max);
}

const BABY_CATEGORY_HINTS = [
  'bebe',
  'bebê',
  'fralda',
  'mamadeira',
  'lenco',
  'lenço',
  'leite',
  'formula',
  'fórmula',
  'higiene',
  'shampoo',
  'sabonete',
  'pomada',
  'chupeta',
  'carrinho',
  'berco',
  'berço',
  'crianca',
  'criança',
  'kids',
  'baby',
  'gestante',
  'mamae',
  'mamãe',
  'gestacao',
  'gestação',
  'body',
  'macacao',
  'macacão',
  'roupa',
  'enxoval',
  'mijao',
  'mijão',
  'calcinha',
  'cueca',
];

const DEMOTE_HINTS = [
  'estria',
  'celulite',
  'emagrec',
  'adulto',
  'vinho',
  'cerveja',
  'pop it',
  'popit',
  'girafa',
  'melman',
  'brinquedo',
  'toy',
  'lancador',
  'lançador',
  'aviao',
  'avião',
  'bolha',
  // Hero/home: evitar “hit caro” fora da rotina do H1
  'barbie',
  'boneca',
  'patinete',
  'travel system',
  'travel',
  'carrinho de bebe 3 em 1',
];

/** Pontuação mais alta para cotidiano bebê/mãe; brinquedos caem no extra. */
function babyAffinityScore(offer: FeedOffer): number {
  const cat = normalizeText(offer.categoria ?? '');
  const title = normalizeText(offer.titulo);
  let score = 0;

  const dailyBoost = [
    'fralda',
    'leite',
    'formula',
    'lenco',
    'higiene',
    'mamadeira',
    'pomada',
    'shampoo',
    'sabonete',
    'body',
    'macacao',
    'enxoval',
    'huggies',
    'pampers',
  ];

  for (const hint of BABY_CATEGORY_HINTS) {
    const n = normalizeText(hint);
    if (cat.includes(n)) score += 5;
    else if (title.includes(n)) score += 2;
  }

  // "infantil" sozinho é fraco (aparece em brinquedo); só ajuda se já há sinal baby
  if (title.includes('infantil') || cat.includes('infantil')) {
    score += score > 0 ? 2 : 0;
  }

  for (const hint of dailyBoost) {
    const n = normalizeText(hint);
    if (cat.includes(n) || title.includes(n)) score += 4;
  }

  for (const hint of DEMOTE_HINTS) {
    const n = normalizeText(hint);
    if (cat.includes(n)) score -= 8;
    else if (title.includes(n)) score -= 7;
  }
  return score;
}

/** Economia absoluta em R$ (0 se inválida). */
function absoluteSavings(offer: FeedOffer): number {
  const price = offer.preco;
  const prev = offer.preco_anterior;
  if (
    price != null &&
    prev != null &&
    Number.isFinite(price) &&
    Number.isFinite(prev) &&
    prev > price
  ) {
    return prev - price;
  }
  return 0;
}

/**
 * Home ranking: relevância bebê/mãe primeiro; desempate por economia (R$)
 * e % OFF — prioriza “hits” sem inventar urgência.
 */
function softRankForHome(offers: OfferWithMeta[]): OfferWithMeta[] {
  return offers
    .map((o, i) => ({
      o,
      i,
      score: babyAffinityScore(o),
      savings: absoluteSavings(o),
      pct: getDiscountValue(o) ?? 0,
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.savings !== a.savings) return b.savings - a.savings;
      if (b.pct !== a.pct) return b.pct - a.pct;
      return a.i - b.i;
    })
    .map((x) => x.o);
}

/**
 * 2 achados para o mockup do hero.
 * Prioridade: rotina bebê/mãe (alinha ao H1) → desconto forte entre esses.
 * Só cai para “maior R$ off” genérico se não houver ofertas de rotina.
 */
export function getHeroMockupOffers(limit = 2): FeedOffer[] {
  const pool = getLoadedOffers();
  if (pool.length === 0) return [];

  const ranked = pool
    .map((o, i) => {
      const savings = absoluteSavings(o);
      const pct = getDiscountValue(o) ?? 0;
      const score = babyAffinityScore(o);
      return {
        o,
        i,
        savings,
        pct,
        score,
        routine: score > 0 ? 1 : 0,
        strong: savings >= 15 || pct >= 20 ? 1 : 0,
      };
    })
    .sort((a, b) => {
      if (b.routine !== a.routine) return b.routine - a.routine;
      if (b.score !== a.score) return b.score - a.score;
      if (b.strong !== a.strong) return b.strong - a.strong;
      if (b.savings !== a.savings) return b.savings - a.savings;
      if (b.pct !== a.pct) return b.pct - a.pct;
      return a.i - b.i;
    });

  const routineHits = ranked.filter((x) => x.score > 0);
  const pickFrom = routineHits.length >= limit ? routineHits : ranked;
  return pickFrom.slice(0, limit).map((x) => x.o);
}

function setVisible(el: HTMLElement | null, visible: boolean): void {
  if (!el) return;
  if (visible) {
    el.removeAttribute('hidden');
    el.removeAttribute('aria-hidden');
  } else {
    el.setAttribute('hidden', '');
    el.setAttribute('aria-hidden', 'true');
  }
}

function readConfig(root: HTMLElement): FeedConfig {
  const mode = root.dataset.offersMode === 'catalog' ? 'catalog' : 'preview';
  const defaultMax = mode === 'catalog' ? DEFAULT_CATALOG_MAX : DEFAULT_PREVIEW_MAX;
  return {
    mode,
    previewLimit: Number(root.dataset.offersPreviewLimit) || DEFAULT_PREVIEW_LIMIT,
    catalogPageSize: Number(root.dataset.offersPageSize) || DEFAULT_CATALOG_PAGE,
    catalogMax: Number(root.dataset.offersMax) || defaultMax,
  };
}

function getDiscountValue(offer: FeedOffer): number | null {
  if (offer.desconto != null && Number.isFinite(offer.desconto) && offer.desconto > 0) {
    return offer.desconto;
  }

  const price = offer.preco;
  const prev = offer.preco_anterior;
  if (
    price != null &&
    prev != null &&
    Number.isFinite(price) &&
    Number.isFinite(prev) &&
    prev > price &&
    prev > 0
  ) {
    return ((prev - price) / prev) * 100;
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
    if (da == null && db == null) {
      // Empate sem desconto: mantém mais recente como desempate
      const ta = getUpdatedAt(a);
      const tb = getUpdatedAt(b);
      if (ta == null && tb == null) return 0;
      if (ta == null) return 1;
      if (tb == null) return -1;
      return tb - ta;
    }
    if (da == null) return 1;
    if (db == null) return -1;
    if (db !== da) return db - da;
    const ta = getUpdatedAt(a);
    const tb = getUpdatedAt(b);
    if (ta == null && tb == null) return 0;
    if (ta == null) return 1;
    if (tb == null) return -1;
    return tb - ta;
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

function applyOffer(
  card: HTMLElement,
  offer: FeedOffer,
  index: number,
  opts: { proof?: boolean; extra?: boolean; actionLabel?: string } = {},
): void {
  card.classList.remove('offers__card--skeleton');
  card.removeAttribute('aria-hidden');

  const proof = opts.proof === true;
  const extra = opts.extra === true;
  const homeDisplay = proof || extra;

  card.classList.toggle('offers__card--proof', proof);
  card.classList.toggle('offers__card--extra', extra);

  const displayTitle = homeDisplay
    ? presentOfferTitle(offer.titulo, proof ? 52 : 40)
    : truncateTitle(offer.titulo);

  const affiliate = offer.link?.trim() ?? '';
  if (card instanceof HTMLAnchorElement) {
    card.href = affiliate || '#';
    card.target = '_blank';
    card.rel = 'noopener noreferrer sponsored';
    card.setAttribute('data-track', 'offer-card');
    card.setAttribute('aria-label', `Ver oferta: ${displayTitle}`);
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
  const badge = card.querySelector<HTMLElement>('[data-offer-badge]');
  const savings = card.querySelector<HTMLElement>('[data-offer-savings]');
  const action = card.querySelector<HTMLElement>('[data-offer-action]');

  if (img) {
    const src = offer.imagem?.trim() || PLACEHOLDER_IMAGE;
    img.src = src;
    img.alt = displayTitle;
    img.loading = index < 4 ? 'eager' : 'lazy';
    if (index < 2) img.fetchPriority = 'high';
    img.onerror = () => {
      img.onerror = null;
      img.src = PLACEHOLDER_IMAGE;
    };
    img.removeAttribute('hidden');
  }

  if (name) {
    name.textContent = displayTitle;
    setVisible(name, true);
  }

  const prev = offer.preco_anterior!;
  const price = offer.preco!;

  if (from) {
    if (homeDisplay) {
      from.textContent = `De ${formatBRL(prev)}`;
    } else {
      from.textContent = `De ${formatBRL(prev)}`;
    }
    setVisible(from, true);
  }

  if (to) {
    if (homeDisplay) {
      to.textContent = `por ${formatBRL(price)}`;
    } else {
      to.textContent = formatBRL(price);
    }
    setVisible(to, true);
  }

  if (savings) {
    if (proof && prev > price) {
      const saved = prev - price;
      savings.textContent = `Você economiza ${formatBRL(saved)}`;
      setVisible(savings, true);
    } else {
      savings.textContent = '';
      setVisible(savings, false);
    }
  }

  if (discount) {
    const pct = getDiscountValue(offer);
    if (proof && pct != null && pct >= 30) {
      discount.textContent = `${Math.round(pct)}% OFF`;
      setVisible(discount, true);
    } else if (!homeDisplay && pct != null && pct > 0) {
      discount.textContent = `${Math.round(pct)}% OFF`;
      setVisible(discount, true);
    } else {
      discount.textContent = '';
      setVisible(discount, false);
    }
  }

  if (badge) setVisible(badge, proof);

  if (action) {
    const label = opts.actionLabel || 'Ver oferta';
    action.textContent = proof ? `${label} →` : label;
    setVisible(action, homeDisplay);
  }

  if (store) {
    if (homeDisplay) {
      store.textContent = '';
      setVisible(store, false);
    } else {
      const loja = offer.loja?.trim();
      if (loja) {
        store.textContent = loja;
        setVisible(store, true);
      } else {
        store.textContent = '';
        setVisible(store, false);
      }
    }
  }

  if (time) {
    const relative = formatRelativeTime(offer.atualizado_em);
    const labelEl = time.querySelector<HTMLElement>('[data-offer-time-label]');
    if (relative && offer.atualizado_em) {
      // Home: tempo discreto derivado do JSON; catálogo: “Encontrado …”
      const text = proof ? relative : `Encontrado ${relative}`;
      if (labelEl) labelEl.textContent = text;
      else time.textContent = text;
      time.setAttribute('datetime', offer.atualizado_em);
      setVisible(time, true);
    } else {
      if (labelEl) labelEl.textContent = '';
      else time.textContent = '';
      time.removeAttribute('datetime');
      setVisible(time, false);
    }
  }

  if (seal) setVisible(seal, !homeDisplay);
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

function fillGrid(
  grid: HTMLElement,
  cardTpl: HTMLTemplateElement,
  offers: OfferWithMeta[],
  startIndex: number,
  opts: { proof?: boolean; extra?: boolean; actionLabel: string },
): void {
  grid.innerHTML = '';
  offers.forEach((offer, i) => {
    const cardWrap = cloneTemplate(cardTpl);
    if (!cardWrap) return;

    const card = cardWrap.matches('[data-offer-card]')
      ? cardWrap
      : cardWrap.querySelector<HTMLElement>('[data-offer-card]');
    if (!card) return;

    applyOffer(card, offer, startIndex + i, {
      proof: opts.proof,
      extra: opts.extra,
      actionLabel: opts.actionLabel,
    });
    grid.appendChild(cardWrap);
  });
}

function buildGrid(root: HTMLElement): void {
  const grid = root.querySelector<HTMLElement>('[data-offers-grid]');
  const gridExtra = root.querySelector<HTMLElement>('[data-offers-grid-extra]');
  const extraWrap = root.querySelector<HTMLElement>('[data-offers-extra]');
  const cardTpl = root.querySelector<HTMLTemplateElement>('#offer-card-template');
  const moreWrap = root.querySelector<HTMLElement>('[data-offers-more-wrap]');
  const loadMore = root.querySelector<HTMLButtonElement>('[data-offers-more]');
  const moreLink = root.querySelector<HTMLAnchorElement>('[data-offers-more-link]');
  const feedCta = root.querySelector<HTMLElement>('[data-offers-cta]');
  const emptyFilter = root.querySelector<HTMLElement>('[data-offers-filter-empty]');
  const actionLabel = root.dataset.offerActionLabel?.trim() || 'Ver oferta';
  // Preview home: prova ranqueada (até previewLimit). Catálogo usa o fluxo abaixo.
  const isProofHome = config.mode === 'preview';

  if (!grid || !cardTpl) return;

  const filtered = getFilteredOffers();

  if (isProofHome) {
    const ranked = softRankForHome(filtered);
    const proofOffers = ranked.slice(0, Math.min(config.previewLimit, config.catalogMax));

    fillGrid(grid, cardTpl, proofOffers, 0, {
      proof: true,
      actionLabel,
    });

    // Sem segundo grid “Mais alguns achadinhos” na home.
    if (gridExtra) {
      gridExtra.innerHTML = '';
      setVisible(gridExtra, false);
    }
    if (extraWrap) setVisible(extraWrap, false);

    const hasCards = proofOffers.length > 0;
    setVisible(grid, hasCards);

    if (moreLink) {
      setVisible(
        moreLink.closest<HTMLElement>('[data-offers-more-wrap]') ?? moreLink,
        allOffers.length > 0,
      );
    }
    if (loadMore) setVisible(loadMore, false);
    if (feedCta) setVisible(feedCta, hasCards);

    // Home com prova: nunca exibir empty/filter-empty fantasmas
    if (emptyFilter) setVisible(emptyFilter, false);
    const emptyHome = root.querySelector<HTMLElement>('[data-offers-empty]');
    if (emptyHome) setVisible(emptyHome, !hasCards);

    document.dispatchEvent(new CustomEvent('malica:offers-rendered'));
    return;
  }

  const slice = filtered.slice(0, visibleCount);

  fillGrid(grid, cardTpl, slice, 0, { actionLabel });

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
  if (extraWrap) setVisible(extraWrap, false);

  document.dispatchEvent(new CustomEvent('malica:offers-rendered'));
}

function resetVisibleCount(): void {
  visibleCount =
    config.mode === 'catalog' ? config.catalogPageSize : config.previewLimit;
}

function showEmptyState(root: HTMLElement, reason: 'empty' | 'error'): void {
  const grid = root.querySelector<HTMLElement>('[data-offers-grid]');
  const gridExtra = root.querySelector<HTMLElement>('[data-offers-grid-extra]');
  const extraWrap = root.querySelector<HTMLElement>('[data-offers-extra]');
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
  if (gridExtra) {
    gridExtra.innerHTML = '';
    setVisible(gridExtra, false);
  }
  if (extraWrap) setVisible(extraWrap, false);
  if (controls) setVisible(controls, false);
  if (search) setVisible(search, false);
  if (moreWrap) setVisible(moreWrap, false);
  if (feedCta) setVisible(feedCta, false);
  if (emptyFilter) setVisible(emptyFilter, false);
  if (empty) setVisible(empty, true);

  root.dataset.offersState = reason;
  document.dispatchEvent(new CustomEvent('malica:offers-rendered'));
  notifyOffersReady();
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
  if (!root) {
    notifyOffersReady();
    return;
  }

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

    // Preview home: carrega pool maior para soft-rank (relevância + economia),
    // depois a UI mostra só até catalogMax (= 3 na home).
    const poolSize =
      config.mode === 'preview'
        ? Math.max(config.catalogMax, HOME_RANK_POOL)
        : config.catalogMax;

    allOffers = data
      .filter(isFeedOffer)
      .filter(hasValidPrices)
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
      .slice(0, poolSize)
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
    notifyOffersReady();
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
