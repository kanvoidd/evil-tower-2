/** Можно ли применить способность прямо сейчас, а если нет — почему. */
export interface PerkReadiness {
  ok: boolean;
  reason?: 'resource' | 'once' | 'gold' | 'targets' | 'active' | 'cooldown';
}
