/**
 * Самопроверка логики: npm run selftest. Разделы лежат по темам в этой папке и выполняются по
 * очереди — каждый модуль проверяет при подключении; вывод — одна итоговая строка (или FAIL).
 */
import { fuzz, ok, result } from './harness';

await import('./catalog');
await import('./progression');
await import('./combat-rules');
await import('./combat-abilities');
await import('./expedition');
await import('./account');
await import('./economy');
await import('./combat-fuzz');
await import('./app');

ok(fuzz.autoPicks > 20, `автоприменение срабатывает в фазз-тесте (${fuzz.autoPicks})`);
ok(fuzz.perkUses > 200, `способности применяются в фазз-тесте (${fuzz.perkUses})`);
console.log(
  `Прогонов боя: ${fuzz.runs} (автоприменений: ${fuzz.autoPicks}, способностей: ${fuzz.perkUses}). ${result.failed ? `ОШИБОК: ${result.failed}` : 'Все проверки пройдены.'}`,
);
if (result.failed) throw new Error('selftest failed');
