/**
 * Level1_2 — 슈퍼마리오 1-2 지하 동굴 스테이지
 * - 어두운 지하 배경, 푸른색 지하 벽돌 및 천장 구조
 * - 파이프 미로와 코인 보너스 구역, 굼바 무리
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

export const LEVEL1_2_COLS = 190;
export const LEVEL1_2_ROWS = 15;

export function getLevel1_2(): LevelConfig {
  const map: TileType[][] = [];
  for (let r = 0; r < LEVEL1_2_ROWS; r++) {
    map.push(new Array<TileType>(LEVEL1_2_COLS).fill(E));
  }

  // 천장 (row 0, 1) — 지하 동굴의 상징
  for (let c = 0; c < 165; c++) {
    map[0]![c] = B;
    map[1]![c] = B;
  }

  // 바닥 (row 13, 14) — 구멍 2개 포함
  const groundSegments: [number, number][] = [
    [0, 50],
    [53, 95],
    [98, 190],
  ];
  for (const [start, end] of groundSegments) {
    for (let c = start; c < end; c++) {
      map[13]![c] = G;
      map[14]![c] = G;
    }
  }

  // 물음표 블록 및 벽돌 플랫폼들
  // 구간 1: 진입 계단 플랫폼
  for (let c = 12; c <= 18; c++) {
    map[9]![c] = B;
  }
  map[9]![14] = Q;
  map[9]![16] = Q;

  // 파이프 1 (col 24~25, 2단)
  map[11]![24] = PT; map[11]![25] = PT;
  map[12]![24] = PB; map[12]![25] = PB;

  // 구간 2: 코인 대량 플랫폼 (row 6, 9)
  for (let c = 32; c <= 42; c++) {
    map[9]![c] = B;
  }
  map[9]![34] = Q;
  map[9]![37] = Q;
  map[9]![40] = Q;

  for (let c = 35; c <= 39; c++) {
    map[5]![c] = B;
  }
  map[5]![37] = Q;

  // 파이프 2 (col 47~48, 3단)
  map[10]![47] = PT; map[10]![48] = PT;
  map[11]![47] = PB; map[11]![48] = PB;
  map[12]![47] = PB; map[12]![48] = PB;

  // 파이프 디딤돌
  map[12]![45] = B;
  map[12]![46] = B;

  // 구간 3: 구멍 건너기 징검다리
  map[10]![51] = B;
  map[9]![52] = B;

  // 구간 4: 파이프 연속 장애물 (col 65~66 2단, col 74~75 3단)
  map[11]![65] = PT; map[11]![66] = PT;
  map[12]![65] = PB; map[12]![66] = PB;

  map[12]![72] = B;
  map[12]![73] = B;
  map[10]![74] = PT; map[10]![75] = PT;
  map[11]![74] = PB; map[11]![75] = PB;
  map[12]![74] = PB; map[12]![75] = PB;

  // 구간 5: 공중 블록 다리 (col 80~92)
  for (let c = 80; c <= 92; c++) {
    map[9]![c] = B;
  }
  map[9]![83] = Q;
  map[9]![86] = Q;
  map[9]![89] = Q;

  // 징검다리 2 (구멍 95~98 건너기)
  map[10]![96] = B;
  map[10]![97] = B;

  // 구간 6: 거대 파이프 탈출구 (col 110~111, 4단)
  map[12]![107] = B;
  map[12]![108] = B; map[11]![108] = Q;
  map[12]![109] = B; map[11]![109] = B;

  map[9]![110] = PT;  map[9]![111] = PT;
  map[10]![110] = PB; map[10]![111] = PB;
  map[11]![110] = PB; map[11]![111] = PB;
  map[12]![110] = PB; map[12]![111] = PB;

  // 지상으로 나오는 탈출 계단
  for (let s = 0; s < 6; s++) {
    const col = 145 + s;
    for (let h = 0; h <= s; h++) {
      map[12 - h]![col] = B;
    }
  }

  // 깃대 (col 168, row 3~12)
  for (let r = 3; r <= 12; r++) {
    map[r]![168] = F;
  }

  // 성채 (col 173~177)
  buildCastle(map, 173, 12);

  return {
    name: 'Stage 1-2',
    worldName: '1-2',
    theme: 'underground',
    skyGradient: ['#000000', '#0a0a18', '#101428'], // 칠흑의 지하 동굴
    map,
    goombas: [
      [20 * 16, 12 * 16],
      [36 * 16, 12 * 16],
      [44 * 16, 12 * 16],
      [60 * 16, 12 * 16],
      [70 * 16, 12 * 16],
      [85 * 16, 12 * 16],
      [104 * 16, 12 * 16],
      [125 * 16, 12 * 16],
      [135 * 16, 12 * 16],
      [155 * 16, 12 * 16],
    ],
    flagpoleCol: 168,
  };
}
