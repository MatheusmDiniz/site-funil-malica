# Malica — Landing Page

Landing page estática para conversão de tráfego Meta Ads em membros do grupo gratuito no WhatsApp.

## Stack

- [Astro 5](https://astro.build/) (SSG)
- CSS vanilla com tokens da identidade visual
- JavaScript mínimo (Meta Pixel + UTMs)

## Desenvolvimento

```bash
npm install
npm run dev
```

Acesse `http://localhost:4321`.

## Variáveis de ambiente

Copie `.env.example` para `.env` e configure:

| Variável | Descrição |
|----------|-----------|
| `PUBLIC_SITE_URL` | URL canônica do site (ex: `https://malica.com.br`) |
| `PUBLIC_WHATSAPP_GROUP_URL` | Link do grupo WhatsApp |
| `PUBLIC_META_PIXEL_ID` | ID do Meta Pixel (deixe vazio para desativar) |
| `PUBLIC_CONTACT_EMAIL` | E-mail de contato no rodapé |

## Meta Pixel

Quando `PUBLIC_META_PIXEL_ID` estiver configurado:

- **PageView** — disparado ao carregar a página
- **WhatsAppGroupClick** — disparado ao clicar em qualquer CTA do WhatsApp

Para trocar o evento customizado por um padrão (ex: `Lead`), edite `src/scripts/tracking.ts`.

## Deploy na Vercel

1. Conecte o repositório Git à Vercel
2. Framework preset: **Astro**
3. Build command: `npm run build`
4. Output directory: `dist`
5. Configure as variáveis de ambiente de produção
6. Atualize `PUBLIC_SITE_URL` com o domínio final

## Assets de marca

Os arquivos oficiais estão em `public/images/` (copiados de `Malica-Identidade-Visual/`). Para atualizar:

- `malica-logo.png` — logo horizontal transparente
- `malica-mascote.png` — ícone/mascote (capivara na sacola)
- `public/og-image.png` — imagem Open Graph
- `public/favicon.png` — favicon

## Depoimentos

Para exibir a seção de prova social, adicione depoimentos reais em `src/config/site.ts` no array `TESTIMONIALS`. Enquanto estiver vazio, a seção não é renderizada.

## Build

```bash
npm run build
npm run preview
```
