/**
 * Level1_5 — 슈퍼마리오 1-5 최종 챔피언 마스터 스테이지
 * - 황금빛 노을 하늘, 다채로운 장애물과 대규모 코인 보너스
 * - 5개 라운드의 대미를 장식하는 최종 챌린지 코스
 */

import { TileType } from '../physics/Collision';
import { LevelConfig, buildCastle } from './LevelData';

const E = TileType.EMPTY;
const G = TileType.GROUND;
const B = TileType.BRICK;
const Q = TileType.QUESTION;
const PT = TileType.PIPE_TOP;
const PB = TileType.PIPE_BODY;
const F = TileType.FLAGPOLE;

export const LEVEL1_5_COLS = 200;
export const LEVEL1_5_ROWS = 15;

export function getLevel1_5(): LevelConfig {
  const map: TileType[][] = [];
  for (let r = 0; r < LEVEL1_5_ROWS; r++) {
    map.push(new Array<TileType>(LEVEL1_5_COLS).fill(E));
  }

  // 바닥 (row 13, 14)
  const groundSegments: [number, number][] = [
    [0, 60],
    [64, 115],
    [120, 200],
  ];
  for (const [start, end] of groundSegments) {
    for (let c = start; c < end; c++) {
      map[13]![c] = G;
      map[14]![c] = G;
    }
  }

  // 구간 1: 축하 코인 피라미드 (col 15~25)
  map[10]![16] = Q; map[10]![17] = B; map[10]![18] = Q; map[10]![19] = B; map[10]![20] = Q;
  map[7]![18] = Q;

  // 파이프 1 (col 28~29, 2단)
  map[11]![28] = PT; map[11]![29] = PT;
  map[12]![28] = PB; map[12]![29] = PB;

  // 구간 2: 이중 파이프 & 발판 디딤돌 (col 38~50)
  map[12]![36] = B; map[12]![37] = B;
  map[10]![38] = PT; map[10]![39] = PT;
  map[11]![38] = PB; map[11]![39] = PB;
  map[12]![38] = PB; map[12]![39] = PB;

  // 파이프 사이 물음표 블록
  map[7]![43] = Q;

  map[12]![46] = B; map[11]![46] = Q;
  map[9]![48] = PT;  map[9]![49] = PT;
  map[10]![48] = PB; map[10]![49] = PB;
  map[11]![48] = PB; map[11]![49] = PB;
  map[12]![48] = PB; map[12]![49] = PB;

  // 구간 3: 구멍 1(col 60~64) 위의 공중 징검다리
  map[9]![61] = B;
  map[8]![62] = Q;
  map[9]![63] = B;

  // 구간 4: 황금 블록 연속 지대 (col 70~90)
  for (let c = 72; c <= 86; c += 2) {
    map[9]![c] = Q;
    map[9]![c + 1] = B;
  }
  for (let c = 76; c <= 82; c++) {
    map[5]![c] = B;
  }
  map[5]![79] = Q;

  // 구간 5: 구멍 2(col 115~120) 2단 징검다리
  map[10]![116] = B;
  map[9]![117] = Q;
  map[8]![118] = B;

  // 구간 6: 최종 승리의 거대 계단 (col 145~165)
  for (let s = 0; s < 9; s++) {
    const col = 148 + s;
    for (let h = 0; h <= s; h++) {
      map[12 - h]![col] = B;
    }
  }

  // 깃대 (col 175, row 3~12)
  for (let r = 3; r <= 12; r++) {
    map[r]![175] = F;
  }

  // 챔피언 최종 성채 (col 180~184)
  buildCastle(map, 180, 12);

  return {
    name: 'Stage 1-5 (Champion)',
    worldName: '1-5',
    theme: 'overworld',
    skyGradient: ['#682088', '#b84878', '#f8a858'], // 황금빛 노을 하늘
    map,
    goombas: [
      [22 * 16, 12 * 16],
      [34 * 16, 12 * 16],
      [44 * 16, 12 * 16],
      [68 * 16, 12 * 16],
      [75 * 16, 12 * 16],
      [84 * 16, 12 * 16],
      [100 * 16, 12 * 16],
      [108 * 16, 12 * 16],
      [128 * 16, 12 * 16],
      [136 * 16, 12 * 16],
      [142 * 16, 12 * 16],
    ],
    flagpoleCol: 175,
  };
}
