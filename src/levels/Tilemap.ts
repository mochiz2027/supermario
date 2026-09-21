/**
 * Tilemap — 16×16 그리드 타일맵 파서 및 렌더러
 * 타일 배열 데이터를 기반으로 월드를 구성하고 렌더링합니다.
 */

import { TileType, TILE_SIZE } from '../physics/Collision';
import { drawSprite } from '../graphics/ProceduralSprite';

/** 타일 타입 → 스프라이트 이름 */
function tileSpriteName(tile: TileType): string | null {
  switch (tile) {
    case TileType.GROUND: return 'ground';
    case TileType.BRICK: return 'brick';
    case TileType.QUESTION: return 'question_block';
    case TileType.EMPTY_BLOCK: return 'empty_block';
    case TileType.PIPE_TOP: return 'pipe_top';
    case TileType.PIPE_BODY: return 'pipe_body';
    case TileType.FLAGPOLE: return 'flagpole';
    case TileType.CASTLE_BRICK: return 'castle_brick';
    case TileType.CASTLE_TOP: return 'castle_top';
    case TileType.CASTLE_DOOR: return 'castle_door';
    case TileType.GROUND_BLUE: return 'ground_blue';
    case TileType.BRICK_BLUE: return 'brick_blue';
    default: return null;
  }
}

export class Tilemap {
  public data: TileType[][];
  public cols: number;
  public rows: number;

  /** 월드 픽셀 단위 크기 */
  get widthPx(): number { return this.cols * TILE_SIZE; }
  get heightPx(): number { return this.rows * TILE_SIZE; }

  constructor(data: TileType[][]) {
    this.data = data;
    this.rows = data.length;
    this.cols = data[0]?.length ?? 0;
  }

  /** 지정 좌표의 타일 가져오기 */
  getTile(col: number, row: number): TileType {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      return TileType.EMPTY;
    }
    return this.data[row]![col]!;
  }

  /** 지정 좌표의 타일 설정 */
  setTile(col: number, row: number, tile: TileType): void {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;
    this.data[row]![col] = tile;
  }

  /** 카메라 범위 내 타일맵 렌더링 */
  render(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    viewWidth: number,
    bounces?: Map<string, number>,
  ): void {
    const startCol = Math.max(0, Math.floor(cameraX / TILE_SIZE));
    const endCol = Math.min(this.cols, Math.ceil((cameraX + viewWidth) / TILE_SIZE) + 1);

    for (let row = 0; row < this.rows; row++) {
      for (let col = startCol; col < endCol; col++) {
        const tile = this.data[row]![col]!;
        if (tile === TileType.EMPTY) continue;
        const name = tileSpriteName(tile);
        if (!name) continue;

        const bounceOffset = bounces?.get(`${col},${row}`) ?? 0;
        drawSprite(ctx, name, col * TILE_SIZE - cameraX, row * TILE_SIZE + bounceOffset);
      }
    }
  }
}
