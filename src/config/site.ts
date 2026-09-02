export interface Testimonial {
  name: string;
  text: string;
}

export const SITE = {
  name: 'Malica',
  url: import.meta.env.PUBLIC_SITE_URL ?? 'https://malica.com.br',
  whatsappGroupUrl: import.meta.env.PUBLIC_WHATSAPP_GROUP_URL ?? '#',
  metaPixelId: import.meta.env.PUBLIC_META_PIXEL_ID ?? '',
  contactEmail: import.meta.env.PUBLIC_CONTACT_EMAIL ?? 'contato@malica.com.br',
} as const;

export const SEO = {
  title: 'Malica | Ofertas para Bebês, Crianças e Mamães',
  description:
    'Entre gratuitamente no grupo da Malica e receba ofertas, cupons e achadinhos para bebês, crianças e mamães.',
  ogImage: '/og-image.png',
} as const;

/** Preencha com depoimentos reais para exibir a seção de prova social. */
export const TESTIMONIALS: Testimonial[] = [];

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
    title: 'Entre gratuitamente',
    description: 'Clique no botão e entre no nosso grupo do WhatsApp.',
  },
  {
    step: 2,
    title: 'Receba os achadinhos',
    description: 'Selecionamos promoções, descontos e cupons ao longo do dia.',
  },
  {
    step: 3,
    title: 'Economize',
    description:
      'Encontrou algo que estava procurando? Aproveite a oferta diretamente na loja.',
  },
] as const;

export const STORES = ['Amazon', 'Shopee', 'Mercado Livre'] as const;

export interface Offer {
  name: string;
  image: string;
  imageAlt: string;
  priceFrom: string;
  priceTo: string;
  badge?: string;
}

/** Exemplos reais de ofertas — troque imagens/preços conforme novas promoções. */
export const OFFERS = [
  {
    name: 'Cadeirão de Alimentação Snzeske',
    image: '/images/card-cadeira.png',
    imageAlt: 'Cadeirão de alimentação infantil Snzeske portátil',
    priceFrom: 'R$ 997,37',
    priceTo: 'R$ 379,00',
    badge: 'OFERTA 🔥',
  },
  {
    name: 'Carrinho de Bebê EasyGo',
    image: '/images/card-carrinho.png',
    imageAlt: 'Carrinho de bebê EasyGo',
    priceFrom: 'R$ 793,20',
    priceTo: 'R$ 356,94',
    badge: 'OFERTA 🔥',
  },
  {
    name: 'Huggies Toalha Umedecida – 192 un.',
    image: '/images/card-lencos.png',
    imageAlt: 'Toalhas umedecidas Huggies 192 unidades',
    priceFrom: 'R$ 62,90',
    priceTo: 'R$ 31,90',
    badge: 'OFERTA 🔥',
  },
  {
    name: 'Tapete de Atividades para Bebê',
    image: '/images/card-tapete.png',
    imageAlt: 'Tapete de atividades para bebê',
    priceFrom: 'R$ 100,46',
    priceTo: 'R$ 57,00',
    badge: 'OFERTA 🔥',
  },
] as const;

export const MID_CTA_BENEFITS = [
  '🔕 Somente administradores enviam mensagens',
  '🛍️ Ofertas da Amazon, Shopee, Mercado Livre e outras lojas',
  '💰 Promoções e cupons selecionados',
  '🆓 Entrada gratuita',
] as const;
