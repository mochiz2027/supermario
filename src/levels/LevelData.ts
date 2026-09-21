/**
 * LevelData — 라운드별 설정 및 타일맵 공통 빌더 헬퍼
 */

import { TileType } from '../physics/Collision';

export interface LevelConfig {
  name: string;
  worldName: string;
  theme: 'overworld' | 'underground' | 'athletic' | 'castle';
  skyGradient: [string, string, string];
  map: TileType[][];
  goombas: [number, number][];
  flagpoleCol: number;
}

/** 깃대 우측에 클래식 벽돌 성(Castle)을 건설합니다 */
export function buildCastle(map: TileType[][], startCol: number, baseRow: number): void {
  // 성채 규격: 5칸 너비, 5칸 높이
  const CB = TileType.CASTLE_BRICK;
  const CT = TileType.CASTLE_TOP;
  const CD = TileType.CASTLE_DOOR;

  // 탑 상단 흉벽 (row: baseRow - 4)
  for (let c = 0; c < 5; c++) {
    map[baseRow - 4]![startCol + c] = CT;
  }

  // 성 본체 벽돌 (row: baseRow - 3 ~ baseRow)
  for (let r = baseRow - 3; r <= baseRow; r++) {
    for (let c = 0; c < 5; c++) {
      // 중앙 아래 2칸(r: baseRow - 1, baseRow / c: 2)은 성문(CD)
      if ((r === baseRow || r === baseRow - 1) && c === 2) {
        map[r]![startCol + c] = CD;
      } else {
        map[r]![startCol + c] = CB;
      }
    }
  }
}

/** 계단 구조물 생성 헬퍼 */
export function buildStaircase(
  map: TileType[][],
  startCol: number,
  height: number,
  ascending: boolean,
  baseRow = 12,
  tileType = TileType.BRICK,
): void {
  for (let step = 0; step < height; step++) {
    const col = ascending ? startCol + step : startCol - step;
    const stepHeight = step + 1;
    for (let h = 0; h < stepHeight; h++) {
      const row = baseRow - h;
      if (row >= 0 && row < map.length && col >= 0 && col < map[0]!.length) {
        map[row]![col] = tileType;
      }
    }
  }
}
