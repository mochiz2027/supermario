/**
 * Mushroom — 슈퍼 버섯 파워업 아이템
 * 물음표 블록에서 위로 솟아나온 뒤 지면을 따라 이동하며,
 * 마리오가 먹으면 슈퍼 마리오로 변신시킵니다.
 */

import { Entity } from './Entity';
import { moveAndCollide, TileType } from '../physics/Collision';
import { drawSprite } from '../graphics/ProceduralSprite';

const MUSHROOM_GRAVITY = 0.25;
const MUSHROOM_SPEED = 1.0;
const TERMINAL_VEL = 4.0;

export class Mushroom extends Entity {
  public alive: boolean = true;
  public isPopping: boolean = true;
  private popTargetY: number;

  constructor(x: number, y: number) {
    super(x, y, 16, 16);
    this.popTargetY = y - 16;
    this.vel.y = -0.5; // 위로 서서히 솟아오름
    this.vel.x = 0;
  }

  /** 고정 시간 단계 업데이트 (Entity 인터페이스) */
  update(_dt: number): void {}

  /** 버섯 물리 업데이트 */
  updateWithTilemap(tilemap: TileType[][], mapWidth: number, mapHeight: number): void {
    if (!this.alive) return;

    if (this.isPopping) {
      this.pos.y += this.vel.y;
      if (this.pos.y <= this.popTargetY) {
        this.pos.y = this.popTargetY;
        this.isPopping = false;
        this.vel.y = 0;
        this.vel.x = MUSHROOM_SPEED; // 오른쪽으로 이동 시작
      }
      return;
    }

    // 중력 적용
    this.vel.y += MUSHROOM_GRAVITY;
    if (this.vel.y > TERMINAL_VEL) this.vel.y = TERMINAL_VEL;

    // 타일맵 충돌 및 이동
    const result = moveAndCollide(this, tilemap, mapWidth, mapHeight);

    // 벽에 부딪히면 반사
    if (result.collidedX) {
      this.vel.x = -this.vel.x;
    }

    // 맵 바닥으로 떨어지면 제거
    if (this.pos.y > mapHeight * 16 + 32) {
      this.alive = false;
    }
  }

  /** 렌더 */
  render(ctx: CanvasRenderingContext2D, cameraX: number): void {
    if (!this.alive) return;
    drawSprite(ctx, 'mushroom', this.pos.x - cameraX, this.pos.y);
  }
}
