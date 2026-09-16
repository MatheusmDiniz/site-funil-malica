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
  title: 'Malica | Achadinhos para Bebês, Crianças e Mamães',
  description:
    'Veja achadinhos reais e entre gratuitamente no grupo da Malica no WhatsApp para receber ofertas selecionadas para bebês, crianças e mamães.',
  ogImage: '/og-image.png',
} as const;

export interface Testimonial {
  name: string;
  text: string;
}

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
    title: 'A gente procura',
    description: 'Nosso sistema acompanha promoções em diferentes lojas.',
  },
  {
    step: 2,
    title: 'A gente encontra',
    description:
      'Quando aparece um achadinho interessante, ele entra na nossa seleção.',
  },
  {
    step: 3,
    title: 'Você recebe',
    description: 'As promoções são enviadas no grupo da Malica.',
  },
] as const;

export const STORES = ['Amazon', 'Shopee', 'Mercado Livre'] as const;

export const TRUST_POINTS = [
  'Grupo gratuito',
  'Promoções selecionadas',
  'Sem precisar ficar procurando',
] as const;

export const PLACEHOLDER_IMAGE = '/images/malica-mascote.png';
