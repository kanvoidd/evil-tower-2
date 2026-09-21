import Phaser from 'phaser';
import '@fontsource/alegreya-sc/cyrillic-800.css';
import '@fontsource/alegreya-sc/latin-800.css';
import '@fontsource/nunito/cyrillic-700.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/cyrillic-800.css';
import '@fontsource/nunito/latin-800.css';
import '@fontsource/nunito/cyrillic-900.css';
import '@fontsource/nunito/latin-900.css';
import { GAME_H, GAME_W } from './config';
import { YSDK } from './sdk/YandexSDK';
import { AUDIO } from './systems/Audio';
import { BootScene } from './scenes/BootScene';
import { ClassSelectScene } from './scenes/ClassSelectScene';
import { HubScene } from './scenes/HubScene';
import { ShopScene } from './scenes/ShopScene';
import { LevelsScene } from './scenes/LevelsScene';
import { SettingsScene } from './scenes/SettingsScene';
import { SkillTreeScene } from './scenes/SkillTreeScene';
import { GameScene } from './scenes/GameScene';
import { AchievementsScene } from './scenes/AchievementsScene';

// Модерация Яндекс Игр: без контекстного меню и выделения текста.
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('selectstart', (e) => e.preventDefault());

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#0d0f14',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  render: { antialias: true, powerPreference: 'high-performance' },
  input: { activePointers: 2 },
  scene: [
    BootScene, ClassSelectScene, HubScene, ShopScene, LevelsScene, SettingsScene, SkillTreeScene, GameScene,
    AchievementsScene,
  ],
});

// Пауза игры и звука на время рекламы/сворачивания.
YSDK.onGamePause(() => {
  AUDIO.suspend('ad');
  game.pause();
});
YSDK.onGameResume(() => {
  AUDIO.unsuspend('ad');
  game.resume();
});

// Отладочный доступ к игре — только в режиме разработки.
if (import.meta.env.DEV) (window as any).__game = game;
