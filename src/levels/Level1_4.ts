/**
 * Level1_4 — 슈퍼마리오 1-4 쿠파 성채 스테이지
 * - 붉은 용암과 성벽 브릭으로 둘러싸인 긴장감 넘치는 성채 코스
 * - 좁은 통로, 용암 함정, 다수의 굼바 방어선
 */

import { TileType } from '../physics/Collision';
import { LevelConfig, buildCastle } from './LevelData';

const E = TileType.EMPTY;
const CB = TileType.CASTLE_BRICK;
const Q = TileType.QUESTION;
const F = TileType.FLAGPOLE;

export const LEVEL1_4_COLS = 190;
export const LEVEL1_4_ROWS = 15;

export function getLevel1_4(): LevelConfig {
  const map: TileType[][] = [];
  for (let r = 0; r < LEVEL1_4_ROWS; r++) {
    map.push(new Array<TileType>(LEVEL1_4_COLS).fill(E));
  }

  // 성채 천장 (row 0, 1) — 전 구간 밀폐
  for (let c = 0; c < 165; c++) {
    map[0]![c] = CB;
    map[1]![c] = CB;
  }

  // 성채 바닥 (row 13, 14) — 3개의 용암 구덩이 포함
  const groundSegments: [number, number][] = [
    [0, 38],
    [42, 75],
    [79, 118],
    [122, 190],
  ];
  for (const [start, end] of groundSegments) {
    for (let c = start; c < end; c++) {
      map[13]![c] = CB;
      map[14]![c] = CB;
    }
  }

  // 구간 1: 첫 번째 좁은 회랑 (row 8 천장 브릭)
  for (let c = 15; c <= 25; c++) {
    map[8]![c] = CB;
  }
  map[9]![19] = Q; // 파워업 버섯 기회!

  // 용암 구덩이 1 (col 38~42) 위의 공중 디딤돌
  map[10]![39] = CB;
  map[10]![40] = CB;

  // 구간 2: 이중 층 회랑 (col 48~70)
  for (let c = 48; c <= 70; c++) {
    map[7]![c] = CB;
  }
  map[7]![53] = Q;
  map[7]![62] = Q;

  // 중간 성벽 요새 기둥 (col 58, row 8~12)
  for (let r = 9; r <= 12; r++) {
    map[r]![58] = CB;
  }

  // 용암 구덩이 2 (col 75~79) 징검다리
  map[10]![76] = CB;
  map[9]![77] = CB;

  // 구간 3: 지그재그 회랑 (col 85~115)
  for (let c = 85; c <= 95; c++) map[9]![c] = CB;
  map[9]![90] = Q;

  for (let c = 100; c <= 112; c++) map[6]![c] = CB;
  map[6]![106] = Q;

  // 용암 구덩이 3 (col 118~122) 건너기
  map[10]![119] = CB;
  map[10]![120] = CB;

  // 최종 돌파 계단 (col 138~148)
  for (let s = 0; s < 7; s++) {
    const col = 140 + s;
    for (let h = 0; h <= s; h++) {
      map[12 - h]![col] = CB;
    }
  }

  // 깃대 (col 165, row 3~12)
  for (let r = 3; r <= 12; r++) {
    map[r]![165] = F;
  }

  // 최종 성채 (col 170~174)
  buildCastle(map, 170, 12);

  return {
    name: 'Stage 1-4',
    worldName: '1-4',
    theme: 'castle',
    skyGradient: ['#180404', '#2d0808', '#420d0d'], // 용암 성채의 붉은 암흑
    map,
    goombas: [
      [22 * 16, 12 * 16],
      [30 * 16, 12 * 16],
      [50 * 16, 12 * 16],
      [52 * 16, 12 * 16],
      [65 * 16, 6 * 16],
      [88 * 16, 8 * 16],
      [104 * 16, 5 * 16],
      [128 * 16, 12 * 16],
      [132 * 16, 12 * 16],
      [136 * 16, 12 * 16],
    ],
    flagpoleCol: 165,
  };
}
