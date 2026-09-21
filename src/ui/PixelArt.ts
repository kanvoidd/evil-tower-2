/**
 * Процедурные пиксельные спрайты 16x16 — заглушки в духе Dungeon Cards.
 * Любой спрайт можно заменить файлом src/assets/images/<ключ>.png (см. ArtLoader).
 */
export const PX = 16;

export class Grid {
  private cells: Array<string | null> = Array(PX * PX).fill(null);

  dot(x: number, y: number, c: string): this {
    if (x >= 0 && y >= 0 && x < PX && y < PX) this.cells[y * PX + x] = c;
    return this;
  }

  rect(x: number, y: number, w: number, h: number, c: string): this {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.dot(x + i, y + j, c);
    return this;
  }

  /** Рисует прямоугольник и его зеркальное отражение по вертикальной оси. */
  mrect(x: number, y: number, w: number, h: number, c: string): this {
    this.rect(x, y, w, h, c);
    this.rect(PX - (x + w), y, w, h, c);
    return this;
  }

  mdot(x: number, y: number, c: string): this {
    return this.dot(x, y, c).dot(PX - 1 - x, y, c);
  }

  outline(c = '#0a0a10'): this {
    const src = [...this.cells];
    for (let y = 0; y < PX; y++) {
      for (let x = 0; x < PX; x++) {
        if (src[y * PX + x]) continue;
        const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
          const nx = x + dx;
          const ny = y + dy;
          return nx >= 0 && ny >= 0 && nx < PX && ny < PX && src[ny * PX + nx] && src[ny * PX + nx] !== c;
        });
        if (near) this.cells[y * PX + x] = c;
      }
    }
    return this;
  }

  /** Непрозрачные пиксели (для генерации SVG вне браузера). */
  pixels(): Array<[number, number, string]> {
    const out: Array<[number, number, string]> = [];
    for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) {
      const c = this.cells[y * PX + x];
      if (c) out.push([x, y, c]);
    }
    return out;
  }

  toCanvas(scale: number): HTMLCanvasElement {
    const cv = document.createElement('canvas');
    cv.width = PX * scale;
    cv.height = PX * scale;
    const ctx = cv.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    for (let y = 0; y < PX; y++) {
      for (let x = 0; x < PX; x++) {
        const c = this.cells[y * PX + x];
        if (!c) continue;
        ctx.fillStyle = c;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
    return cv;
  }
}

export type Draw = (g: Grid) => void;

const K = {
  skin: '#e8b98a', skinD: '#c48a5a', skinG: '#8fbf6a', skinGD: '#5f8f45',
  steel: '#b8c0cc', steelD: '#7d8794', steelL: '#eef2f8', iron: '#4b525e',
  red: '#c0392b', redL: '#ec5a48', redD: '#7b241c',
  blue: '#2e6bd6', blueL: '#63a3ff', blueD: '#1b3f8a',
  green: '#3fae55', greenL: '#7be08f', greenD: '#1f6b34',
  purple: '#7d4bd6', purpleL: '#b892ff', purpleD: '#432477',
  brown: '#8a5a2b', brownD: '#5a3818', brownL: '#b98244',
  gold: '#f5c518', goldD: '#a07d05', white: '#f4f4f6', gray: '#9aa0aa', grayD: '#5c616b',
  black: '#14141a', bone: '#ebe6d3', boneD: '#b7b09a', teal: '#1fa88f', orange: '#f28c1e',
  eye: '#101015', cyan: '#5be6ff',
};

// ------------------------------------------------------------------ шляпы и оружие

const hats = {
  helm: (c: string, plume?: string): Draw => (g) => {
    g.mrect(4, 1, 4, 3, c).mrect(4, 4, 1, 2, c);
    if (plume) g.rect(7, 0, 2, 1, plume).rect(7, 1, 2, 1, plume);
  },
  wizard: (c: string, brim: string, star?: string): Draw => (g) => {
    g.rect(7, 0, 2, 1, c).rect(6, 1, 4, 1, c).rect(5, 2, 6, 1, c).rect(3, 3, 10, 1, brim);
    if (star) g.dot(8, 1, star);
  },
  hood: (c: string, cD: string): Draw => (g) => {
    g.mrect(4, 1, 4, 6, c).mrect(4, 6, 1, 2, cD).mrect(6, 3, 2, 3, K.skin);
  },
  mask: (c: string, eye: string): Draw => (g) => {
    g.mrect(4, 1, 4, 6, c).mrect(6, 4, 2, 1, K.skinD).mdot(6, 4, eye);
  },
  bandana: (c: string): Draw => (g) => {
    g.mrect(5, 2, 3, 1, c).rect(11, 3, 3, 1, c).rect(12, 4, 2, 1, c);
  },
  horns: (helm: string, horn: string): Draw => (g) => {
    g.mrect(4, 1, 4, 3, helm).mrect(4, 4, 1, 2, helm).rect(3, 0, 1, 3, horn).rect(12, 0, 1, 3, horn).rect(2, 0, 1, 1, horn).rect(13, 0, 1, 1, horn);
  },
  crown: (): Draw => (g) => {
    g.rect(5, 1, 6, 1, K.gold).rect(5, 0, 1, 1, K.gold).rect(7, 0, 2, 1, K.gold).rect(10, 0, 1, 1, K.gold);
  },
  halo: (): Draw => (g) => {
    g.rect(6, 0, 4, 1, K.gold).dot(5, 1, K.gold).dot(10, 1, K.gold);
  },
  hair: (c: string): Draw => (g) => {
    g.mrect(5, 1, 3, 2, c).mrect(4, 3, 1, 2, c);
  },
  flame: (): Draw => (g) => {
    g.rect(7, 0, 2, 2, K.orange).dot(8, 0, K.gold).mrect(5, 1, 3, 2, K.red);
  },
};

const weapons = {
  sword: (blade: string, hilt = K.brown): Draw => (g) => {
    g.rect(13, 2, 1, 8, blade).rect(12, 10, 3, 1, hilt).rect(13, 11, 1, 2, hilt);
  },
  bigSword: (blade: string): Draw => (g) => {
    g.rect(13, 0, 2, 10, blade).rect(11, 10, 5, 1, K.brown).rect(13, 11, 2, 3, K.brownD);
  },
  staff: (orb: string, wood = K.brown): Draw => (g) => {
    g.rect(13, 3, 1, 11, wood).rect(12, 0, 3, 3, orb).dot(13, 1, K.white);
  },
  skullStaff: (): Draw => (g) => {
    g.rect(13, 4, 1, 10, K.brownD).rect(12, 0, 3, 3, K.bone).dot(12, 1, K.eye).dot(14, 1, K.eye).dot(13, 3, K.greenL);
  },
  bow: (wood = K.brown, glow?: string): Draw => (g) => {
    g.dot(13, 2, wood).dot(14, 3, wood).rect(14, 4, 1, 6, wood).dot(14, 10, wood).dot(13, 11, wood).rect(13, 3, 1, 8, K.white);
    if (glow) g.rect(12, 6, 2, 1, glow);
  },
  rifle: (): Draw => (g) => {
    g.rect(11, 8, 5, 1, K.brownD).rect(12, 7, 3, 1, K.iron).dot(15, 7, K.red);
  },
  dagger: (blade: string): Draw => (g) => {
    g.rect(13, 6, 1, 4, blade).rect(12, 10, 3, 1, K.brownD).rect(13, 11, 1, 2, K.brownD);
  },
  axe: (head: string): Draw => (g) => {
    g.rect(13, 3, 1, 10, K.brown).rect(14, 2, 2, 4, head).rect(12, 3, 1, 2, head);
  },
  katana: (): Draw => (g) => {
    g.rect(13, 0, 1, 11, K.steelL).rect(12, 11, 3, 1, K.gold).rect(13, 12, 1, 2, K.black);
  },
  shield: (c: string, trim = K.steelD): Draw => (g) => {
    g.rect(0, 7, 3, 6, trim).rect(1, 8, 1, 4, c);
  },
};

interface HeroOpts {
  body: string;
  bodyD: string;
  legs: string;
  hat: Draw;
  weapon: Draw;
  extra?: Draw;
  robe?: boolean;
  cape?: string;
  skin?: string;
  boots?: string;
}

const hero = (o: HeroOpts): Draw => (g) => {
  const skin = o.skin ?? K.skin;
  if (o.cape) g.mrect(3, 7, 5, 7, o.cape);
  if (o.robe) g.mrect(4, 11, 4, 4, o.body).mrect(4, 14, 4, 1, o.bodyD);
  else g.mrect(5, 11, 2, 3, o.legs).mrect(5, 14, 2, 1, o.boots ?? K.brownD);
  g.mrect(4, 7, 4, 4, o.body).mrect(4, 11, 4, 1, o.bodyD);
  g.mrect(2, 7, 2, 4, o.body).mrect(2, 11, 2, 1, skin);
  g.mrect(5, 2, 3, 5, skin).mdot(6, 4, K.eye);
  o.extra?.(g);
  o.hat(g);
  o.weapon(g);
};

// ------------------------------------------------------------------ герои

export const HEROES: Record<string, Draw> = {
  warrior: hero({ body: K.steelD, bodyD: K.brownD, legs: K.brown, hat: hats.helm(K.steel, K.red), weapon: weapons.sword(K.steelL), extra: weapons.shield(K.red) }),
  knight: hero({ body: K.steel, bodyD: K.steelD, legs: K.steelD, boots: K.iron, hat: hats.helm(K.steelL, K.blueL), weapon: weapons.sword(K.steelL), extra: weapons.shield(K.blue, K.steelL) }),
  berserk: hero({ body: K.skinD, bodyD: K.brownD, legs: K.brownD, hat: hats.horns(K.iron, K.bone), weapon: weapons.axe(K.steelL), extra: (g) => g.mrect(5, 8, 2, 2, K.red) }),
  paladin: hero({ body: K.white, bodyD: K.gold, legs: K.steel, hat: hats.helm(K.white, K.gold), weapon: weapons.sword(K.gold), extra: (g) => { weapons.shield(K.gold, K.white)(g); hats.halo()(g); } }),

  mage: hero({ body: K.blue, bodyD: K.blueD, legs: K.blue, robe: true, hat: hats.wizard(K.blue, K.blueD), weapon: weapons.staff(K.cyan) }),
  magister: hero({ body: K.purple, bodyD: K.purpleD, legs: K.purple, robe: true, hat: hats.wizard(K.purple, K.purpleD, K.gold), weapon: weapons.staff(K.purpleL, K.goldD), extra: (g) => g.mrect(5, 10, 1, 2, K.gold) }),
  necromancer: hero({ body: K.purpleD, bodyD: K.black, legs: K.purpleD, robe: true, skin: K.skinG, hat: hats.hood(K.black, K.purpleD), weapon: weapons.skullStaff(), extra: (g) => g.mdot(6, 4, K.greenL) }),
  pyromancer: hero({ body: K.red, bodyD: K.redD, legs: K.red, robe: true, hat: hats.wizard(K.redD, K.red, K.orange), weapon: weapons.staff(K.orange), extra: (g) => g.mrect(5, 10, 1, 2, K.orange) }),

  archer: hero({ body: K.green, bodyD: K.greenD, legs: K.brown, hat: hats.hood(K.greenD, K.green), weapon: weapons.bow(), cape: K.greenD }),
  hawkeye: hero({ body: K.greenD, bodyD: K.brownD, legs: K.brownD, hat: hats.hood(K.green, K.greenD), weapon: weapons.bow(K.brownL), cape: K.brown, extra: (g) => g.rect(9, 0, 1, 2, K.redL).rect(10, 1, 1, 1, K.white) }),
  arrowgod: hero({ body: K.gold, bodyD: K.goldD, legs: K.greenD, hat: hats.hood(K.greenD, K.gold), weapon: weapons.bow(K.gold, K.cyan), cape: K.green, extra: (g) => g.mdot(6, 4, K.cyan) }),
  sniper: hero({ body: K.brownD, bodyD: K.black, legs: K.brownD, hat: hats.hood(K.grayD, K.iron), weapon: weapons.rifle(), cape: K.grayD, extra: (g) => g.mdot(6, 4, K.redL) }),

  mercenary: hero({ body: K.grayD, bodyD: K.black, legs: K.iron, hat: hats.mask(K.iron, K.white), weapon: weapons.dagger(K.steelL) }),
  assassin: hero({ body: K.iron, bodyD: K.black, legs: K.black, hat: hats.mask(K.black, K.white), weapon: weapons.dagger(K.steelL), cape: K.black }),
  darkassassin: hero({ body: K.purpleD, bodyD: K.black, legs: K.black, hat: hats.mask(K.black, K.redL), weapon: weapons.dagger(K.purpleL), cape: K.purpleD, extra: (g) => g.dot(12, 9, K.purpleL) }),
  ninja: hero({ body: K.blueD, bodyD: K.black, legs: K.blueD, hat: hats.mask(K.blueD, K.white), weapon: weapons.katana(), extra: (g) => hats.bandana(K.redL)(g) }),
};

// ------------------------------------------------------------------ враги

const skeleton = (bone: string, boneD: string, extra?: Draw): Draw => (g) => {
  g.mrect(5, 2, 3, 4, bone).mrect(6, 6, 2, 1, boneD).mdot(6, 4, K.eye).rect(7, 5, 2, 1, boneD);
  g.rect(7, 7, 2, 5, boneD).mrect(4, 8, 3, 1, bone).mrect(4, 10, 3, 1, bone);
  g.mrect(3, 7, 1, 5, bone).mrect(5, 12, 1, 3, bone).mrect(4, 15, 2, 1, boneD);
  extra?.(g);
};

export const ENEMY_ART: Record<string, Draw> = {
  skeleton: skeleton(K.bone, K.boneD, weapons.sword(K.grayD)),
  skeleton_horned: skeleton('#c9d1e0', '#8792ac', (g) => {
    g.rect(3, 1, 1, 3, K.bone).rect(12, 1, 1, 3, K.bone).rect(2, 0, 1, 2, K.bone).rect(13, 0, 1, 2, K.bone);
    weapons.axe(K.grayD)(g);
  }),
  boss_skeleton_king: skeleton(K.bone, K.boneD, (g) => {
    g.mrect(2, 7, 2, 8, K.red);
    hats.crown()(g);
    weapons.bigSword(K.steelL)(g);
    g.mdot(6, 4, K.redL);
  }),
  slime: (g) => {
    g.rect(6, 6, 4, 1, K.greenL).rect(5, 7, 6, 1, K.green).rect(3, 8, 10, 5, K.green).rect(4, 13, 8, 1, K.greenD);
    g.rect(4, 8, 2, 2, K.greenL).dot(6, 9, K.white);
    g.mrect(5, 9, 2, 2, K.white).mdot(6, 10, K.eye).rect(7, 12, 2, 1, K.greenD);
  },
  bat: (g) => {
    g.mrect(1, 4, 6, 2, K.purpleD).mrect(0, 6, 4, 2, K.purpleD).mrect(2, 8, 2, 1, K.purpleD).mrect(4, 3, 2, 3, K.purple);
    g.mrect(6, 5, 2, 4, K.purple).mrect(6, 3, 1, 2, K.purpleD).mdot(6, 6, K.redL).mdot(6, 8, K.white);
  },
  zombie: hero({ body: '#5a4a3a', bodyD: '#3a2f25', legs: K.grayD, skin: K.skinG, hat: hats.hair('#2f3a2a'), weapon: () => undefined, extra: (g) => g.mdot(6, 4, K.redL).rect(12, 8, 3, 2, K.skinG).rect(0, 8, 3, 2, K.skinG) }),
  goblin: (g) => {
    g.mrect(5, 3, 3, 4, K.green).mrect(2, 3, 3, 2, K.green).mrect(4, 7, 4, 4, K.brown).mrect(5, 11, 2, 3, K.greenD);
    g.mrect(2, 7, 2, 3, K.green).mdot(6, 4, K.eye).mdot(6, 5, K.redL).rect(7, 6, 2, 1, K.white);
    weapons.axe(K.grayD)(g);
  },
  ghost: (g) => {
    g.mrect(5, 1, 3, 2, K.white).mrect(4, 3, 4, 8, K.white).mrect(3, 5, 1, 6, '#dfe6f2').rect(4, 11, 2, 3, K.white).rect(7, 11, 2, 4, K.white).rect(10, 11, 2, 3, K.white);
    g.mrect(5, 4, 2, 2, K.eye).rect(7, 7, 2, 2, K.eye);
  },
  orc: (g) => {
    g.mrect(4, 2, 4, 5, K.skinGD).mrect(3, 7, 5, 5, K.iron).mrect(4, 12, 3, 3, K.brownD).mrect(1, 7, 2, 4, K.skinGD);
    g.mdot(5, 4, K.eye).mdot(5, 3, K.redL).mrect(5, 6, 1, 2, K.white).rect(6, 7, 4, 1, K.brownD);
    weapons.axe(K.steelL)(g);
  },
  wraith: (g) => {
    g.mrect(4, 1, 4, 3, K.black).mrect(3, 4, 5, 9, K.purpleD).rect(3, 13, 2, 2, K.purpleD).rect(7, 13, 2, 2, K.purpleD).rect(11, 13, 2, 2, K.purpleD);
    g.mrect(5, 3, 2, 2, K.eye).mdot(6, 3, K.cyan).mdot(6, 4, K.cyan).rect(1, 6, 2, 4, K.black).rect(13, 6, 2, 4, K.black);
  },
  imp: (g) => {
    g.mrect(5, 3, 3, 4, K.redL).mrect(4, 7, 4, 4, K.red).mrect(5, 11, 2, 3, K.redD).mrect(0, 4, 4, 4, K.redD);
    g.rect(4, 1, 1, 2, K.bone).rect(11, 1, 1, 2, K.bone).mdot(6, 4, K.gold).rect(7, 6, 2, 1, K.white).rect(12, 12, 2, 2, K.red).dot(14, 13, K.redD);
  },
  dark_knight: (g) => {
    g.mrect(4, 1, 4, 4, K.iron).mrect(4, 5, 4, 6, K.black).mrect(5, 11, 2, 3, K.iron).mrect(2, 6, 2, 5, K.iron);
    g.mrect(4, 3, 3, 1, K.eye).mdot(6, 3, K.redL).rect(7, 0, 2, 2, K.redD).mrect(3, 5, 1, 2, K.redD);
    weapons.bigSword(K.grayD)(g);
  },
  golem: (g) => {
    g.mrect(4, 1, 4, 4, K.gray).mrect(2, 5, 6, 6, K.grayD).mrect(4, 11, 3, 4, K.gray).mrect(0, 5, 2, 7, K.gray);
    g.mdot(6, 3, K.orange).mrect(6, 6, 1, 4, K.orange).rect(7, 8, 2, 1, K.gold).mrect(3, 6, 1, 2, K.gray);
  },
  boss_ogre: (g) => {
    g.mrect(3, 1, 5, 5, K.skinGD).mrect(1, 6, 7, 6, K.brownD).mrect(3, 12, 3, 3, K.brown).mrect(0, 6, 1, 5, K.skinGD);
    g.mdot(5, 3, K.eye).mdot(5, 2, K.redL).mrect(4, 5, 1, 2, K.white).rect(6, 7, 4, 1, K.brown).rect(6, 9, 4, 1, K.brown);
    g.rect(12, 2, 3, 10, K.brownL).rect(11, 0, 5, 3, K.brown);
  },
  boss_demon: (g) => {
    g.mrect(4, 2, 4, 5, K.redD).mrect(3, 7, 5, 5, K.red).mrect(4, 12, 3, 3, K.redD).mrect(0, 3, 3, 6, K.black).mrect(1, 7, 2, 4, K.redL);
    g.rect(3, 0, 1, 3, K.bone).rect(12, 0, 1, 3, K.bone).mrect(5, 4, 2, 1, K.gold).mdot(5, 5, K.orange).rect(6, 6, 4, 1, K.white);
    g.rect(13, 8, 2, 6, K.orange).rect(12, 7, 4, 1, K.gold);
  },
};

// ------------------------------------------------------------------ предметы

export const ITEM_ART: Record<string, Draw> = {
  chest: (g) => {
    g.rect(2, 6, 12, 8, K.brown).rect(2, 6, 12, 2, K.brownL).rect(2, 9, 12, 1, K.brownD).rect(2, 13, 12, 1, K.brownD);
    g.rect(2, 6, 2, 8, K.iron).rect(12, 6, 2, 8, K.iron).rect(7, 8, 2, 3, K.gold).dot(8, 9, K.brownD).rect(3, 4, 10, 2, K.brownL).rect(4, 3, 8, 1, K.brown);
  },
  gold: (g) => {
    g.rect(4, 11, 8, 3, K.gold).rect(3, 12, 10, 1, K.gold).rect(4, 13, 8, 1, K.goldD).rect(5, 8, 6, 3, K.gold).rect(6, 5, 4, 3, K.gold).rect(5, 5, 1, 1, K.white).rect(6, 8, 1, 1, K.white);
    g.rect(6, 6, 1, 1, K.goldD).rect(9, 9, 2, 1, K.goldD).rect(7, 12, 3, 1, K.goldD);
  },
  potion_heal: (g) => {
    g.rect(6, 2, 4, 2, K.brownL).rect(7, 4, 2, 2, K.white).rect(4, 6, 8, 7, K.redL).rect(5, 13, 6, 1, K.red).rect(5, 7, 2, 4, K.white).rect(10, 8, 1, 4, K.redD);
    g.rect(4, 6, 1, 7, K.red).rect(11, 6, 1, 7, K.red);
  },
  potion_regen: (g) => {
    g.rect(6, 2, 4, 2, K.brownL).rect(7, 4, 2, 2, K.white).rect(4, 6, 8, 7, K.blueL).rect(5, 13, 6, 1, K.blue).rect(5, 7, 2, 4, K.white).rect(10, 8, 1, 4, K.blueD);
    g.rect(4, 6, 1, 7, K.blue).rect(11, 6, 1, 7, K.blue);
  },
  artifact: (g) => {
    g.rect(6, 3, 4, 1, K.purpleL).rect(5, 4, 6, 6, K.purple).rect(6, 10, 4, 1, K.purpleD).rect(6, 5, 2, 2, K.white).rect(9, 8, 1, 1, K.purpleL);
    g.rect(5, 11, 6, 1, K.goldD).rect(4, 12, 8, 2, K.gold).rect(3, 14, 10, 1, K.goldD);
  },
  coin: (g) => {
    g.rect(4, 3, 8, 10, K.gold).rect(3, 4, 10, 8, K.gold).rect(6, 5, 4, 6, K.goldD).rect(7, 6, 2, 4, K.gold).rect(4, 4, 2, 1, K.white);
  },
  pouch: (g) => {
    g.rect(6, 2, 4, 2, K.brownL).rect(4, 4, 8, 1, K.gold).rect(3, 5, 10, 8, '#a8742e').rect(4, 5, 8, 1, '#c28a3d');
    g.rect(3, 11, 10, 2, '#7a4f1c').rect(4, 6, 2, 4, '#c9924a').rect(7, 7, 2, 4, K.gold).rect(6, 8, 4, 2, K.gold).rect(2, 8, 1, 3, '#a8742e').rect(13, 8, 1, 3, '#a8742e');
  },
  soul: (g) => {
    g.rect(7, 1, 2, 2, K.purpleL).rect(6, 3, 4, 2, K.purpleL).rect(5, 5, 6, 4, K.purple).rect(4, 9, 8, 2, K.purple).rect(5, 11, 2, 2, K.purpleD).rect(9, 11, 2, 2, K.purpleD);
    g.mdot(6, 6, K.white).mdot(6, 7, K.eye);
  },
};

const TIER_METAL = ['#8a6a4a', '#b8c0cc', '#6f7b8c', '#eef2f8', '#f5c518', '#5be6ff'];
const TIER_ACCENT = ['#5a3818', '#7d8794', '#3b4350', '#b7c4d8', '#a07d05', '#1fa88f'];

/** Иконки оружия по ветке класса и тиру (1..6). */
export const weaponArt = (lineage: string, tier: number): Draw => (g) => {
  const m = TIER_METAL[tier - 1];
  const a = TIER_ACCENT[tier - 1];
  if (lineage === 'warrior') {
    if (tier === 3) {
      g.rect(7, 2, 2, 12, K.brown).rect(9, 2, 5, 5, m).rect(9, 3, 4, 3, a).rect(3, 3, 4, 3, m).rect(4, 4, 2, 1, a);
    } else {
      g.rect(7, 1, 2, 9, m).rect(7, 1, 1, 9, a).rect(4, 10, 8, 2, K.brownD).rect(7, 12, 2, 3, K.brown).dot(8, 0, m);
      if (tier >= 4) g.rect(6, 2, 4, 6, m).rect(7, 3, 2, 4, a);
    }
  } else if (lineage === 'mage') {
    g.rect(7, 4, 2, 11, K.brown).rect(6, 1, 4, 4, m).rect(7, 2, 2, 2, K.white).rect(5, 5, 6, 1, a);
    if (tier >= 4) g.rect(4, 0, 1, 3, m).rect(11, 0, 1, 3, m);
  } else if (lineage === 'archer') {
    g.rect(11, 1, 2, 2, K.brown).rect(12, 3, 2, 10, K.brown).rect(11, 13, 2, 2, K.brown).rect(11, 3, 1, 10, '#e8e8ee');
    g.rect(3, 7, 8, 1, a).rect(2, 6, 2, 3, m).dot(1, 7, m);
  } else {
    g.rect(7, 1, 2, 8, m).rect(7, 1, 1, 8, a).rect(5, 9, 6, 1, K.brownD).rect(7, 10, 2, 4, K.brown);
    if (tier >= 4) g.rect(3, 4, 1, 6, m).rect(12, 4, 1, 6, m);
  }
};

export const armorArt = (tier: number): Draw => (g) => {
  const m = ['#a3865f', '#8a5a2b', '#b8c0cc', '#eef2f8', '#f5c518', '#5be6ff'][tier - 1];
  const a = ['#6b5236', '#5a3818', '#7d8794', '#b7c4d8', '#a07d05', '#1fa88f'][tier - 1];
  g.rect(4, 3, 8, 10, m).rect(2, 3, 3, 4, a).rect(11, 3, 3, 4, a).rect(6, 3, 4, 2, K.black).rect(5, 7, 6, 1, a).rect(5, 10, 6, 1, a).rect(7, 5, 2, 8, a);
  if (tier >= 4) g.rect(2, 2, 3, 1, m).rect(11, 2, 3, 1, m).rect(7, 8, 2, 2, K.gold);
};

export const PIXEL_SCALE = 6;
