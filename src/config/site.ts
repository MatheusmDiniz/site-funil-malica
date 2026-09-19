export const SITE = {
  name: 'Malica',
  url: import.meta.env.PUBLIC_SITE_URL ?? 'https://malica.com.br',
  whatsappGroupUrl: import.meta.env.PUBLIC_WHATSAPP_GROUP_URL ?? '#',
  metaPixelId: import.meta.env.PUBLIC_META_PIXEL_ID ?? '',
  contactEmail: import.meta.env.PUBLIC_CONTACT_EMAIL ?? 'contato@malica.com.br',
  offersJsonUrl:
    import.meta.env.PUBLIC_OFFERS_JSON_URL ??
    'https://raw.githubusercontent.com/MatheusmDiniz/anuncios-ofertas/main/malica/ofertas-publicas.json',
} as const;

export const SEO = {
  title: 'Malica | Ofertas para Bebês sem Você Precisar Procurar',
  description:
    'A Malica garimpa promoções de fraldas, higiene e produtos infantis. Entre grátis no grupo do WhatsApp e receba os achadinhos selecionados.',
  ogImage: '/og-image.png',
} as const;

/**
 * Copy da landing — altere aqui para testes A/B sem caçar strings nos componentes.
 *
 * A/B opcional (não usar no default): ctaHeroVip = 'Entrar grátis no grupo VIP'
 */
export const LANDING_COPY = {
  heroHeadline: 'Pague menos no que seu bebê usa todos os dias.',
  heroSignature: 'Você cuida do seu bebê. A Malica cuida dos preços.',
  trustMicrocopy: 'Receba no WhatsApp · Gratuito · Saia quando quiser',
  ctaHero: 'Entrar grátis no grupo',
  ctaAfterOffers: 'Quero receber as próximas',
  ctaSticky: 'Entrar grátis no grupo',
  ctaFinal: 'Entrar grátis no grupo',
  storesTitle: 'Achadinhos em lojas que você já conhece',
  afterOffersTitle: 'Essas são só algumas — as próximas chegam no WhatsApp.',
  afterOffersText:
    'Fralda, higiene, roupinha: quando vale a pena, a Malica avisa no grupo.',
  afterOffersFine: '100% gratuito · Você pode sair quando quiser',
  offersProofTitle: 'Olha o que a Malica encontrou',
  offersProofSubtitle:
    'Achadinhos reais para a rotina do bebê — preços podem mudar',
  offersSeeAll: 'Ver todos os achadinhos',
  offersDisclaimer:
    '*Preços encontrados no momento da publicação e sujeitos a alteração.',
  offerSecondaryCta: 'Ver oferta',
  howTitle: 'Como funciona',
  howSubtitle: 'A gente procura. Encontra. Você recebe no WhatsApp.',
  trustTitle: 'Por que o grupo funciona',
  testimonialsTitle: 'Mães e pais que já recebem os achadinhos',
  finalTitle: 'Deixa a Malica procurar por você.',
  finalSubtitle:
    'Você cuida do seu bebê. A gente fica de olho nas promoções do dia a dia.',
  finalFine: 'É grátis e leva poucos segundos.',
} as const;

export interface Testimonial {
  name: string;
  text: string;
  /** Ex.: "Mãe do Miguel, 1 ano" */
  role?: string;
  /** Ex.: "Fraldas" | "Higiene" */
  context?: string;
}

/**
 * Depoimentos reais liberados pelo stakeholder.
 * Se vazio, a seção não renderiza.
 */
export const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Camila, mãe do Theo',
    role: 'Mãe de bebê pequeno',
    text: 'Entrei mais pelas promoções de fralda, mas já aproveitei várias outras coisas também. Gosto porque não preciso ficar procurando em vários lugares.',
  },
  {
    name: 'Juliana, grávida de primeira viagem',
    role: 'Gestante',
    text: 'Pra quem tá montando enxoval ajuda demais. Às vezes aparece coisa que eu nem lembrava que precisava e já consigo comparar o preço.',
  },
  {
    name: 'Larissa, mãe da Manu e do Davi',
    role: 'Mãe de dois filhos',
    text: 'O que eu mais gosto é que o grupo é direto ao ponto. Aparece a promoção, eu vejo se vale pra mim e pronto. Já deixei salvo nos favoritos do WhatsApp.',
  },
];

/**
 * Stats reais liberados pelo stakeholder.
 * Se vazio, a faixa não renderiza — não inventar números.
 */
/** Stats reais liberados pelo stakeholder. */
export const SOCIAL_PROOF_STATS: { label: string; value: string }[] = [
  { value: '+180', label: 'pessoas no grupo' },
  { value: '+15 mil', label: 'reais economizados' },
  { value: '+150', label: 'achadinhos por dia' },
];

export const CATEGORIES = [
  {
    title: 'Bebê',
    description: 'Fraldas, leite, higiene e essenciais do dia a dia.',
    icon: 'baby-bottle',
  },
  {
    title: 'Infantil',
    description: 'Produtos para crianças em fase de crescimento.',
    icon: 'child',
  },
  {
    title: 'Mamãe e gestante',
    description: 'Cuidados, conforto e itens para a rotina materna.',
    icon: 'pregnant',
  },
  {
    title: 'Brinquedos',
    description: 'Diversão com preços que cabem no bolso.',
    icon: 'toy',
  },
  {
    title: 'Roupas e acessórios',
    description: 'Looks e complementos para toda a família.',
    icon: 'clothes',
  },
  {
    title: 'Itens do dia a dia',
    description: 'Utilidades para casa e organização da rotina.',
    icon: 'home',
  },
] as const;

export const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'A gente procura',
    description: 'Monitoramos promoções em várias lojas ao longo do dia.',
  },
  {
    step: 2,
    title: 'A gente encontra',
    description: 'Só entra na seleção o que vale a pena para bebê e criança.',
  },
  {
    step: 3,
    title: 'Você recebe',
    description: 'A oferta chega no grupo gratuito do WhatsApp.',
  },
] as const;

export const STORES = [
  {
    name: 'Amazon',
    logo: '/images/stores/amazon.svg',
  },
  {
    name: 'Shopee',
    logo: '/images/stores/shopee.svg',
  },
  {
    name: 'Mercado Livre',
    logo: '/images/stores/mercado-livre.svg',
  },
] as const;

/** Três pontos que complementam Stores (sem repetir “lojas conhecidas”). */
export const TRUST_POINTS = [
  {
    title: '100% gratuito',
    description: 'Sem mensalidade e sem compromisso. Saia quando quiser.',
    icon: 'gift',
  },
  {
    title: 'Só infantil e materno',
    description: 'Promoções pensadas para a rotina de bebê, criança e mamãe.',
    icon: 'baby-bottle',
  },
  {
    title: 'Sem spam no grupo',
    description: 'O foco é oferta. Sem conversa aleatória enchendo o chat.',
    icon: 'quiet',
  },
] as const;

export const PLACEHOLDER_IMAGE = '/images/malica-mascote.png';
