/**
 * Собирает APK: запускает Gradle в android/ и кладёт готовый файл в корень репозитория.
 * Запуск: npm run apk (перед этим отрабатывает `apk:assets`).
 *
 * Нужен установленный Android SDK: переменная ANDROID_HOME или ANDROID_SDK_ROOT,
 * либо android/local.properties со строкой sdk.dir=/путь/к/sdk.
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const android = join(root, 'android');
const isWin = process.platform === 'win32';

const hasSdk =
  !!process.env.ANDROID_HOME ||
  !!process.env.ANDROID_SDK_ROOT ||
  existsSync(join(android, 'local.properties'));

if (!hasSdk) {
  console.error(
    [
      'Не найден Android SDK.',
      '',
      'Поставьте его одним из способов:',
      '  • Android Studio — он ставит SDK сам, потом просто откройте папку android/;',
      '  • отдельно: sdkmanager "platforms;android-35" "build-tools;35.0.0"',
      '',
      'И укажите путь: ANDROID_HOME=/путь/к/sdk  (или android/local.properties -> sdk.dir=/путь/к/sdk)',
      '',
      'Если ставить SDK не хочется — соберите APK в GitHub Actions:',
      '  вкладка Actions -> «Сборка APK» -> Run workflow -> скачайте артефакт.',
    ].join('\n'),
  );
  process.exit(1);
}

const gradlew = join(android, isWin ? 'gradlew.bat' : 'gradlew');
const task = process.argv.includes('--debug') ? 'assembleDebug' : 'assembleRelease';

const res = spawnSync(isWin ? gradlew : './gradlew', ['--no-daemon', task], {
  cwd: android,
  stdio: 'inherit',
  shell: isWin,
});
if (res.status !== 0) process.exit(res.status ?? 1);

const outDir = join(
  android,
  'app',
  'build',
  'outputs',
  'apk',
  task === 'assembleDebug' ? 'debug' : 'release',
);
const apk = readdirSync(outDir).find((f) => f.endsWith('.apk'));
if (!apk) {
  console.error(`Gradle отработал, но APK в ${outDir} не найден.`);
  process.exit(1);
}

const dest = join(root, 'evil-tower-2.apk');
copyFileSync(join(outDir, apk), dest);
console.log(`\nГотово: ${dest}`);
console.log(
  'Перенесите файл на телефон и откройте его (понадобится разрешение «установка из этого источника»).',
);
