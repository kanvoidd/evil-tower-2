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
        const near = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ].some(([dx, dy]) => {
          const nx = x + dx;
          const ny = y + dy;
          return (
            nx >= 0 && ny >= 0 && nx < PX && ny < PX && src[ny * PX + nx] && src[ny * PX + nx] !== c
          );
        });
        if (near) this.cells[y * PX + x] = c;
      }
    }
    return this;
  }

  /** Непрозрачные пиксели (для генерации SVG вне браузера). */
  pixels(): Array<[number, number, string]> {
    const out: Array<[number, number, string]> = [];
    for (let y = 0; y < PX; y++)
      for (let x = 0; x < PX; x++) {
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
  skin: '#e8b98a',
  skinD: '#c48a5a',
  skinG: '#8fbf6a',
  skinGD: '#5f8f45',
  steel: '#b8c0cc',
  steelD: '#7d8794',
  steelL: '#eef2f8',
  iron: '#4b525e',
  red: '#c0392b',
  redL: '#ec5a48',
  redD: '#7b241c',
  blue: '#2e6bd6',
  blueL: '#63a3ff',
  blueD: '#1b3f8a',
  green: '#3fae55',
  greenL: '#7be08f',
  greenD: '#1f6b34',
  purple: '#7d4bd6',
  purpleL: '#b892ff',
  purpleD: '#432477',
  brown: '#8a5a2b',
  brownD: '#5a3818',
  brownL: '#b98244',
  gold: '#f5c518',
  goldD: '#a07d05',
  white: '#f4f4f6',
  gray: '#9aa0aa',
  grayD: '#5c616b',
  black: '#14141a',
  bone: '#ebe6d3',
  boneD: '#b7b09a',
  teal: '#1fa88f',
  orange: '#f28c1e',
  eye: '#101015',
  cyan: '#5be6ff',
};

// ------------------------------------------------------------------ шляпы и оружие

const hats = {
  helm:
    (c: string, plume?: string): Draw =>
    (g) => {
      g.mrect(4, 1, 4, 3, c).mrect(4, 4, 1, 2, c);
      if (plume) g.rect(7, 0, 2, 1, plume).rect(7, 1, 2, 1, plume);
    },
  wizard:
    (c: string, brim: string, star?: string): Draw =>
    (g) => {
      g.rect(7, 0, 2, 1, c).rect(6, 1, 4, 1, c).rect(5, 2, 6, 1, c).rect(3, 3, 10, 1, brim);
      if (star) g.dot(8, 1, star);
    },
  hood:
    (c: string, cD: string): Draw =>
    (g) => {
      g.mrect(4, 1, 4, 6, c).mrect(4, 6, 1, 2, cD).mrect(6, 3, 2, 3, K.skin);
    },
  mask:
    (c: string, eye: string): Draw =>
    (g) => {
      g.mrect(4, 1, 4, 6, c).mrect(6, 4, 2, 1, K.skinD).mdot(6, 4, eye);
    },
  bandana:
    (c: string): Draw =>
    (g) => {
      g.mrect(5, 2, 3, 1, c).rect(11, 3, 3, 1, c).rect(12, 4, 2, 1, c);
    },
  horns:
    (helm: string, horn: string): Draw =>
    (g) => {
      g.mrect(4, 1, 4, 3, helm)
        .mrect(4, 4, 1, 2, helm)
        .rect(3, 0, 1, 3, horn)
        .rect(12, 0, 1, 3, horn)
        .rect(2, 0, 1, 1, horn)
        .rect(13, 0, 1, 1, horn);
    },
  crown: (): Draw => (g) => {
    g.rect(5, 1, 6, 1, K.gold)
      .rect(5, 0, 1, 1, K.gold)
      .rect(7, 0, 2, 1, K.gold)
      .rect(10, 0, 1, 1, K.gold);
  },
  halo: (): Draw => (g) => {
    g.rect(6, 0, 4, 1, K.gold).dot(5, 1, K.gold).dot(10, 1, K.gold);
  },
  hair:
    (c: string): Draw =>
    (g) => {
      g.mrect(5, 1, 3, 2, c).mrect(4, 3, 1, 2, c);
    },
  flame: (): Draw => (g) => {
    g.rect(7, 0, 2, 2, K.orange).dot(8, 0, K.gold).mrect(5, 1, 3, 2, K.red);
  },
};

const weapons = {
  sword:
    (blade: string, hilt = K.brown): Draw =>
    (g) => {
      g.rect(13, 2, 1, 8, blade).rect(12, 10, 3, 1, hilt).rect(13, 11, 1, 2, hilt);
    },
  bigSword:
    (blade: string): Draw =>
    (g) => {
      g.rect(13, 0, 2, 10, blade).rect(11, 10, 5, 1, K.brown).rect(13, 11, 2, 3, K.brownD);
    },
  staff:
    (orb: string, wood = K.brown): Draw =>
    (g) => {
      g.rect(13, 3, 1, 11, wood).rect(12, 0, 3, 3, orb).dot(13, 1, K.white);
    },
  skullStaff: (): Draw => (g) => {
    g.rect(13, 4, 1, 10, K.brownD)
      .rect(12, 0, 3, 3, K.bone)
      .dot(12, 1, K.eye)
      .dot(14, 1, K.eye)
      .dot(13, 3, K.greenL);
  },
  bow:
    (wood = K.brown, glow?: string): Draw =>
    (g) => {
      g.dot(13, 2, wood)
        .dot(14, 3, wood)
        .rect(14, 4, 1, 6, wood)
        .dot(14, 10, wood)
        .dot(13, 11, wood)
        .rect(13, 3, 1, 8, K.white);
      if (glow) g.rect(12, 6, 2, 1, glow);
    },
  rifle: (): Draw => (g) => {
    g.rect(11, 8, 5, 1, K.brownD).rect(12, 7, 3, 1, K.iron).dot(15, 7, K.red);
  },
  dagger:
    (blade: string): Draw =>
    (g) => {
      g.rect(13, 6, 1, 4, blade).rect(12, 10, 3, 1, K.brownD).rect(13, 11, 1, 2, K.brownD);
    },
  axe:
    (head: string): Draw =>
    (g) => {
      g.rect(13, 3, 1, 10, K.brown).rect(14, 2, 2, 4, head).rect(12, 3, 1, 2, head);
    },
  katana: (): Draw => (g) => {
    g.rect(13, 0, 1, 11, K.steelL).rect(12, 11, 3, 1, K.gold).rect(13, 12, 1, 2, K.black);
  },
  shield:
    (c: string, trim = K.steelD): Draw =>
    (g) => {
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

const hero =
  (o: HeroOpts): Draw =>
  (g) => {
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
  warrior: hero({
    body: K.steelD,
    bodyD: K.brownD,
    legs: K.brown,
    hat: hats.helm(K.steel, K.red),
    weapon: weapons.sword(K.steelL),
    extra: weapons.shield(K.red),
  }),
  knight: hero({
    body: K.steel,
    bodyD: K.steelD,
    legs: K.steelD,
    boots: K.iron,
    hat: hats.helm(K.steelL, K.blueL),
    weapon: weapons.sword(K.steelL),
    extra: weapons.shield(K.blue, K.steelL),
  }),
  berserk: hero({
    body: K.skinD,
    bodyD: K.brownD,
    legs: K.brownD,
    hat: hats.horns(K.iron, K.bone),
    weapon: weapons.axe(K.steelL),
    extra: (g) => g.mrect(5, 8, 2, 2, K.red),
  }),
  paladin: hero({
    body: K.white,
    bodyD: K.gold,
    legs: K.steel,
    hat: hats.helm(K.white, K.gold),
    weapon: weapons.sword(K.gold),
    extra: (g) => {
      weapons.shield(K.gold, K.white)(g);
      hats.halo()(g);
    },
  }),

  mage: hero({
    body: K.blue,
    bodyD: K.blueD,
    legs: K.blue,
    robe: true,
    hat: hats.wizard(K.blue, K.blueD),
    weapon: weapons.staff(K.cyan),
  }),
  magister: hero({
    body: K.purple,
    bodyD: K.purpleD,
    legs: K.purple,
    robe: true,
    hat: hats.wizard(K.purple, K.purpleD, K.gold),
    weapon: weapons.staff(K.purpleL, K.goldD),
    extra: (g) => g.mrect(5, 10, 1, 2, K.gold),
  }),
  necromancer: hero({
    body: K.purpleD,
    bodyD: K.black,
    legs: K.purpleD,
    robe: true,
    skin: K.skinG,
    hat: hats.hood(K.black, K.purpleD),
    weapon: weapons.skullStaff(),
    extra: (g) => g.mdot(6, 4, K.greenL),
  }),
  pyromancer: hero({
    body: K.red,
    bodyD: K.redD,
    legs: K.red,
    robe: true,
    hat: hats.wizard(K.redD, K.red, K.orange),
    weapon: weapons.staff(K.orange),
    extra: (g) => g.mrect(5, 10, 1, 2, K.orange),
  }),

  archer: hero({
    body: K.green,
    bodyD: K.greenD,
    legs: K.brown,
    hat: hats.hood(K.greenD, K.green),
    weapon: weapons.bow(),
    cape: K.greenD,
  }),
  hawkeye: hero({
    body: K.greenD,
    bodyD: K.brownD,
    legs: K.brownD,
    hat: hats.hood(K.green, K.greenD),
    weapon: weapons.bow(K.brownL),
    cape: K.brown,
    extra: (g) => g.rect(9, 0, 1, 2, K.redL).rect(10, 1, 1, 1, K.white),
  }),
  arrowgod: hero({
    body: K.gold,
    bodyD: K.goldD,
    legs: K.greenD,
    hat: hats.hood(K.greenD, K.gold),
    weapon: weapons.bow(K.gold, K.cyan),
    cape: K.green,
    extra: (g) => g.mdot(6, 4, K.cyan),
  }),
  sniper: hero({
    body: K.brownD,
    bodyD: K.black,
    legs: K.brownD,
    hat: hats.hood(K.grayD, K.iron),
    weapon: weapons.rifle(),
    cape: K.grayD,
    extra: (g) => g.mdot(6, 4, K.redL),
  }),

  mercenary: hero({
    body: K.grayD,
    bodyD: K.black,
    legs: K.iron,
    hat: hats.mask(K.iron, K.white),
    weapon: weapons.dagger(K.steelL),
  }),
  assassin: hero({
    body: K.iron,
    bodyD: K.black,
    legs: K.black,
    hat: hats.mask(K.black, K.white),
    weapon: weapons.dagger(K.steelL),
    cape: K.black,
  }),
  darkassassin: hero({
    body: K.purpleD,
    bodyD: K.black,
    legs: K.black,
    hat: hats.mask(K.black, K.redL),
    weapon: weapons.dagger(K.purpleL),
    cape: K.purpleD,
    extra: (g) => g.dot(12, 9, K.purpleL),
  }),
  ninja: hero({
    body: K.blueD,
    bodyD: K.black,
    legs: K.blueD,
    hat: hats.mask(K.blueD, K.white),
    weapon: weapons.katana(),
    extra: (g) => hats.bandana(K.redL)(g),
  }),
};

// ------------------------------------------------------------------ враги

const skeleton =
  (bone: string, boneD: string, extra?: Draw): Draw =>
  (g) => {
    g.mrect(5, 2, 3, 4, bone).mrect(6, 6, 2, 1, boneD).mdot(6, 4, K.eye).rect(7, 5, 2, 1, boneD);
    g.rect(7, 7, 2, 5, boneD).mrect(4, 8, 3, 1, bone).mrect(4, 10, 3, 1, bone);
    g.mrect(3, 7, 1, 5, bone).mrect(5, 12, 1, 3, bone).mrect(4, 15, 2, 1, boneD);
    extra?.(g);
  };

/** Четвероногий зверь: туловище слева, морда справа. */
const beast =
  (body: string, bodyD: string, eye = K.redL, extra?: Draw): Draw =>
  (g) => {
    g.rect(1, 6, 9, 5, body).rect(1, 11, 2, 4, bodyD).rect(7, 11, 2, 4, bodyD);
    g.rect(9, 3, 6, 6, body).rect(9, 2, 2, 2, bodyD).rect(13, 2, 2, 2, bodyD);
    g.dot(12, 5, eye).dot(14, 5, eye).rect(11, 8, 4, 1, K.white).rect(0, 5, 2, 2, bodyD);
    extra?.(g);
  };

/** Капля-желе. */
const blob =
  (c: string, cL: string, cD: string, extra?: Draw): Draw =>
  (g) => {
    g.rect(6, 5, 4, 1, cL).rect(5, 6, 6, 1, c).rect(3, 7, 10, 6, c).rect(4, 13, 8, 1, cD);
    g.rect(4, 7, 2, 2, cL).mrect(5, 9, 2, 2, K.white).mdot(6, 10, K.eye).rect(7, 12, 2, 1, cD);
    extra?.(g);
  };

/** Летящее существо с крыльями. */
const flyer =
  (wing: string, body: string, eye: string, extra?: Draw): Draw =>
  (g) => {
    g.mrect(1, 4, 6, 2, wing).mrect(0, 6, 4, 2, wing).mrect(2, 8, 2, 1, wing);
    g.mrect(6, 4, 2, 6, body).mrect(6, 3, 1, 2, wing).mdot(6, 5, eye).mdot(6, 8, K.white);
    extra?.(g);
  };

/** Бесплотный силуэт с рваным подолом. */
const ghostly =
  (c: string, cD: string, eye: string, extra?: Draw): Draw =>
  (g) => {
    g.mrect(5, 1, 3, 2, c).mrect(4, 3, 4, 8, c).mrect(3, 5, 1, 6, cD);
    g.rect(4, 11, 2, 3, c).rect(7, 11, 2, 4, c).rect(10, 11, 2, 3, c);
    g.mrect(5, 4, 2, 2, K.eye).mdot(6, 4, eye);
    extra?.(g);
  };

/** Каменный/железный истукан: широкие плечи, светящееся ядро. */
const construct =
  (metal: string, accent: string, core: string, extra?: Draw): Draw =>
  (g) => {
    g.mrect(4, 1, 4, 4, metal)
      .mrect(2, 5, 6, 6, accent)
      .mrect(4, 11, 3, 4, metal)
      .mrect(0, 5, 2, 7, metal);
    g.mdot(6, 3, core).mrect(6, 6, 1, 4, core).rect(7, 8, 2, 1, core).mrect(3, 6, 1, 2, metal);
    extra?.(g);
  };

/** Рогатый демон. */
const demonish =
  (body: string, bodyD: string, horn: string, eye: string, extra?: Draw): Draw =>
  (g) => {
    g.mrect(5, 3, 3, 4, body)
      .mrect(4, 7, 4, 4, bodyD)
      .mrect(5, 11, 2, 3, bodyD)
      .mrect(0, 4, 4, 4, bodyD);
    g.rect(4, 1, 1, 2, horn).rect(11, 1, 1, 2, horn).rect(3, 0, 1, 1, horn).rect(12, 0, 1, 1, horn);
    g.mdot(6, 4, eye).rect(7, 6, 2, 1, K.white);
    extra?.(g);
  };

/** Панцирный: краб, горгулья, жук. */
const shelled =
  (shell: string, shellD: string, eye: string, extra?: Draw): Draw =>
  (g) => {
    g.rect(3, 5, 10, 6, shell).rect(3, 4, 10, 1, shellD).rect(4, 11, 8, 1, shellD);
    g.mrect(0, 6, 2, 2, shellD)
      .mrect(1, 11, 2, 3, shellD)
      .mrect(5, 7, 2, 2, K.white)
      .mdot(6, 8, eye);
    g.mrect(4, 2, 1, 2, shellD);
    extra?.(g);
  };

const FROST = '#bfe9ff';
const FROSTD = '#5f9fc9';
const MAGMA = '#ff7a2a';
const MAGMAD = '#8a2b00';
const ROT = '#7f9a52';

export const ENEMY_ART: Record<string, Draw> = {
  // ---- 1. Склеп
  skeleton: skeleton(K.bone, K.boneD, weapons.sword(K.grayD)),
  bat: flyer(K.purpleD, K.purple, K.redL),
  slime: blob(K.green, K.greenL, K.greenD),
  skeleton_horned: skeleton('#c9d1e0', '#8792ac', (g) => {
    g.rect(3, 1, 1, 3, K.bone)
      .rect(12, 1, 1, 3, K.bone)
      .rect(2, 0, 1, 2, K.bone)
      .rect(13, 0, 1, 2, K.bone);
    weapons.axe(K.grayD)(g);
  }),
  zombie: hero({
    body: '#5a4a3a',
    bodyD: '#3a2f25',
    legs: K.grayD,
    skin: K.skinG,
    hat: hats.hair('#2f3a2a'),
    weapon: () => undefined,
    extra: (g) => g.mdot(6, 4, K.redL).rect(12, 8, 3, 2, K.skinG).rect(0, 8, 3, 2, K.skinG),
  }),
  boss_skeleton_king: skeleton(K.bone, K.boneD, (g) => {
    g.mrect(2, 7, 2, 8, K.red);
    hats.crown()(g);
    weapons.bigSword(K.steelL)(g);
    g.mdot(6, 4, K.redL);
  }),

  // ---- 2. Катакомбы
  rat_swarm: (g) => {
    for (const [x, y] of [
      [1, 8],
      [6, 6],
      [10, 9],
    ] as Array<[number, number]>) {
      g.rect(x, y, 5, 3, '#6b5a4a')
        .rect(x + 4, y - 1, 2, 2, '#6b5a4a')
        .dot(x + 5, y, K.redL)
        .rect(x - 1, y + 1, 1, 1, '#4a3d31');
    }
  },
  goblin: (g) => {
    g.mrect(5, 3, 3, 4, K.green)
      .mrect(2, 3, 3, 2, K.green)
      .mrect(4, 7, 4, 4, K.brown)
      .mrect(5, 11, 2, 3, K.greenD);
    g.mrect(2, 7, 2, 3, K.green).mdot(6, 4, K.eye).mdot(6, 5, K.redL).rect(7, 6, 2, 1, K.white);
    weapons.axe(K.grayD)(g);
  },
  ghost: ghostly(K.white, '#dfe6f2', K.cyan),
  orc: (g) => {
    g.mrect(4, 2, 4, 5, K.skinGD)
      .mrect(3, 7, 5, 5, K.iron)
      .mrect(4, 12, 3, 3, K.brownD)
      .mrect(1, 7, 2, 4, K.skinGD);
    g.mdot(5, 4, K.eye).mdot(5, 3, K.redL).mrect(5, 6, 1, 2, K.white).rect(6, 7, 4, 1, K.brownD);
    weapons.axe(K.steelL)(g);
  },
  wraith: (g) => {
    g.mrect(4, 1, 4, 3, K.black)
      .mrect(3, 4, 5, 9, K.purpleD)
      .rect(3, 13, 2, 2, K.purpleD)
      .rect(7, 13, 2, 2, K.purpleD)
      .rect(11, 13, 2, 2, K.purpleD);
    g.mrect(5, 3, 2, 2, K.eye)
      .mdot(6, 3, K.cyan)
      .mdot(6, 4, K.cyan)
      .rect(1, 6, 2, 4, K.black)
      .rect(13, 6, 2, 4, K.black);
  },
  boss_ogre: (g) => {
    g.mrect(3, 1, 5, 5, K.skinGD)
      .mrect(1, 6, 7, 6, K.brownD)
      .mrect(3, 12, 3, 3, K.brown)
      .mrect(0, 6, 1, 5, K.skinGD);
    g.mdot(5, 3, K.eye)
      .mdot(5, 2, K.redL)
      .mrect(4, 5, 1, 2, K.white)
      .rect(6, 7, 4, 1, K.brown)
      .rect(6, 9, 4, 1, K.brown);
    g.rect(12, 2, 3, 10, K.brownL).rect(11, 0, 5, 3, K.brown);
  },

  // ---- 3. Затопленные ярусы
  mudcrab: shelled('#7c6a4a', '#4f4230', K.gold),
  drowned: hero({
    body: '#2f5a5a',
    bodyD: '#1b3838',
    legs: '#2f5a5a',
    skin: '#8fb8ae',
    hat: hats.hair('#1b3838'),
    weapon: () => undefined,
    extra: (g) => g.mdot(6, 4, K.cyan).rect(2, 12, 12, 1, '#3f7f7f'),
  }),
  deep_hound: beast('#2d6f7a', '#16434b', K.cyan),
  tide_wraith: ghostly('#5fc7d8', '#2f7f92', K.white),
  kraken_spawn: (g) => {
    g.rect(4, 2, 8, 6, '#6a3f8f')
      .rect(5, 1, 6, 1, '#8a5fb0')
      .mrect(5, 4, 2, 2, K.white)
      .mdot(6, 5, K.eye);
    for (const x of [2, 5, 8, 11]) g.rect(x, 8, 2, 5, '#6a3f8f').rect(x, 13, 2, 2, '#4a2a68');
  },
  boss_leviathan: (g) => {
    g.rect(2, 4, 12, 7, '#1f6f8f').rect(3, 3, 10, 1, '#3f9fc0').rect(3, 11, 10, 1, '#12455a');
    g.mrect(4, 5, 3, 3, K.white)
      .mdot(5, 6, K.eye)
      .rect(4, 9, 8, 1, K.white)
      .rect(5, 10, 6, 1, K.white);
    g.rect(0, 6, 2, 4, '#12455a').rect(14, 6, 2, 4, '#12455a').rect(6, 0, 4, 3, '#3f9fc0');
  },

  // ---- 4. Оружейная
  armored_husk: construct(K.steelD, K.iron, K.black, (g) => g.mdot(6, 3, K.cyan)),
  blade_dancer: hero({
    body: '#7a2f4a',
    bodyD: '#4a1b2c',
    legs: '#4a1b2c',
    hat: hats.bandana(K.redL),
    weapon: weapons.katana(),
    extra: weapons.dagger(K.steelL),
  }),
  crossbowman: hero({
    body: '#5a6a4a',
    bodyD: '#39442f',
    legs: K.brownD,
    hat: hats.helm(K.steelD),
    weapon: weapons.rifle(),
    cape: '#39442f',
  }),
  iron_sentinel: construct(K.steel, K.steelD, K.blueL, (g) => weapons.shield(K.iron, K.steelL)(g)),
  warden: hero({
    body: K.iron,
    bodyD: K.black,
    legs: K.iron,
    hat: hats.helm(K.steel, K.red),
    weapon: weapons.bigSword(K.steelL),
    extra: (g) => g.mdot(6, 4, K.redL),
  }),
  boss_forge_master: hero({
    body: '#6a3a1f',
    bodyD: '#3a1d0d',
    legs: K.iron,
    hat: hats.horns(K.iron, MAGMA),
    weapon: weapons.axe(MAGMA),
    extra: (g) => g.mrect(5, 8, 2, 2, MAGMA).mdot(6, 4, K.gold),
  }),

  // ---- 5. Ведьмин сад
  thornling: (g) => {
    g.rect(5, 6, 6, 7, '#3f7a2f')
      .rect(6, 5, 4, 1, '#5aa03f')
      .mrect(5, 8, 2, 2, K.white)
      .mdot(6, 9, K.eye);
    for (const [x, y] of [
      [3, 5],
      [12, 5],
      [2, 9],
      [13, 9],
      [4, 13],
      [11, 13],
    ] as Array<[number, number]>)
      g.rect(x, y, 1, 2, '#2a5520');
    g.rect(7, 2, 2, 3, '#2a5520').rect(6, 1, 4, 1, '#c0392b');
  },
  spider: (g) => {
    g.rect(5, 6, 6, 5, '#2a1f2f').rect(6, 4, 4, 2, '#3f2f4a').mrect(6, 4, 2, 1, K.redL);
    for (const y of [5, 8, 11]) {
      g.rect(1, y, 4, 1, '#2a1f2f').rect(0, y + 1, 1, 1, '#2a1f2f');
      g.rect(11, y, 4, 1, '#2a1f2f').rect(15, y + 1, 1, 1, '#2a1f2f');
    }
  },
  wasp_queen: flyer('#e8e0a0', '#e0a81f', K.eye, (g) => {
    g.mrect(6, 10, 2, 3, K.black)
      .rect(7, 13, 2, 2, '#e0a81f')
      .rect(7, 6, 2, 1, K.black)
      .rect(7, 8, 2, 1, K.black);
  }),
  vine_horror: (g) => {
    g.rect(4, 4, 8, 9, '#2f6a35').rect(5, 3, 6, 1, '#4a8f4a').rect(4, 13, 8, 1, '#1d4522');
    g.mrect(5, 6, 2, 2, K.gold).mdot(6, 7, K.eye).rect(6, 10, 4, 1, '#1d4522');
    g.rect(1, 2, 2, 6, '#2f6a35')
      .rect(13, 2, 2, 6, '#2f6a35')
      .rect(0, 8, 2, 3, '#1d4522')
      .rect(14, 8, 2, 3, '#1d4522');
  },
  dryad: hero({
    body: '#4a7f3f',
    bodyD: '#2a5520',
    legs: '#3f6a35',
    robe: true,
    skin: '#c8d8a0',
    hat: hats.hair('#8a5a2b'),
    weapon: weapons.staff('#f5c518', '#5a3818'),
    extra: (g) => g.rect(3, 0, 2, 2, '#c0392b').rect(11, 0, 2, 2, '#c0392b'),
  }),
  boss_witch: hero({
    body: '#4a2a6a',
    bodyD: '#2a1440',
    legs: '#4a2a6a',
    robe: true,
    skin: '#9fbf7a',
    hat: hats.wizard('#2a1440', '#4a2a6a', K.greenL),
    weapon: weapons.staff(K.greenL, '#3a2a1a'),
    extra: (g) => g.mdot(6, 4, K.greenL),
  }),

  // ---- 6. Алхимическая лаборатория
  homunculus: (g) => {
    g.mrect(5, 4, 3, 4, '#d8c8a8').mrect(5, 8, 3, 4, '#a89878').mrect(6, 12, 2, 3, '#8a7a5a');
    g.mdot(6, 5, K.eye)
      .rect(7, 7, 2, 1, K.redD)
      .rect(6, 2, 4, 2, '#bfe9ff')
      .rect(7, 1, 2, 1, '#bfe9ff');
  },
  acid_slime: blob('#9fd12a', '#d4f05a', '#5f8a10'),
  flask_golem: construct('#7fa8bf', '#4a6f88', K.greenL, (g) => g.rect(6, 1, 4, 2, '#bfe9ff')),
  mutant: (g) => {
    g.mrect(4, 2, 4, 5, ROT)
      .mrect(2, 7, 6, 5, '#5a6a3a')
      .mrect(4, 12, 3, 3, ROT)
      .mrect(0, 6, 2, 6, ROT);
    g.mdot(5, 4, K.gold)
      .rect(6, 6, 4, 1, K.white)
      .mrect(3, 8, 1, 2, '#c0392b')
      .rect(12, 3, 3, 3, ROT);
  },
  plague_doctor: hero({
    body: '#1f1f2a',
    bodyD: '#12121a',
    legs: '#1f1f2a',
    robe: true,
    hat: hats.hood('#1f1f2a', '#12121a'),
    weapon: weapons.staff('#9fd12a', '#3a2a1a'),
    extra: (g) => g.rect(8, 4, 4, 2, '#d8c8a8').mdot(6, 4, K.greenL),
  }),
  boss_alchemist: hero({
    body: '#2f5a7a',
    bodyD: '#1b3548',
    legs: '#2f5a7a',
    robe: true,
    hat: hats.wizard('#1b3548', '#2f5a7a', '#9fd12a'),
    weapon: weapons.staff('#9fd12a'),
    extra: (g) => g.rect(2, 8, 2, 4, '#d4f05a').rect(12, 8, 2, 4, '#ff7a2a'),
  }),

  // ---- 7. Ледяные залы
  frost_wolf: beast('#8fb8d8', '#4a6f8f', K.cyan),
  ice_wraith: ghostly(FROST, FROSTD, K.white),
  snow_troll: (g) => {
    g.mrect(3, 2, 5, 5, '#d8e8f0')
      .mrect(1, 7, 7, 6, '#b0c8d8')
      .mrect(3, 13, 3, 2, '#8fb0c0')
      .mrect(0, 7, 1, 5, '#d8e8f0');
    g.mdot(5, 4, K.eye).mrect(4, 5, 1, 2, K.white).rect(6, 7, 4, 1, '#8fb0c0');
  },
  frozen_knight: (g) => {
    g.mrect(4, 1, 4, 4, FROSTD)
      .mrect(4, 5, 4, 6, '#3f6a8a')
      .mrect(5, 11, 2, 3, FROSTD)
      .mrect(2, 6, 2, 5, FROSTD);
    g.mrect(4, 3, 3, 1, K.eye).mdot(6, 3, K.cyan).rect(7, 0, 2, 2, FROST);
    weapons.bigSword(FROST)(g);
  },
  yeti: (g) => {
    g.mrect(3, 1, 5, 6, K.white)
      .mrect(1, 7, 7, 6, '#e0eef5')
      .mrect(3, 13, 3, 2, '#b0c8d8')
      .mrect(0, 6, 2, 6, K.white);
    g.mdot(5, 3, K.cyan)
      .mrect(4, 5, 1, 2, K.white)
      .rect(6, 6, 4, 1, K.blueD)
      .rect(12, 4, 3, 8, '#b0c8d8');
  },
  boss_ice_queen: hero({
    body: '#5fa8d8',
    bodyD: '#2f6a9a',
    legs: '#5fa8d8',
    robe: true,
    skin: '#e0f0ff',
    hat: hats.crown(),
    weapon: weapons.staff(FROST, '#2f6a9a'),
    extra: (g) => g.mdot(6, 4, K.cyan).mrect(3, 7, 2, 6, FROST),
  }),

  // ---- 8. Кузня демонов
  imp: (g) => {
    g.mrect(5, 3, 3, 4, K.redL)
      .mrect(4, 7, 4, 4, K.red)
      .mrect(5, 11, 2, 3, K.redD)
      .mrect(0, 4, 4, 4, K.redD);
    g.rect(4, 1, 1, 2, K.bone)
      .rect(11, 1, 1, 2, K.bone)
      .mdot(6, 4, K.gold)
      .rect(7, 6, 2, 1, K.white)
      .rect(12, 12, 2, 2, K.red)
      .dot(14, 13, K.redD);
  },
  hellhound: beast(MAGMAD, '#4a1400', MAGMA, (g) =>
    g.rect(9, 1, 1, 2, MAGMA).rect(13, 1, 1, 2, MAGMA),
  ),
  magma_golem: construct('#5a3020', '#3a1a0d', MAGMA),
  demon_smith: demonish('#8f3020', '#5a1a10', K.bone, K.gold, (g) => weapons.axe(MAGMA)(g)),
  brimstone_brute: (g) => {
    g.mrect(3, 2, 5, 5, '#8a5a2f')
      .mrect(1, 7, 7, 6, '#6a3a1f')
      .mrect(3, 13, 3, 2, '#4a2410')
      .mrect(0, 6, 2, 6, '#8a5a2f');
    g.mdot(5, 3, MAGMA)
      .rect(6, 6, 4, 1, K.white)
      .mrect(2, 8, 2, 2, MAGMA)
      .rect(3, 0, 1, 3, K.bone)
      .rect(12, 0, 1, 3, K.bone);
  },
  boss_forge_demon: demonish('#c0392b', '#6a1a10', K.gold, K.gold, (g) => {
    g.mrect(1, 7, 2, 5, MAGMA).rect(12, 2, 3, 10, MAGMAD).rect(11, 0, 5, 3, MAGMA);
  }),

  // ---- 9. Библиотека проклятых
  cursed_tome: (g) => {
    g.rect(3, 4, 10, 9, '#5a2a6a').rect(3, 4, 10, 1, '#7f4a9a').rect(3, 12, 10, 1, '#3a1546');
    g.rect(7, 4, 2, 9, '#2a0f33').rect(4, 6, 3, 3, K.white).rect(9, 6, 3, 3, K.white);
    g.mrect(5, 7, 1, 1, K.eye).rect(6, 10, 4, 1, K.purpleL);
  },
  shadow: ghostly('#2a2438', '#15121f', K.purpleL),
  gargoyle: (g) => {
    g.mrect(4, 3, 4, 4, '#6f7b8c').mrect(3, 7, 5, 5, '#5a6473').mrect(4, 12, 3, 3, '#6f7b8c');
    g.mrect(0, 2, 3, 6, '#4a525e').mdot(6, 4, K.gold).rect(7, 6, 2, 1, K.white);
    g.rect(4, 1, 1, 2, '#9aa0aa').rect(11, 1, 1, 2, '#9aa0aa');
  },
  lich_scribe: skeleton('#cfe0cf', '#8fa88f', (g) => {
    g.mrect(3, 6, 2, 8, '#2a4a6a');
    weapons.skullStaff()(g);
    g.mdot(6, 4, K.greenL);
  }),
  archivist: hero({
    body: '#3a2a5a',
    bodyD: '#1f1436',
    legs: '#3a2a5a',
    robe: true,
    skin: '#cfe0cf',
    hat: hats.hood('#1f1436', '#3a2a5a'),
    weapon: weapons.skullStaff(),
    extra: (g) => g.mdot(6, 4, K.purpleL).rect(2, 8, 3, 4, '#5a2a6a'),
  }),
  boss_lich: skeleton('#dfe8df', '#9fb89f', (g) => {
    g.mrect(2, 6, 2, 9, '#2a1a4a');
    hats.crown()(g);
    weapons.skullStaff()(g);
    g.mdot(6, 4, K.cyan).rect(7, 7, 2, 4, '#2a1a4a');
  }),

  // ---- 10. Вершина башни
  tower_guard: (g) => {
    g.mrect(4, 1, 4, 4, K.steelD)
      .mrect(3, 5, 5, 6, K.iron)
      .mrect(5, 11, 2, 3, K.steelD)
      .mrect(1, 6, 2, 5, K.steel);
    g.mrect(4, 3, 3, 1, K.eye).mdot(6, 3, K.gold).rect(7, 0, 2, 2, K.gold);
    weapons.shield(K.gold, K.steelL)(g);
    weapons.sword(K.steelL)(g);
  },
  soul_eater: (g) => {
    g.mrect(4, 2, 4, 5, '#3a1f4a')
      .mrect(3, 7, 5, 6, '#24122f')
      .rect(3, 13, 2, 2, '#3a1f4a')
      .rect(7, 13, 2, 2, '#3a1f4a')
      .rect(11, 13, 2, 2, '#3a1f4a');
    g.mrect(5, 3, 2, 2, K.eye)
      .mdot(6, 3, K.purpleL)
      .rect(6, 6, 4, 1, K.white)
      .mrect(1, 5, 2, 5, '#24122f');
  },
  golem: construct(K.gray, K.grayD, K.orange),
  dark_knight: (g) => {
    g.mrect(4, 1, 4, 4, K.iron)
      .mrect(4, 5, 4, 6, K.black)
      .mrect(5, 11, 2, 3, K.iron)
      .mrect(2, 6, 2, 5, K.iron);
    g.mrect(4, 3, 3, 1, K.eye)
      .mdot(6, 3, K.redL)
      .rect(7, 0, 2, 2, K.redD)
      .mrect(3, 5, 1, 2, K.redD);
    weapons.bigSword(K.grayD)(g);
  },
  void_herald: ghostly('#1f1a33', '#0f0c1c', '#7f5fff', (g) => {
    g.rect(3, 0, 1, 3, K.purpleL).rect(12, 0, 1, 3, K.purpleL).mrect(1, 6, 2, 4, '#3a2a6a');
  }),
  boss_demon: (g) => {
    g.mrect(4, 2, 4, 5, K.redD)
      .mrect(3, 7, 5, 5, K.red)
      .mrect(4, 12, 3, 3, K.redD)
      .mrect(0, 3, 3, 6, K.black)
      .mrect(1, 7, 2, 4, K.redL);
    g.rect(3, 0, 1, 3, K.bone)
      .rect(12, 0, 1, 3, K.bone)
      .mrect(5, 4, 2, 1, K.gold)
      .mdot(5, 5, K.orange)
      .rect(6, 6, 4, 1, K.white);
    g.rect(13, 8, 2, 6, K.orange).rect(12, 7, 4, 1, K.gold);
  },
};

// ------------------------------------------------------------------ предметы

export const ITEM_ART: Record<string, Draw> = {
  // карта перехода на следующий этаж: арка с лестницей и светом за ней
  exit: (g) => {
    g.rect(2, 2, 12, 12, K.grayD).rect(3, 3, 10, 11, K.gray);
    g.rect(4, 5, 8, 9, K.black);
    g.rect(5, 4, 6, 1, K.gray).rect(6, 3, 4, 1, K.gray);
    g.rect(5, 6, 6, 2, K.gold).rect(5, 8, 6, 1, K.goldD);
    g.rect(6, 9, 4, 2, K.gold).rect(6, 11, 4, 1, K.goldD);
    g.rect(7, 12, 2, 2, K.gold);
    g.dot(4, 2, K.goldD).dot(11, 2, K.goldD);
  },
  chest: (g) => {
    g.rect(2, 6, 12, 8, K.brown)
      .rect(2, 6, 12, 2, K.brownL)
      .rect(2, 9, 12, 1, K.brownD)
      .rect(2, 13, 12, 1, K.brownD);
    g.rect(2, 6, 2, 8, K.iron)
      .rect(12, 6, 2, 8, K.iron)
      .rect(7, 8, 2, 3, K.gold)
      .dot(8, 9, K.brownD)
      .rect(3, 4, 10, 2, K.brownL)
      .rect(4, 3, 8, 1, K.brown);
  },
  gold: (g) => {
    g.rect(4, 11, 8, 3, K.gold)
      .rect(3, 12, 10, 1, K.gold)
      .rect(4, 13, 8, 1, K.goldD)
      .rect(5, 8, 6, 3, K.gold)
      .rect(6, 5, 4, 3, K.gold)
      .rect(5, 5, 1, 1, K.white)
      .rect(6, 8, 1, 1, K.white);
    g.rect(6, 6, 1, 1, K.goldD).rect(9, 9, 2, 1, K.goldD).rect(7, 12, 3, 1, K.goldD);
  },
  potion_heal: (g) => {
    g.rect(6, 2, 4, 2, K.brownL)
      .rect(7, 4, 2, 2, K.white)
      .rect(4, 6, 8, 7, K.redL)
      .rect(5, 13, 6, 1, K.red)
      .rect(5, 7, 2, 4, K.white)
      .rect(10, 8, 1, 4, K.redD);
    g.rect(4, 6, 1, 7, K.red).rect(11, 6, 1, 7, K.red);
  },
  potion_regen: (g) => {
    g.rect(6, 2, 4, 2, K.brownL)
      .rect(7, 4, 2, 2, K.white)
      .rect(4, 6, 8, 7, K.blueL)
      .rect(5, 13, 6, 1, K.blue)
      .rect(5, 7, 2, 4, K.white)
      .rect(10, 8, 1, 4, K.blueD);
    g.rect(4, 6, 1, 7, K.blue).rect(11, 6, 1, 7, K.blue);
  },
  artifact: (g) => {
    g.rect(6, 3, 4, 1, K.purpleL)
      .rect(5, 4, 6, 6, K.purple)
      .rect(6, 10, 4, 1, K.purpleD)
      .rect(6, 5, 2, 2, K.white)
      .rect(9, 8, 1, 1, K.purpleL);
    g.rect(5, 11, 6, 1, K.goldD).rect(4, 12, 8, 2, K.gold).rect(3, 14, 10, 1, K.goldD);
  },
  coin: (g) => {
    g.rect(4, 3, 8, 10, K.gold)
      .rect(3, 4, 10, 8, K.gold)
      .rect(6, 5, 4, 6, K.goldD)
      .rect(7, 6, 2, 4, K.gold)
      .rect(4, 4, 2, 1, K.white);
  },
  pouch: (g) => {
    g.rect(6, 2, 4, 2, K.brownL)
      .rect(4, 4, 8, 1, K.gold)
      .rect(3, 5, 10, 8, '#a8742e')
      .rect(4, 5, 8, 1, '#c28a3d');
    g.rect(3, 11, 10, 2, '#7a4f1c')
      .rect(4, 6, 2, 4, '#c9924a')
      .rect(7, 7, 2, 4, K.gold)
      .rect(6, 8, 4, 2, K.gold)
      .rect(2, 8, 1, 3, '#a8742e')
      .rect(13, 8, 1, 3, '#a8742e');
  },
  soul: (g) => {
    g.rect(7, 1, 2, 2, K.purpleL)
      .rect(6, 3, 4, 2, K.purpleL)
      .rect(5, 5, 6, 4, K.purple)
      .rect(4, 9, 8, 2, K.purple)
      .rect(5, 11, 2, 2, K.purpleD)
      .rect(9, 11, 2, 2, K.purpleD);
    g.mdot(6, 6, K.white).mdot(6, 7, K.eye);
  },
};

const TIER_METAL = [
  '#8a6a4a',
  '#b8c0cc',
  '#6f7b8c',
  '#eef2f8',
  '#f5c518',
  '#5be6ff',
  '#ff8a3d',
  '#c08bff',
];
const TIER_ACCENT = [
  '#5a3818',
  '#7d8794',
  '#3b4350',
  '#b7c4d8',
  '#a07d05',
  '#1fa88f',
  '#a8410c',
  '#5c2f9e',
];

/** Иконки оружия по ветке класса и тиру (1..6). */
export const weaponArt =
  (lineage: string, tier: number): Draw =>
  (g) => {
    const m = TIER_METAL[tier - 1];
    const a = TIER_ACCENT[tier - 1];
    if (lineage === 'warrior') {
      if (tier === 3) {
        g.rect(7, 2, 2, 12, K.brown)
          .rect(9, 2, 5, 5, m)
          .rect(9, 3, 4, 3, a)
          .rect(3, 3, 4, 3, m)
          .rect(4, 4, 2, 1, a);
      } else {
        g.rect(7, 1, 2, 9, m)
          .rect(7, 1, 1, 9, a)
          .rect(4, 10, 8, 2, K.brownD)
          .rect(7, 12, 2, 3, K.brown)
          .dot(8, 0, m);
        if (tier >= 4) g.rect(6, 2, 4, 6, m).rect(7, 3, 2, 4, a);
      }
    } else if (lineage === 'mage') {
      g.rect(7, 4, 2, 11, K.brown)
        .rect(6, 1, 4, 4, m)
        .rect(7, 2, 2, 2, K.white)
        .rect(5, 5, 6, 1, a);
      if (tier >= 4) g.rect(4, 0, 1, 3, m).rect(11, 0, 1, 3, m);
    } else if (lineage === 'archer') {
      g.rect(11, 1, 2, 2, K.brown)
        .rect(12, 3, 2, 10, K.brown)
        .rect(11, 13, 2, 2, K.brown)
        .rect(11, 3, 1, 10, '#e8e8ee');
      g.rect(3, 7, 8, 1, a).rect(2, 6, 2, 3, m).dot(1, 7, m);
    } else {
      g.rect(7, 1, 2, 8, m)
        .rect(7, 1, 1, 8, a)
        .rect(5, 9, 6, 1, K.brownD)
        .rect(7, 10, 2, 4, K.brown);
      if (tier >= 4) g.rect(3, 4, 1, 6, m).rect(12, 4, 1, 6, m);
    }
  };

export const armorArt =
  (tier: number): Draw =>
  (g) => {
    const m = [
      '#a3865f',
      '#8a5a2b',
      '#b8c0cc',
      '#eef2f8',
      '#f5c518',
      '#5be6ff',
      '#ff8a3d',
      '#c08bff',
    ][tier - 1];
    const a = [
      '#6b5236',
      '#5a3818',
      '#7d8794',
      '#b7c4d8',
      '#a07d05',
      '#1fa88f',
      '#a8410c',
      '#5c2f9e',
    ][tier - 1];
    g.rect(4, 3, 8, 10, m)
      .rect(2, 3, 3, 4, a)
      .rect(11, 3, 3, 4, a)
      .rect(6, 3, 4, 2, K.black)
      .rect(5, 7, 6, 1, a)
      .rect(5, 10, 6, 1, a)
      .rect(7, 5, 2, 8, a);
    if (tier >= 4) g.rect(2, 2, 3, 1, m).rect(11, 2, 3, 1, m).rect(7, 8, 2, 2, K.gold);
  };

export const PIXEL_SCALE = 6;
