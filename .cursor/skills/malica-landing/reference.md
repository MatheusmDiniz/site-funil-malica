# Malica Landing — Referência detalhada

Contexto consolidado da criação do projeto (agosto/2026). Complementa `SKILL.md`.

## Brief original (resumo)

### Propósito

Site/comunidade voltado a:

- Bebês, crianças, mamães, gestantes
- Produtos infantis, cupons, promoções, achadinhos da internet

Objetivo principal: tráfego Facebook/Instagram Ads → membros do **grupo gratuito** no WhatsApp.

### Tom da marca

Delicada + moderna + acolhedora + confiável. Transmitir: carinho, confiança, economia, organização, leveza, modernidade. Evitar festival de cores; whitespace e tons suaves.

### Referências (inspiração apenas — não copiar)

- https://fabipromos.com.br/
- https://grupovtrads.com.br/leticia-braga/
- https://tavaprecisando.com.br/

Absorver: simplicidade, hierarquia, CTAs, estrutura de conversão, apresentação do grupo, mobile.

Evitar (presentes nas refs): escassez falsa, % de vagas, countdown, redirect automático, depoimentos inventados, pop-ups de “alguém entrou”.

## Copy principal (hero)

- **H1:** As melhores ofertas para seu bebê, todos os dias
- **Sub:** Receba promoções, cupons e achadinhos de lojas confiáveis direto no nosso grupo gratuito.
- **Bullets:** 100% gratuito · Ofertas todos os dias · Cupons e promoções
- **CTA final H2:** Quer receber os próximos achadinhos?
- **CTA final botão:** Entrar no grupo do WhatsApp

## Seções de conteúdo

### Categorias

Bebê · Infantil · Mamãe e gestante · Brinquedos · Roupas e acessórios · Itens do dia a dia  
Ícones SVG (não depender de emoji no UI).

### Como funciona

1. Entre gratuitamente — clique e entre no WhatsApp  
2. Receba os achadinhos — seleção ao longo do dia  
3. Economize — aproveite na loja  

### SEO sugerido

- Title: `Malica | Ofertas para Bebês, Crianças e Mamães`
- Description: `Entre gratuitamente no grupo da Malica e receba ofertas, cupons e achadinhos para bebês, crianças e mamães.`
- OG, favicon, canonical, viewport, H1 único no hero

## Mapa de arquivos

```
src/
  config/site.ts              # SITE, SEO, TESTIMONIALS, CATEGORIES, HOW_IT_WORKS, STORES
  layouts/BaseLayout.astro    # HTML shell, fonts, SEO, script tracking
  pages/
    index.astro
    politica-de-privacidade.astro
    termos-de-uso.astro
  components/
    Header.astro
    Hero.astro
    WhatsAppCta.astro         # único ponto de link WhatsApp
    Categories.astro
    CategoryIcon.astro
    HowItWorks.astro
    Stores.astro
    FinalCta.astro
    Testimonials.astro        # guard: só se TESTIMONIALS.length > 0
    Footer.astro
  scripts/
    tracking.ts               # Meta Pixel condicional + WhatsAppGroupClick
    utm.ts                    # captura/persistência UTMs
  styles/
    tokens.css
    global.css
public/
  images/malica-logo.png
  images/malica-mascote.png
  og-image.png
  favicon.png
Malica-Identidade-Visual/     # kit oficial (fonte dos assets)
.env.example
```

## Política de privacidade — princípios

Deve contemplar, **somente se aplicável**:

- Navegação / cookies essenciais
- Meta Pixel **quando** `PUBLIC_META_PIXEL_ID` estiver setado (a página já condiciona o texto)
- Links externos e afiliados
- WhatsApp como destino externo
- Contato LGPD

Não afirmar coleta por ferramenta ausente.

## Design system rápido

- Radius: 12–16px (cards), ~24px (blocos CTA)
- Sombra: `0 2px 12px rgba(115, 77, 87, 0.06)` — muito discreta
- CTA: fundo verde-sálvia, texto branco, hover ligeiramente mais escuro
- Cards: fundo branco suave sobre creme, borda quase invisível
- Animações: só fade-in leve; desligar com `prefers-reduced-motion`

Evitar aparência de: dropshipping genérico, lançamento de curso, cassino, landing agressiva, “template de IA” (roxo, glow, pills demais).

## Performance / a11y

- HTML semântico; JS mínimo
- Imagens com width/height; lazy abaixo da dobra quando fizer sentido
- Contraste AA (marrom ameixa em creme; CTA verde com texto claro)
- Alt nas imagens; focus-visible; área de toque ≥ 44px
- Sem overflow horizontal em 320–430px

## Deploy Vercel

1. Conectar repo; preset Astro  
2. Build `npm run build`, output `dist`  
3. Env vars de produção  
4. Domínio → atualizar `PUBLIC_SITE_URL`

## Checklist antes de publicar / após mudanças grandes

- [ ] `PUBLIC_WHATSAPP_GROUP_URL` aponta para o grupo real
- [ ] Pixel só se ID configurado; política coerente
- [ ] Todos os CTAs usam `WhatsAppCta` / mesma URL
- [ ] Sem redirect automático, sem escassez falsa, sem depoimentos fake
- [ ] Mobile 375px: sem overflow, CTA legível
- [ ] `npm run build` passa

## Decisões tomadas na implementação

| Decisão | Escolha |
|---------|---------|
| Framework | Astro estático (performance Meta Ads) |
| CSS | Vanilla + tokens (sem Tailwind) |
| Hospedagem alvo | Vercel |
| Assets | Oficiais de `Malica-Identidade-Visual` (versões transparentes) |
| Paleta | HEX do guia oficial, não os placeholders do plano inicial |
| Testimonials | Estrutura pronta, array vazio |
| SeoHead separado | Removido; SEO vive no `BaseLayout` |
| Shell preferido no Windows | Git Bash (`C:\Program Files\Git\bin\bash.exe`) |

## Relacionado

- Instância WhatsApp “Malica” existe no projeto irmão `robo-publicador-ofertas` (Evolution) — **não** compartilha código com esta landing.
