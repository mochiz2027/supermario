/**
 * Level1_1 — 슈퍼마리오 1-1 스테이지 데이터
 * 
 * 맵 규격: 15행 × 212열 (240px × 3392px)
 * 타일: 16×16 픽셀
 * 
 * 원작 SMB 1-1을 참고한 레이아웃:
 * - 평지 → 물음표 블록 → 파이프(점점 높아짐) → 구멍 → 계단 → 깃대
 */

import { TileType } from '../physics/Collision';
import { LevelConfig, buildCastle } from './LevelData';

const E = TileType.EMPTY;
const G = TileType.GROUND;
const B = TileType.BRICK;
const Q = TileType.QUESTION;
const D = TileType.EMPTY_BLOCK;   // (Dead/empty block)
const PT = TileType.PIPE_TOP;
const PB = TileType.PIPE_BODY;
const F = TileType.FLAGPOLE;

// 맵 사이즈
export const LEVEL_COLS = 212;
export const LEVEL_ROWS = 15;

/** Level 1-1 타일맵 데이터를 생성합니다 */
export function createLevel1_1(): TileType[][] {
  // 빈 맵 초기화
  const map: TileType[][] = [];
  for (let row = 0; row < LEVEL_ROWS; row++) {
    map.push(new Array<TileType>(LEVEL_COLS).fill(E));
  }

  // ──────────────────────────────────────────
  // 바닥 (row 13~14, 연속 바닥에 구멍 포함)
  // ──────────────────────────────────────────
  const groundSegments: [number, number][] = [
    [0, 69],      // 시작 ~ 첫 구멍 전
    [71, 86],     // 첫 구멍 후 ~ 둘째 구멍 전
    [89, 153],    // 둘째 구멍 후 ~ 셋째 구멍 전
    [155, 212],   // 마지막 구멍 후 ~ 끝
  ];

  for (const [start, end] of groundSegments) {
    for (let col = start; col < end; col++) {
      map[13]![col] = G;
      map[14]![col] = G;
    }
  }

  // ──────────────────────────────────────────
  // 물음표 블록 & 벽돌 배치 (row 10 = y:160)
  // ──────────────────────────────────────────

  // 영역 1: 첫 물음표 블록 (col 16)
  map[10]![16] = Q;

  // 영역 2: 벽돌-물음표-벽돌-물음표-벽돌 (col 20~24)
  map[10]![20] = B;
  map[10]![21] = Q;
  map[10]![22] = B;
  map[10]![23] = Q;
  map[10]![24] = B;

  // 높은 물음표 (row 6 = y:96)
  map[6]![22] = Q;

  // 영역 3: 벽돌 그룹 (col 77~79)
  map[10]![77] = B;
  map[10]![78] = Q;
  map[10]![79] = B;

  // 영역 4: 높은 벽돌 라인 (row 6, col 80~87)
  for (let col = 80; col <= 87; col++) {
    map[6]![col] = B;
  }

  // 영역 5: 벽돌 그룹 (col 91~94)
  map[10]![91] = B;
  map[10]![92] = B;
  map[10]![93] = Q;
  map[10]![94] = B;

  // 영역 6: 더 많은 벽돌 (col 100~101, row 10)
  map[10]![100] = B;
  map[10]![101] = B;

  // 영역 7: 물음표 (col 106, 109)
  map[10]![106] = Q;
  map[10]![109] = Q;

  // 영역 8: 벽돌 라인 (row 6, col 128~131)
  for (let col = 128; col <= 131; col++) {
    map[6]![col] = B;
  }

  // 영역 9: 벽돌 블록 (col 168~171, row 10)
  map[10]![168] = B;
  map[10]![169] = Q;
  map[10]![170] = Q;
  map[10]![171] = B;

  // ──────────────────────────────────────────
  // 파이프 및 디딤돌 발판 (높은 파이프 도약용 계단)
  // ──────────────────────────────────────────

  // 파이프 1 (2칸 높이, col 28~29)
  map[11]![28] = PT; map[11]![29] = PT;
  map[12]![28] = PB; map[12]![29] = PB;

  // 파이프 2 앞 디딤돌 발판 (1칸 높이, col 35~36)
  map[12]![35] = B;
  map[12]![36] = B;

  // 파이프 2 (3칸 높이, col 38~39)
  map[10]![38] = PT; map[10]![39] = PT;
  map[11]![38] = PB; map[11]![39] = PB;
  map[12]![38] = PB; map[12]![39] = PB;

  // 파이프 3 앞 계단형 디딤돌 발판 (col 42~44)
  // 1단: col 42 (row 12)
  map[12]![42] = B;
  // 2단: col 43~44 (row 11~12) - 물음표 블록 포함
  map[12]![43] = B; map[11]![43] = Q; // 코인 보너스!
  map[12]![44] = B; map[11]![44] = B;

  // 파이프 3 (4칸 높이, col 46~47)
  map[9]![46] = PT;  map[9]![47] = PT;
  map[10]![46] = PB; map[10]![47] = PB;
  map[11]![46] = PB; map[11]![47] = PB;
  map[12]![46] = PB; map[12]![47] = PB;

  // 파이프 4 앞 계단형 디딤돌 발판 (col 53~55)
  map[12]![53] = B;
  map[12]![54] = B; map[11]![54] = Q;
  map[12]![55] = B; map[11]![55] = B;

  // 파이프 4 (4칸 높이, col 57~58)
  map[9]![57] = PT;  map[9]![58] = PT;
  map[10]![57] = PB; map[10]![58] = PB;
  map[11]![57] = PB; map[11]![58] = PB;
  map[12]![57] = PB; map[12]![58] = PB;

  // 파이프 5 (col 163~164, 2칸)
  map[11]![163] = PT; map[11]![164] = PT;
  map[12]![163] = PB; map[12]![164] = PB;

  // ──────────────────────────────────────────
  // 계단 구조물들
  // ──────────────────────────────────────────

  // 계단 1: 오르막 (col 134~137)
  buildStaircase(map, 134, 4, true);

  // 계단 2: 내리막 (col 140~143)
  buildStaircase(map, 143, 4, false);

  // 계단 3: 오르막 (col 148~152)
  buildStaircase(map, 148, 5, true);

  // 계단 4: 내리막 (col 155~159)
  buildStaircase(map, 159, 5, false);

  // ──────────────────────────────────────────
  // 최종 계단 (col 181~189) — 8단 오르막 + 깃대
  // ──────────────────────────────────────────
  buildStaircase(map, 181, 8, true);

  // 깃대 (col 189, row 3~12)
  for (let row = 3; row <= 12; row++) {
    map[row]![189] = F;
  }

  // 깃대 우측에 벽돌 성채(Castle) 건설 (col 194~198)
  buildCastle(map, 194, 12);

  return map;
}

export function getLevel1_1(): LevelConfig {
  return {
    name: 'Stage 1-1',
    worldName: '1-1',
    theme: 'overworld',
    skyGradient: ['#5c94fc', '#6b9cfc', '#8cb4fc'],
    map: createLevel1_1(),
    goombas: [
      [22 * 16, 12 * 16],
      [40 * 16, 12 * 16],
      [51 * 16, 12 * 16],
      [52 * 16, 12 * 16],
      [80 * 16, 12 * 16],
      [82 * 16, 12 * 16],
      [97 * 16, 12 * 16],
      [98 * 16, 12 * 16],
      [114 * 16, 12 * 16],
      [115 * 16, 12 * 16],
      [174 * 16, 12 * 16],
      [175 * 16, 12 * 16],
    ],
    flagpoleCol: 189,
  };
}

/**
 * 계단 구조물을 맵에 추가합니다.
 * @param startCol - 계단 시작 열
 * @param steps - 계단 단수
 * @param ascending - true면 오르막(왼쪽→오른쪽), false면 내리막
 */
function buildStaircase(
  map: TileType[][],
  startCol: number,
  steps: number,
  ascending: boolean,
): void {
  for (let step = 0; step < steps; step++) {
    const col = ascending ? startCol + step : startCol - step;
    const height = step + 1;
    for (let h = 0; h < height; h++) {
      const row = 12 - h;
      if (row >= 0 && row < LEVEL_ROWS && col >= 0 && col < LEVEL_COLS) {
        map[row]![col] = G;
      }
    }
  }
}

// D 변수 사용 확인 (빈 블록 초기 배치 없으므로 export로 내보냄)
export { D as EMPTY_BLOCK_TYPE };
