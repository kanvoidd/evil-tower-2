/**
 * Сигнал домена: подписчики узнают о событии (изменился кошелёк, открыто достижение)
 * без Phaser и без DOM. `ctx` нужен, чтобы отписать метод, переданный без привязки.
 */
export class Signal<A extends unknown[] = []> {
  private handlers: Array<{ fn: (...args: A) => void; ctx: unknown }> = [];

  on(fn: (...args: A) => void, ctx?: unknown): void {
    this.handlers.push({ fn, ctx });
  }

  off(fn: (...args: A) => void, ctx?: unknown): void {
    this.handlers = this.handlers.filter((h) => h.fn !== fn || h.ctx !== ctx);
  }

  emit(...args: A): void {
    // копия: подписчик может отписаться прямо в обработчике
    for (const h of [...this.handlers]) h.fn.apply(h.ctx, args);
  }
}
