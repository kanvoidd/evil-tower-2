import { FLOOR_FACTORIES } from '../floors/floorRegistry';
import { FloorFactory } from '../floors/floor-factory/FloorFactory';
import type { RoomDef } from './interfaces/RoomDef';

export const ROOMS_PER_FLOOR = FloorFactory.ROOMS_PER_FLOOR;

/**
 * Комнаты выпускают фабрики этажей (src/data/floors): каждая знает свой этаж, его врагов
 * и то, как из них собрать пул комнаты.
 */
export const ROOMS: RoomDef[] = FLOOR_FACTORIES.flatMap((f, i) => f.createRooms(FLOOR_FACTORIES[i - 1] ?? null));

export const ROOM_BY_ID: Record<string, RoomDef> = Object.fromEntries(ROOMS.map((r) => [r.id, r]));

export const roomIndexOf = (id: string): number => ROOMS.findIndex((r) => r.id === id);
