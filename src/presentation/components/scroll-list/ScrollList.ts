import Phaser from 'phaser';
import { COLOR } from '../../theme';

/** Вертикальный список с маской, перетаскиванием, колесом мыши и тонкой полосой прокрутки. */
export class ScrollList {
  /** Списки сцены, чьё содержимое за краем не должно ловить нажатия (см. `clipInput`). */
  private static readonly clipped = new WeakMap<Phaser.Input.InputPlugin, Set<ScrollList>>();

  readonly content: Phaser.GameObjects.Container;
  private offset = 0;
  private maxOffset = 0;
  private vel = 0;
  private start: { y: number; off: number } | null = null;
  private last = { y: 0, t: 0 };
  private track: Phaser.GameObjects.Rectangle;
  private thumb: Phaser.GameObjects.Rectangle;
  /** Списки этой сцены с отсечением ввода; сам список — среди них, пока жив. */
  private readonly clipping: Set<ScrollList>;
  moved = 0;

  constructor(scene: Phaser.Scene, readonly rect: Phaser.Geom.Rectangle, contentHeight: number) {
    this.content = scene.add.container(rect.x, rect.y);
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff).fillRect(rect.x, rect.y, rect.width, rect.height);
    this.content.setMask(g.createGeometryMask());
    this.track = scene.add.rectangle(rect.right + 6, rect.y + rect.height / 2, 4, rect.height, 0xffffff, 0.06).setDepth(900);
    this.thumb = scene.add.rectangle(rect.right + 6, rect.y + 30, 6, 60, COLOR.scrollbar, 0.55).setDepth(901);
    scene.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (!this.contains(p)) return;
      this.start = { y: p.y, off: this.offset };
      this.last = { y: p.y, t: scene.time.now };
      this.vel = 0;
      this.moved = 0;
    });
    scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.start || !p.isDown) return;
      const dy = p.y - this.start.y;
      this.moved = Math.max(this.moved, Math.abs(dy));
      if (this.moved < 8) return;
      const dt = Math.max(1, scene.time.now - this.last.t);
      const next = this.start.off - dy;
      this.vel = ((next - this.offset) * 1000) / dt;
      this.last = { y: p.y, t: scene.time.now };
      this.setOffset(next);
    });
    const end = (): void => {
      this.start = null;
    };
    scene.input.on('pointerup', end);
    scene.input.on('pointerupoutside', end);
    scene.input.on('wheel', (p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => {
      if (this.contains(p)) this.setOffset(this.offset + dy);
    });
    scene.events.on('update', (_t: number, dt: number) => this.update(dt));
    scene.events.once('shutdown', () => scene.events.off('update'));
    this.clipping = ScrollList.clipInput(this, scene.input);
    scene.events.once('shutdown', () => this.clipping.delete(this));
    this.setContentHeight(contentHeight);
  }

  /**
   * Маска прячет строки за краем списка только на экране: Phaser ищет объект под указателем,
   * не глядя на маски. Без этой проверки скрытая кнопка прокрученной строки, созданная позже
   * соседних элементов, перехватывала их нажатия — например, крестик лавки (BUG-001).
   * Поэтому попадания в содержимое списка при указателе вне его прямоугольника отбрасываются.
   * Проверка ставится на систему ввода сцены один раз и обслуживает все её списки.
   */
  private static clipInput(list: ScrollList, input: Phaser.Input.InputPlugin): Set<ScrollList> {
    let lists = ScrollList.clipped.get(input);
    if (!lists) {
      const active = new Set<ScrollList>();
      const hitTest = input.hitTestPointer.bind(input);
      input.hitTestPointer = (pointer: Phaser.Input.Pointer): Phaser.GameObjects.GameObject[] =>
        hitTest(pointer).filter((o) => {
          for (const l of active) if (l.hides(o, pointer)) return false;
          return true;
        });
      ScrollList.clipped.set(input, active);
      lists = active;
    }
    lists.add(list);
    return lists;
  }

  contains(p: Phaser.Input.Pointer): boolean {
    return Phaser.Geom.Rectangle.Contains(this.rect, p.x, p.y);
  }

  /** Объект лежит в списке, а указатель — за краем списка: такое попадание не считается. */
  private hides(o: Phaser.GameObjects.GameObject, p: Phaser.Input.Pointer): boolean {
    if (this.contains(p)) return false;
    for (let c = o.parentContainer; c; c = c.parentContainer) if (c === this.content) return true;
    return false;
  }

  setContentHeight(h: number): void {
    this.maxOffset = Math.max(0, h - this.rect.height);
    this.setOffset(this.offset);
  }

  setOffset(o: number): void {
    this.offset = Phaser.Math.Clamp(o, 0, this.maxOffset);
    this.content.y = this.rect.y - this.offset;
    const show = this.maxOffset > 0;
    this.track.setVisible(show);
    this.thumb.setVisible(show);
    if (show) {
      const th = Math.max(50, (this.rect.height * this.rect.height) / (this.maxOffset + this.rect.height));
      this.thumb.setSize(6, th);
      this.thumb.y = this.rect.y + th / 2 + (this.offset / this.maxOffset) * (this.rect.height - th);
    }
  }

  scrollToContentY(y: number): void {
    this.setOffset(y - this.rect.height / 2);
  }

  private update(dt: number): void {
    if (!this.start && Math.abs(this.vel) > 10) {
      this.setOffset(this.offset + (this.vel * dt) / 1000);
      this.vel *= Math.pow(0.004, dt / 1000);
    }
  }

  destroy(): void {
    this.clipping.delete(this);
    this.content.destroy();
    this.track.destroy();
    this.thumb.destroy();
  }
}
