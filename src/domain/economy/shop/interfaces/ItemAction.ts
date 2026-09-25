/**
 * Что лавка может сделать с вещью для героя: buy — купить; repair — починить надетую;
 * equipped — надета и цела; weaker — у героя уже вещь не хуже, эта не нужна.
 */
export type ItemAction = 'buy' | 'repair' | 'equipped' | 'weaker';
