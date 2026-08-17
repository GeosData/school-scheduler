import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Sitio estático → Cloudflare Pages. El formulario de reportes corre como
// Cloudflare Pages Function bajo /functions (solo oculta la API key de api-emails),
// así que el sitio queda 100% estático y sin JS de framework.
export default defineConfig({
  site: 'https://horarios-escolares.geosdata.com',
  compressHTML: true,
  integrations: [sitemap()],
});
