---
name: malica-landing
description: >-
  Contexto completo da landing page Malica (funil Meta Ads → WhatsApp):
  identidade visual, estrutura de conversão, regras anti-fraude de ads,
  stack Astro, tracking (Pixel/UTMs), páginas legais e assets oficiais.
  Use ao editar, estender, revisar ou publicar este site; ao alterar CTAs,
  SEO, design, política de privacidade, Meta Pixel ou conteúdo da marca.
---

# Malica Landing Page

## Objetivo do produto

Landing page da **Malica** — comunidade de ofertas para bebês, crianças, mamães e gestantes (cupons, promoções, achadinhos).

Funil único:

```
Meta Ads → Landing Malica → Clique consciente no CTA → Grupo WhatsApp
```

- **Não** redirecionar automaticamente para o WhatsApp.
- Prioridade: **mobile-first** (320–430px) + conversão + confiança.
- Público que navega: mãe/pai/gestante/responsável — design acolhedor, **não** infantilizado.

## Stack

| Item | Valor |
|------|--------|
| Framework | Astro (SSG estático) |
| Estilos | CSS vanilla + tokens em `src/styles/tokens.css` |
| Config | `src/config/site.ts` |
| Tracking | `src/scripts/tracking.ts` + `src/scripts/utm.ts` |
| Deploy | Vercel (recomendado) |
| Shell | Preferir **Git Bash** neste ambiente Windows |

Dev: `astro dev --background` (ver AGENTS.md). Build: `npm run build` → `dist/`.

## Env vars (prefixo PUBLIC_)

Definidas em `.env` / Vercel. Template: `.env.example`.

| Variável | Uso |
|----------|-----|
| `PUBLIC_SITE_URL` | Canonical / OG |
| `PUBLIC_WHATSAPP_GROUP_URL` | Todos os CTAs WhatsApp |
| `PUBLIC_META_PIXEL_ID` | Vazio = Pixel **não** carrega |
| `PUBLIC_CONTACT_EMAIL` | Rodapé e páginas legais |

Nunca hardcodar Pixel ID ou URL do grupo no código de componentes.

## Identidade visual (oficial)

Fonte: `Malica-Identidade-Visual/guia-identidade.md`.

| Token | HEX | Uso |
|-------|-----|-----|
| Rosa antigo | `#EBA8A8` | Detalhes, destaques, números |
| Verde-sálvia | `#8BAA9D` | Botões CTA |
| Marrom ameixa | `#734D57` | Textos, títulos |
| Creme | `#FFF8F5` | Fundo |
| Bege | `#F4D7C5` | Apoio / cards |

Fontes: **Fraunces** (títulos) + **DM Sans** (corpo).

Assets em `public/images/` (não inventar mascote/logo novo):

- `malica-logo.png` — logo horizontal transparente
- `malica-mascote.png` — ícone (capivara na sacola)
- `public/og-image.png`, `public/favicon.png`

Mascote: capivara simpática **dentro** de sacola de compras (achadinhos).

## Estrutura da página

Ordem em `src/pages/index.astro`:

1. Header (logo) → 2. Hero + CTA → 3. Categorias → 4. Como funciona → 5. Lojas → 6. CTA final → 7. Testimonials (só se houver dados) → 8. Footer

Rotas legais: `/politica-de-privacidade`, `/termos-de-uso`.

CTA único: `src/components/WhatsAppCta.astro` (`data-track="whatsapp-group"`). Texto sugerido: “Entrar no grupo gratuito”. Min-height ≥ 48px, ícone WhatsApp, focus visível.

## Regras obrigatórias (não negociar)

**Proibido:**

- Escassez falsa, countdown falso, pop-ups “X acabou de entrar”
- Depoimentos, números de membros ou avaliações inventados
- Redirect automático / cloaking / conteúdo diferente para bots
- Declarar na política ferramentas que **não** estão instaladas
- Navbar complexa, seções só para ocupar espaço

**Prova social:** array `TESTIMONIALS` em `site.ts`. Se vazio → componente **não renderiza**.

**Lojas:** citar Amazon/Shopee/Mercado Livre de forma discreta + disclaimer de que **não patrocinam** a Malica.

**Afiliados:** aviso no rodapé (comissão sem custo extra ao usuário + preços podem mudar).

## Tracking

- `PageView` se Pixel configurado
- `WhatsAppGroupClick` (`trackCustom`) em todo clique de CTA WhatsApp — **sem** atrasar a navegação
- UTMs (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`) → `sessionStorage` → anexados ao evento

## Ao alterar o site

1. Ler `src/config/site.ts` e tokens antes de mudar copy/cores.
2. Reutilizar `WhatsAppCta` — não criar segundo botão com URL solta.
3. Manter política alinhada ao que está realmente implementado.
4. Revisar overflow horizontal em ~375px e contraste texto/fundo.
5. Respeitar `prefers-reduced-motion`.

## Referência detalhada

Para brief completo, decisões de design, SEO e checklist de QA, ler [reference.md](reference.md).
