/**
 * Кладёт собранную игру внутрь Android-проекта: dist/ -> android/app/src/main/assets/www.
 * Запуск: npm run apk:assets (сначала сам собирает dist в режиме `apk`).
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const target = join(root, 'android', 'app', 'src', 'main', 'assets', 'www');

if (!existsSync(join(dist, 'index.html'))) {
  console.error('Нет собранной игры в dist/. Выполните:  npx vite build --mode apk');
  process.exit(1);
}

// Старые файлы обязательно убираем: у Vite хешированные имена, иначе APK копил бы мусор от прошлых сборок.
rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(dist, target, { recursive: true });

const bytes = (dir) =>
  readdirSync(dir, { withFileTypes: true }).reduce(
    (sum, e) =>
      sum + (e.isDirectory() ? bytes(join(dir, e.name)) : statSync(join(dir, e.name)).size),
    0,
  );

console.log(
  `Игра скопирована в android/app/src/main/assets/www (${(bytes(target) / 1024 / 1024).toFixed(2)} МБ).`,
);
console.log('Дальше:  npm run apk   (или откройте папку android/ в Android Studio)');
