import { FloorCurveScaling } from './floor-curve/FloorCurveScaling';
import type { IFloorScaling } from './interfaces/IFloorScaling';

/** Рост башни, по которому играет игра. */
export const FLOOR_SCALING: IFloorScaling = new FloorCurveScaling();
