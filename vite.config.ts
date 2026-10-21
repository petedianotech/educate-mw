import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';
import path from 'path';
import {defineConfig, loadEnv, type Plugin} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { transform, browserslistToTargets } from 'lightningcss';

function unwrapCssLayers(css: string): string {
  css = css.replace(/@layer\s+[^;{]+;/g, '');
  let result = '';
  let i = 0;
  while (i < css.length) {
    if (css.startsWith('@layer', i)) {
      const braceIndex = css.indexOf('{', i);
      if (braceIndex !== -1) {
        let depth = 1;
        let j = braceIndex + 1;
        while (j < css.length && depth > 0) {
          if (css[j] === '{') depth++;
          else if (css[j] === '}') depth--;
          j++;
        }
        if (depth === 0) {
          result += css.slice(braceIndex + 1, j - 1);
          i = j;
          continue;
        }
      }
    }
    result += css[i];
    i++;
  }
  return result;
}

function legacyCssPlugin(): Plugin {
  return {
    name: 'legacy-css-transform',
    enforce: 'post',
    generateBundle(_, bundle) {
      const targets = browserslistToTargets(['chrome 44', 'android 6']);
      for (const fileName in bundle) {
        const chunk = bundle[fileName];
        if (chunk.type === 'asset' && fileName.endsWith('.css')) {
          try {
            const raw = typeof chunk.source === 'string' ? chunk.source : Buffer.from(chunk.source).toString('utf8');
            const res = transform({
              filename: fileName,
              code: Buffer.from(raw),
              targets,
              minify: true,
            });
            chunk.source = unwrapCssLayers(res.code.toString());
          } catch (e) {
            console.warn('[legacy-css-transform] Failed to transform CSS:', e);
          }
        }
      }
    },
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      legacy({
        targets: ['chrome >= 44', 'android >= 6', 'ios >= 10', 'safari >= 10', 'edge >= 15', 'firefox >= 52'],
        additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
      }),
      legacyCssPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        manifest: {
          name: 'Educate Malawi',
          short_name: 'Educate MW',
          description: 'The comprehensive secondary school learning platform for Malawi students.',
          theme_color: '#1e3a8a',
          background_color: '#1e3a8a',
          display: 'standalone',
          start_url: '/',
          icons: [
            { src: '/app-icon.png', sizes: '192x192', type: 'image/png' },
            { src: '/app-icon.png', sizes: '512x512', type: 'image/png' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
            },
            {
              urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
              handler: 'CacheFirst',
              options: { cacheName: 'external-images', expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 } },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        // Do NOT mark Capacitor packages as external (bare imports break APK WebView).
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('firebase')) return 'vendor-firebase';
              if (id.includes('katex') || id.includes('rehype-katex') || id.includes('remark-math')) return 'vendor-katex';
              if (id.includes('jspdf') || id.includes('html2canvas')) return 'vendor-pdf';
              if (id.includes('lucide-react')) return 'vendor-icons';
              if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
            }
          },
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
