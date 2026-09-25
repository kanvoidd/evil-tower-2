/**
 * Процедурная графика — сменный блок: заглушки рисуются здесь и заменяются картинками по ключу
 * (`queueExternalArt`). Остальной код знает только ключи текстур (`ART_KEY_FAMILIES`), размеры
 * и палитра — в теме (`presentation/theme`).
 */
export { ART_KEY_FAMILIES, contentArtKeys } from './artKeys';
export { bakeTextures, queueExternalArt } from './Textures';
