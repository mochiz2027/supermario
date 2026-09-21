/**
 * Level1_2 — 슈퍼마리오 1-2 지하 동굴 스테이지
 * - 어두운 지하 배경, 푸른색 지하 벽돌 및 천장 구조
 * - 깃발 잡는 거리를 대폭 가깝게 단축 (col 40 위치)
 */

import { TileType } from '../physics/Collision';
import { LevelConfig, buildCastle } from './LevelData';

const E = TileType.EMPTY;
const G = TileType.GROUND_BLUE;
const B = TileType.BRICK_BLUE;
const Q = TileType.QUESTION;
const PT = TileType.PIPE_TOP;
const PB = TileType.PIPE_BODY;
const F = TileType.FLAGPOLE;

export const LEVEL1_2_COLS = 55;
export const LEVEL1_2_ROWS = 15;

export function getLevel1_2(): LevelConfig {
  const map: TileType[][] = [];
  for (let r = 0; r < LEVEL1_2_ROWS; r++) {
    map.push(new Array<TileType>(LEVEL1_2_COLS).fill(E));
  }

  // 천장 (row 0, 1) — 지하 동굴 (col 0 ~ 30)
  for (let c = 0; c <= 30; c++) {
    map[0]![c] = B;
    map[1]![c] = B;
  }

  // 바닥 (row 13, 14)
  const groundSegments: [number, number][] = [
    [0, 19],
    [22, 55],
  ];
  for (const [start, end] of groundSegments) {
    for (let c = start; c < end; c++) {
      map[13]![c] = G;
      map[14]![c] = G;
    }
  }

  // 구간 1: 진입 물음표 블록 및 플랫폼 (col 8~12, row 9)
  for (let c = 8; c <= 12; c++) {
    map[9]![c] = B;
  }
  map[9]![10] = Q;

  // 파이프 1 (col 15~16, 2단)
  map[11]![15] = PT; map[11]![16] = PT;
  map[12]![15] = PB; map[12]![16] = PB;

  // 구멍 건너기 징검다리 (col 20~21, row 11)
  map[11]![20] = B;
  map[11]![21] = B;

  // 탈출 파이프 (col 25~26, 3단)
  map[10]![25] = PT; map[10]![26] = PT;
  map[11]![25] = PB; map[11]![26] = PB;
  map[12]![25] = PB; map[12]![26] = PB;

  // 지상으로 나오는 탈출 계단 (col 30~34)
  for (let s = 0; s < 5; s++) {
    const col = 30 + s;
    for (let h = 0; h <= s; h++) {
      map[12 - h]![col] = B;
    }
  }

  // 깃대 (col 40, row 3~12)
  for (let r = 3; r <= 12; r++) {
    map[r]![40] = F;
  }

  // 성채 (col 45~49, row 12)
  buildCastle(map, 45, 12);

  return {
    name: 'Stage 1-2',
    worldName: '1-2',
    theme: 'underground',
    skyGradient: ['#000000', '#0a0a18', '#101428'], // 지하 동굴
    map,
    goombas: [
      [13 * 16, 12 * 16],
      [18 * 16, 12 * 16],
      [28 * 16, 12 * 16],
    ],
    flagpoleCol: 40,
  };
}
