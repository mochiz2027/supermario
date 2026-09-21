/**
 * Goomba — 굼바 적 엔티티
 * 좌우 순찰 AI, 벽/절벽 반전, 밟힘(crushed) 상태 전이
 */

import { Entity } from './Entity';
import { drawSprite } from '../graphics/ProceduralSprite';
import { TILE_SIZE, TileType, isSolid } from '../physics/Collision';

const GOOMBA_SPEED = 0.5; // px/frame
const CRUSHED_DURATION = 30; // 밟힘 후 소멸까지 프레임 수

export const enum GoombaState {
  WALKING,
  CRUSHED,
}

export class Goomba extends Entity {
  public goombaState: GoombaState = GoombaState.WALKING;
  private direction: -1 | 1 = -1; // -1: 왼쪽, 1: 오른쪽
  private animFrame = 0;
  private animTimer = 0;
  private crushedTimer = 0;

  constructor(x: number, y: number) {
    super(x, y, 16, 16);
  }

  /** 타일맵 기반 AI 업데이트 */
  updateWithTilemap(
    tilemap: TileType[][],
    mapCols: number,
    mapRows: number,
  ): void {
    if (this.goombaState === GoombaState.CRUSHED) {
      this.crushedTimer++;
      if (this.crushedTimer >= CRUSHED_DURATION) {
        this.alive = false;
      }
      return;
    }

    // 수평 이동
    this.vel.x = GOOMBA_SPEED * this.direction;

    // 중력
    this.vel.y += 0.35;
    if (this.vel.y > 4.5) this.vel.y = 4.5;

    // X축 이동 + 충돌
    this.pos.x += this.vel.x;
    this.resolveXCollision(tilemap, mapCols, mapRows);

    // Y축 이동 + 충돌
    this.pos.y += this.vel.y;
    this.resolveYCollision(tilemap, mapCols, mapRows);

    // 맵 아래로 떨어짐
    if (this.pos.y > mapRows * TILE_SIZE + 32) {
      this.alive = false;
    }

    // 걷기 애니메이션
    this.animTimer++;
    if (this.animTimer >= 12) {
      this.animTimer = 0;
      this.animFrame = this.animFrame === 0 ? 1 : 0;
    }
  }

  /** X축 충돌 해결 — 벽에 부딪히면 방향 반전 */
  private resolveXCollision(
    tilemap: TileType[][],
    mapCols: number,
    mapRows: number,
  ): void {
    const left = Math.floor(this.pos.x / TILE_SIZE);
    const right = Math.floor((this.pos.x + this.width - 1) / TILE_SIZE);
    const top = Math.floor(this.pos.y / TILE_SIZE);
    const bottom = Math.floor((this.pos.y + this.height - 1) / TILE_SIZE);

    for (let row = top; row <= bottom; row++) {
      for (let col = left; col <= right; col++) {
        if (col < 0 || col >= mapCols || row < 0 || row >= mapRows) continue;
        const tile = tilemap[row]?.[col];
        if (tile === undefined || !isSolid(tile)) continue;

        if (this.vel.x > 0) {
          this.pos.x = col * TILE_SIZE - this.width;
          this.direction = -1;
        } else if (this.vel.x < 0) {
          this.pos.x = (col + 1) * TILE_SIZE;
          this.direction = 1;
        }
        this.vel.x = 0;
      }
    }
  }

  /** Y축 충돌 해결 */
  private resolveYCollision(
    tilemap: TileType[][],
    mapCols: number,
    mapRows: number,
  ): void {
    const left = Math.floor(this.pos.x / TILE_SIZE);
    const right = Math.floor((this.pos.x + this.width - 1) / TILE_SIZE);
    const top = Math.floor(this.pos.y / TILE_SIZE);
    const bottom = Math.floor((this.pos.y + this.height - 1) / TILE_SIZE);

    for (let row = top; row <= bottom; row++) {
      for (let col = left; col <= right; col++) {
        if (col < 0 || col >= mapCols || row < 0 || row >= mapRows) continue;
        const tile = tilemap[row]?.[col];
        if (tile === undefined || !isSolid(tile)) continue;

        if (this.vel.y > 0) {
          this.pos.y = row * TILE_SIZE - this.height;
          this.vel.y = 0;
        } else if (this.vel.y < 0) {
          this.pos.y = (row + 1) * TILE_SIZE;
          this.vel.y = 0;
        }
      }
    }
  }

  /** 밟힘 처리 */
  crush(): void {
    this.goombaState = GoombaState.CRUSHED;
    this.vel.x = 0;
    this.vel.y = 0;
    this.crushedTimer = 0;
  }

  /** Entity 인터페이스 구현 */
  update(_dt: number): void {
    // updateWithTilemap을 사용합니다
  }

  /** 렌더 */
  render(ctx: CanvasRenderingContext2D, cameraX: number): void {
    const screenX = this.pos.x - cameraX;
    const screenY = this.pos.y;

    if (this.goombaState === GoombaState.CRUSHED) {
      drawSprite(ctx, 'goomba_crushed', screenX, screenY);
    } else {
      const spriteName = this.animFrame === 0 ? 'goomba_walk1' : 'goomba_walk2';
      drawSprite(ctx, spriteName, screenX, screenY);
    }
  }
}
