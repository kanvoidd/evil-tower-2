/** Что написать об узле в нижней панели. */
export interface NodeInfo {
  title: string;
  sub: string;
  desc: string;
  /** Плитка узла. */
  tex: string;
  /** Значок поверх плитки (путь таланта). */
  iconKey?: string;
}
