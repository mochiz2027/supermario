/**
 * Level1_2 — 슈퍼마리오 1-2 지하 동굴 스테이지
 * - 어두운 지하 배경, 푸른색 지하 벽돌 및 천장 구조
 * - 파이프 미로와 코인 보너스 구역, 굼바 무리
 * - 깃발 거리를 단축하여 빠르고 박진감 넘치는 클리어 지원
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

export const LEVEL1_2_COLS = 95;
export const LEVEL1_2_ROWS = 15;

export function getLevel1_2(): LevelConfig {
  const map: TileType[][] = [];
  for (let r = 0; r < LEVEL1_2_ROWS; r++) {
    map.push(new Array<TileType>(LEVEL1_2_COLS).fill(E));
  }

  // 천장 (row 0, 1) — 지하 동굴 (col 0 ~ 66)
  for (let c = 0; c <= 66; c++) {
    map[0]![c] = B;
    map[1]![c] = B;
  }

  // 바닥 (row 13, 14) — 2칸 구멍(col 36~37) 1개
  const groundSegments: [number, number][] = [
    [0, 36],
    [38, 95],
  ];
  for (const [start, end] of groundSegments) {
    for (let c = start; c < end; c++) {
      map[13]![c] = G;
      map[14]![c] = G;
    }
  }

  // 구간 1: 진입 계단 플랫폼 (col 10~15, row 9)
  for (let c = 10; c <= 15; c++) {
    map[9]![c] = B;
  }
  map[9]![12] = Q; // 버섯/코인 블록

  // 파이프 1 (col 20~21, 2단)
  map[11]![20] = PT; map[11]![21] = PT;
  map[12]![20] = PB; map[12]![21] = PB;

  // 구간 2: 코인 보너스 플랫폼 (col 26~32, row 9 및 row 5)
  for (let c = 26; c <= 32; c++) {
    map[9]![c] = B;
  }
  map[9]![28] = Q;
  map[9]![30] = Q;

  for (let c = 28; c <= 31; c++) {
    map[5]![c] = B;
  }
  map[5]![29] = Q;

  // 파이프 2 (col 34~35, 3단)
  map[10]![34] = PT; map[10]![35] = PT;
  map[11]![34] = PB; map[11]![35] = PB;
  map[12]![34] = PB; map[12]![35] = PB;

  // 구멍 건너기 징검다리 (col 37, row 10)
  map[10]![37] = B;

  // 구간 3: 공중 블록 다리 (col 42~48, row 9)
  for (let c = 42; c <= 48; c++) {
    map[9]![c] = B;
  }
  map[9]![44] = Q;
  map[9]![46] = Q;

  // 파이프 3 (col 50~51, 2단)
  map[11]![50] = PT; map[11]![51] = PT;
  map[12]![50] = PB; map[12]![51] = PB;

  // 구간 4: 거대 탈출 파이프 (col 56~57, 4단)
  map[9]![56] = PT;  map[9]![57] = PT;
  map[10]![56] = PB; map[10]![57] = PB;
  map[11]![56] = PB; map[11]![57] = PB;
  map[12]![56] = PB; map[12]![57] = PB;

  // 지상으로 나오는 탈출 계단 (col 62~67)
  for (let s = 0; s < 6; s++) {
    const col = 62 + s;
    for (let h = 0; h <= s; h++) {
      map[12 - h]![col] = B;
    }
  }

  // 깃대 (col 76, row 3~12)
  for (let r = 3; r <= 12; r++) {
    map[r]![76] = F;
  }

  // 성채 (col 81~85, row 12)
  buildCastle(map, 81, 12);

  return {
    name: 'Stage 1-2',
    worldName: '1-2',
    theme: 'underground',
    skyGradient: ['#000000', '#0a0a18', '#101428'], // 지하 동굴
    map,
    goombas: [
      [16 * 16, 12 * 16],
      [24 * 16, 12 * 16],
      [31 * 16, 12 * 16],
      [44 * 16, 12 * 16],
      [53 * 16, 12 * 16],
      [60 * 16, 12 * 16],
    ],
    flagpoleCol: 76,
  };
}
