// @ts-check
import { defineConfig, passthroughImageService } from 'astro/config';

// Em dev, sharp transforma cada <Image> sob demanda no endpoint /_image.
// Com muitos componentes/widths em paralelo isso esgota memória no WSL e
// o processo é morto pelo OOM killer. Em produção (build), os assets já
// saem pré-otimizados via /_astro/*.webp, então usamos sharp normalmente.
const isDev = process.env.npm_lifecycle_event === 'dev' || process.argv.includes('dev');

export default defineConfig({
  site: 'https://adriaerychel.example',
  image: {
    ...(isDev ? { service: passthroughImageService() } : {}),
    responsiveStyles: true,
  },
  vite: {
    server: {
      host: true,
    },
  },
});
