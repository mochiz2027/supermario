/**
 * Level1_3 — 슈퍼마리오 1-3 고공 플랫폼 애슬레틱 스테이지
 * - 하늘 높이 솟은 플랫폼과 낭떠러지 징검다리 점프 액션
 * - 정밀한 점프 컨트롤과 공중 코인 수집
 */

import { TileType } from '../physics/Collision';
import { LevelConfig, buildCastle } from './LevelData';

const E = TileType.EMPTY;
const G = TileType.GROUND;
const B = TileType.BRICK;
const Q = TileType.QUESTION;
const F = TileType.FLAGPOLE;

export const LEVEL1_3_COLS = 195;
export const LEVEL1_3_ROWS = 15;

export function getLevel1_3(): LevelConfig {
  const map: TileType[][] = [];
  for (let r = 0; r < LEVEL1_3_ROWS; r++) {
    map.push(new Array<TileType>(LEVEL1_3_COLS).fill(E));
  }

  // 시작 안전 대지 (col 0~25)
  for (let c = 0; c <= 25; c++) {
    map[13]![c] = G;
    map[14]![c] = G;
  }

  // 구간 1: 첫 번째 공중 발판들 (row 10, 8, 6)
  for (let c = 15; c <= 20; c++) {
    map[10]![c] = B;
  }
  map[10]![17] = Q;

  // 낭떠러지 1: 공중 나무 발판 (col 28~33, row 10)
  for (let c = 28; c <= 33; c++) {
    map[10]![c] = B;
  }
  map[10]![30] = Q;

  // 공중 발판 2 (col 37~42, row 8)
  for (let c = 37; c <= 42; c++) {
    map[8]![c] = B;
  }
  map[8]![39] = Q;

  // 중간 섬 (col 46~60, 지면)
  for (let c = 46; c <= 60; c++) {
    map[13]![c] = G;
    map[14]![c] = G;
  }
  map[10]![50] = B; map[10]![51] = Q; map[10]![52] = B;

  // 낭떠러지 2: 연속 징검다리 (col 64, 69, 74, 79)
  for (let c = 64; c <= 67; c++) map[11]![c] = B;
  for (let c = 70; c <= 73; c++) map[9]![c] = B;
  map[9]![71] = Q;
  for (let c = 76; c <= 79; c++) map[7]![c] = B;

  // 높은 구름 다리 (col 83~95, row 6)
  for (let c = 83; c <= 95; c++) {
    map[6]![c] = B;
  }
  map[6]![86] = Q;
  map[6]![92] = Q;

  // 안전 지상 대지 2 (col 98~115)
  for (let c = 98; c <= 115; c++) {
    map[13]![c] = G;
    map[14]![c] = G;
  }
  map[10]![102] = B; map[10]![103] = Q; map[10]![104] = B;

  // 낭떠러지 3: 하강 계단형 공중 다리 (col 120~145)
  for (let c = 120; c <= 124; c++) map[8]![c] = B;
  for (let c = 128; c <= 132; c++) map[9]![c] = B;
  map[9]![130] = Q;
  for (let c = 136; c <= 140; c++) map[10]![c] = B;

  // 최종 착지 지상 대지 (col 146~195)
  for (let c = 146; c < LEVEL1_3_COLS; c++) {
    map[13]![c] = G;
    map[14]![c] = G;
  }

  // 최종 8단 계단
  for (let s = 0; s < 8; s++) {
    const col = 158 + s;
    for (let h = 0; h <= s; h++) {
      map[12 - h]![col] = B;
    }
  }

  // 깃대 (col 170, row 3~12)
  for (let r = 3; r <= 12; r++) {
    map[r]![170] = F;
  }

  // 성채 (col 175~179)
  buildCastle(map, 175, 12);

  return {
    name: 'Stage 1-3',
    worldName: '1-3',
    theme: 'athletic',
    skyGradient: ['#3898f8', '#68c0fc', '#b0e8fc'], // 화사한 고공 청명 하늘
    map,
    goombas: [
      [18 * 16, 9 * 16],
      [48 * 16, 12 * 16],
      [54 * 16, 12 * 16],
      [88 * 16, 5 * 16],
      [105 * 16, 12 * 16],
      [110 * 16, 12 * 16],
      [148 * 16, 12 * 16],
      [152 * 16, 12 * 16],
    ],
    flagpoleCol: 170,
  };
}
