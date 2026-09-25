import { defineConfig, type Plugin } from 'vite';

// SDK Яндекс Игр подключается только в сборке: в локальной разработке /sdk.js не существует,
// и игра автоматически работает на заглушке (см. src/infrastructure/sdk/YandexPlatform.ts).
const yandexSdkTag = (): Plugin => ({
  name: 'yandex-sdk-tag',
  apply: 'build',
  transformIndexHtml() {
    return [{ tag: 'script', attrs: { src: '/sdk.js' }, injectTo: 'head-prepend' }];
  },
});

/**
 * Режим `apk` — офлайн-сборка для Android-обёртки: платформы Яндекса там нет,
 * поэтому тег /sdk.js не внедряется (иначе WebView ругался бы на отсутствующий файл).
 * Запуск: `vite build --mode apk` (см. `npm run apk`).
 */
export default defineConfig(({ mode }) => ({
  // Относительные пути: index.html лежит в корне архива, без абсолютных URL.
  base: './',
  plugins: mode === 'apk' ? [] : [yandexSdkTag()],
  server: { host: true, port: 5173 },
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsInlineLimit: 8192,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: { phaser: ['phaser'] },
      },
    },
  },
}));
