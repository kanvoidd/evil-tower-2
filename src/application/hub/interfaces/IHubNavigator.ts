import type { HubMenu } from './HubMenu';

/** Уход из хаба: в меню или в новый забег. */
export interface IHubNavigator {
  open(menu: HubMenu): void;
  play(): void;
}
