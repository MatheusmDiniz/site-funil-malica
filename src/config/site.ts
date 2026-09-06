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
    name: 'Pampers Premium Care – 40 un.',
    image: '/images/card-pampers.png',
    imageAlt: 'Fraldas Pampers Premium Care tamanho P 40 unidades',
    priceFrom: 'R$ 74,90',
    priceTo: 'R$ 57,72',
    badge: 'OFERTA 🔥',
  },
  {
    name: 'Mustela Gel Lavante Suave 500ml',
    image: '/images/card-mustela.png',
    imageAlt: 'Mustela gel lavante suave corpo e cabelo 500ml',
    priceFrom: 'R$ 85,23',
    priceTo: 'R$ 71,09',
    badge: 'OFERTA 🔥',
  },
  {
    name: 'Natura Mamãe e Bebê Água de Colônia',
    image: '/images/card-perfume-natura.png',
    imageAlt: 'Água de colônia Natura Mamãe e Bebê 50ml',
    priceFrom: 'R$ 56,64',
    priceTo: 'R$ 33,90',
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
    name: 'Baby Dove Sabonete Líquido 400ml',
    image: '/images/card-dove.png',
    imageAlt: 'Sabonete líquido Baby Dove hidratação glicerina 400ml',
    priceFrom: 'R$ 38,61',
    priceTo: 'R$ 21,59',
    badge: 'OFERTA 🔥',
  },
  {
    name: 'Huggies Pants – 24 un. XG',
    image: '/images/card-huggies-pants.png',
    imageAlt: 'Fraldas Huggies Pants tamanho XG 24 unidades',
    priceFrom: 'R$ 56,57',
    priceTo: 'R$ 47,61',
    badge: 'OFERTA 🔥',
  },
] as const;

export const MID_CTA_BENEFITS = [
  '🔕 Somente administradores enviam mensagens',
  '🛍️ Ofertas da Amazon, Shopee, Mercado Livre e outras lojas',
  '💰 Promoções e cupons selecionados',
  '🆓 Entrada gratuita',
] as const;
