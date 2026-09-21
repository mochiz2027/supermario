/**
 * main.ts — 게임 진입점
 * Canvas 요소를 가져와 Game 인스턴스를 생성하고 루프를 시작합니다.
 */

import { Game } from './core/Game';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;

if (!canvas) {
  throw new Error('#game-canvas 요소를 찾을 수 없습니다.');
}

const game = new Game(canvas);
game.start();
