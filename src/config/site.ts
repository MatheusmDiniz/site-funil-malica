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
