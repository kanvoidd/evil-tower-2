import { ArmoryFloor } from './armory-floor/ArmoryFloor';
import { CatacombsFloor } from './catacombs-floor/CatacombsFloor';
import { CryptFloor } from './crypt-floor/CryptFloor';
import { FloodedFloor } from './flooded-floor/FloodedFloor';
import type { FloorFactory } from './floor-factory/FloorFactory';
import { ForgeFloor } from './forge-floor/ForgeFloor';
import { FrostFloor } from './frost-floor/FrostFloor';
import { GardenFloor } from './garden-floor/GardenFloor';
import { LabFloor } from './lab-floor/LabFloor';
import { LibraryFloor } from './library-floor/LibraryFloor';
import { SummitFloor } from './summit-floor/SummitFloor';

/**
 * Все конкретные фабрики этажей, снизу вверх. Номер этажа фабрики совпадает с местом в списке.
 */
export const FLOOR_FACTORIES: readonly FloorFactory[] = [
  new CryptFloor(),
  new CatacombsFloor(),
  new FloodedFloor(),
  new ArmoryFloor(),
  new GardenFloor(),
  new LabFloor(),
  new FrostFloor(),
  new ForgeFloor(),
  new LibraryFloor(),
  new SummitFloor(),
];

export const FLOORS = FLOOR_FACTORIES.length;

/** Оформление этажа: используется для иконок и фона. */
export const FLOOR_ICON_KIND: Record<number, string> = Object.fromEntries(
  FLOOR_FACTORIES.map((f) => [f.floor, f.theme]),
);
