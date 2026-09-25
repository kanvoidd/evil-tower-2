/** Разброс содержимого комнаты по её номеру на этаже: [минимум, максимум]. */
export interface RoomShape {
  count: [number, number];
  gold: [number, number];
  chests: [number, number];
  heal: [number, number];
  regen: [number, number];
}
