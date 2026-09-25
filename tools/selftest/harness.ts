/** Общее для разделов самопроверки: проверка, счёт ошибок, пустые расходники, счётчики фазз-теста. */

/** Сколько проверок не прошло. */
export const result = { failed: 0 };

/** Проверка: при провале — сообщение в stderr и +1 к ошибкам; выполнение продолжается. */
export const ok = (cond: boolean, msg: string): void => {
  if (!cond) {
    result.failed++;
    console.error('FAIL:', msg);
  }
};

/** Расходники героя без запаса. */
export const cons = () => ({ potion_heal: 0, potion_regen: 0, artifact: 0 });

/** Что насчитал фазз-тест поля боя: прогоны, автоприменения, способности. */
export const fuzz = { runs: 0, autoPicks: 0, perkUses: 0 };
