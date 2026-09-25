/**
 * SVG-иконки интерфейса. По GDD все SVG залиты чёрным цветом (#000).
 * Иконки рисуются на светлых «табличках» и цветных шариках, поэтому чёрный цвет читается везде.
 */
const svg = (body: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="256" height="256" fill="#000" stroke="none">${body}</svg>`;

const star = (points: number, outer: number, inner: number): string => {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / points - Math.PI / 2;
    pts.push(`${(32 + r * Math.cos(a)).toFixed(2)},${(32 + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
};

const sword = (): string =>
  `<path d="M29.5 5 L32 1.5 L34.5 5 V38 H29.5 Z"/><rect x="21" y="38" width="22" height="4.5" rx="1.5"/>` +
  `<rect x="29.5" y="42.5" width="5" height="11"/><circle cx="32" cy="57" r="3.6"/>`;

export const SVG_ICONS: Record<string, string> = {
  // урон — скрещённые мечи
  damage: svg(`<g transform="rotate(45 32 32)">${sword()}</g><g transform="rotate(-45 32 32)">${sword()}</g>`),
  // здоровье — крест
  health: svg(`<path d="M23 5h18v18h18v18H41v18H23V41H5V23h18z"/>`),
  // защита — щит
  defense: svg(
    `<path fill-rule="evenodd" d="M32 3 L57 11 V30 C57 46 46 56 32 62 C18 56 7 46 7 30 V11 Z ` +
      `M32 11 L49 16.5 V30 C49 41 42 49 32 54 C22 49 15 41 15 30 V16.5 Z ` +
      `M32 20 L41 23 V30 C41 36 37 41 32 44 C27 41 23 36 23 30 V23 Z"/>`,
  ),
  // удача — четырёхлистный клевер
  luck: svg(
    `<circle cx="23" cy="22" r="11"/><circle cx="41" cy="22" r="11"/><circle cx="23" cy="40" r="11"/><circle cx="41" cy="40" r="11"/>` +
      `<path d="M31 42 C31 52 35 58 45 61 L46.5 57.5 C39 55 36 50 36 42 Z"/>`,
  ),
  // крит — звезда-взрыв
  crit: svg(`<polygon points="${star(9, 30, 14)}"/>`),
  // уворот — потоки ветра
  dodge: svg(
    `<g fill="none" stroke="#000" stroke-width="5.5" stroke-linecap="round">` +
      `<path d="M6 22 H38 a8.5 8.5 0 1 0 -8.5 -8.5"/><path d="M6 34 H50 a8.5 8.5 0 1 1 -8.5 8.5"/><path d="M6 46 H26 a6.5 6.5 0 1 1 -6.5 6.5"/></g>`,
  ),
  // парирование — клинок с дугой отражения
  parry: svg(
    `<g transform="rotate(35 32 32)">${sword()}</g>` +
      `<path d="M6 40 A28 28 0 0 0 40 6" fill="none" stroke="#000" stroke-width="5" stroke-linecap="round" stroke-dasharray="7 7"/>`,
  ),
  // достижения — кубок
  trophy: svg(
    `<path d="M17 5h30v15c0 11-7 18-15 19-8-1-15-8-15-19z"/>` +
      `<path d="M17 9H6v7c0 9 6 14 13 14v-5c-4 0-8-3-8-9v-2h6z"/><path d="M47 9h11v7c0 9-6 14-13 14v-5c4 0 8-3 8-9v-2h-6z"/>` +
      `<rect x="28.5" y="38" width="7" height="10"/><rect x="19" y="49" width="26" height="9" rx="2"/>`,
  ),
  // звук — динамик (проигрыватель)
  sound: svg(
    `<path d="M5 24h12l17-15v46L17 40H5z"/>` +
      `<g fill="none" stroke="#000" stroke-width="4.5" stroke-linecap="round"><path d="M42 22c4.5 5.5 4.5 14.5 0 20"/><path d="M49 14c8 9 8 27 0 36"/></g>`,
  ),
  // звук выключен — динамик с крестиком
  sound_off: svg(
    `<path d="M4 24h12l17-15v46L16 40H4z"/>` +
      `<g fill="none" stroke="#000" stroke-width="5" stroke-linecap="round"><path d="M42 24l16 16"/><path d="M58 24L42 40"/></g>`,
  ),
  // замок — недоступно
  lock: svg(
    `<path fill-rule="evenodd" d="M11 28 H53 V59 H11 Z M32 37 a5.5 5.5 0 1 0 0.01 0 Z M29.5 44 h5 v9 h-5 Z"/>` +
      `<path d="M19 30 V20 a13 13 0 0 1 26 0 V30 H38.5 V20 a6.5 6.5 0 0 0 -13 0 V30 Z"/>`,
  ),
  // крестик закрытия
  close: svg(`<g fill="none" stroke="#000" stroke-width="9" stroke-linecap="round"><path d="M12 12L52 52"/><path d="M52 12L12 52"/></g>`),
  // стрелка «назад / сбежать»
  arrow: svg(`<path d="M6 32 L30 8 V22 H58 V42 H30 V56 Z"/>`),
  // шестерёнка
  gear: svg(
    `<path fill-rule="evenodd" d="M27 3h10l2 7 5 2 6.5-3.5 7 7L54 23l2 5 7 2v10l-7 2-2 5 3.5 6.5-7 7L44 55l-5 2-2 7H27l-2-7-5-2-6.5 3.5-7-7L10 44l-2-5-7-2V27l7-2 2-5-3.5-6.5 7-7L20 10l5-2z M32 22 a10 10 0 1 0 0.01 0 Z"/>`,
  ),
  // календарь / подарок
  gift: svg(
    `<rect x="6" y="24" width="52" height="34" rx="3"/><rect x="3" y="15" width="58" height="12" rx="3"/>` +
      `<g fill="none" stroke="#000" stroke-width="4.5" stroke-linecap="round"><path d="M32 15 C22 4 12 8 18 14 C22 17 32 15 32 15 C32 15 42 17 46 14 C52 8 42 4 32 15"/></g>`,
  ),
  // клинок — атака
  sword: svg(`<g transform="rotate(45 32 32)">${sword()}</g>`),
  // видео
  video: svg(
    `<path fill-rule="evenodd" d="M10 12 H54 a6 6 0 0 1 6 6 V46 a6 6 0 0 1 -6 6 H10 a6 6 0 0 1 -6 -6 V18 a6 6 0 0 1 6 -6 Z M26 22 L44 32 L26 42 Z"/>`,
  ),
  // галочка — пройдено
  check: svg(`<path d="M9 34 L25 50 L55 14" fill="none" stroke="#000" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`),
  // обмен — смена класса
  swap: svg(
    `<g fill="none" stroke="#000" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round">` +
      `<path d="M8 22 H52"/><path d="M40 9 L53 22 L40 35"/><path d="M56 42 H12"/><path d="M24 29 L11 42 L24 55"/></g>`,
  ),
  // шеврон
  chevron: svg(`<path d="M22 8 L46 32 L22 56" fill="none" stroke="#000" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`),
  // авто — две круговые стрелки
  auto: svg(
    `<g fill="none" stroke="#000" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round">` +
      `<path d="M11 28 A22 22 0 0 1 49 17"/><path d="M50 5 V18 H37"/>` +
      `<path d="M53 36 A22 22 0 0 1 15 47"/><path d="M14 59 V46 H27"/></g>`,
  ),
  // подсказка — буква «i» в круге
  info: svg(
    `<path fill-rule="evenodd" d="M32 3 a29 29 0 1 0 0.01 0 Z M32 10 a22 22 0 1 1 -0.01 0 Z"/>` +
      `<circle cx="32" cy="19.5" r="4.2"/><rect x="28.3" y="28" width="7.4" height="21" rx="2.4"/>`,
  ),
  // молния — особое умение
  bolt: svg(`<path d="M38 2 L11 36 H28 L23 62 L53 25 H35 Z"/>`),
  // череп — враги
  skull: svg(
    `<path fill-rule="evenodd" d="M32 4 C17 4 8 14 8 27 C8 35 12 40 17 43 V54 H26 V49 H29 V54 H35 V49 H38 V54 H47 V43 C52 40 56 35 56 27 C56 14 47 4 32 4 Z ` +
      `M21 22 a6.5 6.5 0 1 0 0.01 0 Z M43 22 a6.5 6.5 0 1 0 0.01 0 Z M32 31 L27 40 H37 Z"/>`,
  ),
};
