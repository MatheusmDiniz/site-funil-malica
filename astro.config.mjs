// @ts-check
import { defineConfig } from 'astro/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** @type {{ fileName: string, source: string | Uint8Array }[]} */
const capturedCss = [];

/**
 * Astro 7 + Vite 8/Rolldown: CSS do prerender some no "Rearranging server assets".
 * Captura no generateBundle e reinsere no dist + <link> nos HTMLs.
 */
function persistPrerenderCss() {
  return {
    name: 'persist-prerender-css',
    generateBundle(_opts, bundle) {
      for (const [fileName, item] of Object.entries(bundle)) {
        if (!fileName.endsWith('.css') || item.type !== 'asset') continue;
        const source = item.source;
        if (source == null) continue;
        capturedCss.push({
          fileName: fileName.replace(/^\//, ''),
          source,
        });
      }
    },
  };
}

function injectCssLinks() {
  return {
    name: 'inject-css-links',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const outDir = fileURLToPath(dir);
        const astroDir = path.join(outDir, '_astro');
        fs.mkdirSync(astroDir, { recursive: true });

        /** @type {string[]} */
        const hrefs = [];
        const seen = new Set();
        for (const { fileName, source } of capturedCss) {
          const base = path.basename(fileName);
          if (seen.has(base)) continue;
          seen.add(base);
          fs.writeFileSync(path.join(astroDir, base), source);
          hrefs.push(`/_astro/${base}`);
        }

        if (hrefs.length === 0) return;

        const links = hrefs
          .map((href) => `<link rel="stylesheet" href="${href}">`)
          .join('');

        const walk = (folder) => {
          for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
            const full = path.join(folder, entry.name);
            if (entry.isDirectory()) {
              walk(full);
              continue;
            }
            if (!entry.name.endsWith('.html')) continue;
            let html = fs.readFileSync(full, 'utf8');
            if (html.includes('persist-prerender-css')) continue;
            if (!html.includes('</head>')) continue;
            html = html.replace(
              '</head>',
              `<!-- persist-prerender-css -->${links}</head>`,
            );
            fs.writeFileSync(full, html);
          }
        };
        walk(outDir);
      },
    },
  };
}

export default defineConfig({
  output: 'static',
  site: process.env.PUBLIC_SITE_URL || 'https://malica.com.br',
  integrations: [injectCssLinks()],
  vite: {
    plugins: [persistPrerenderCss()],
  },
});
