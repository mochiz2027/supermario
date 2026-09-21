/**
 * Entity — 게임 내 모든 엔티티의 베이스 인터페이스
 * 위치, 속도, 크기, 렌더/업데이트 메서드를 정의합니다.
 */

import { Vector2 } from '../physics/Vector2';

export interface EntityBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export abstract class Entity {
  public pos: Vector2;
  public vel: Vector2;
  public width: number;
  public height: number;
  public alive: boolean = true;

  constructor(x: number, y: number, width: number, height: number) {
    this.pos = new Vector2(x, y);
    this.vel = new Vector2(0, 0);
    this.width = width;
    this.height = height;
  }

  /** 엔티티의 AABB 바운딩 박스 */
  getBounds(): EntityBounds {
    return {
      x: this.pos.x,
      y: this.pos.y,
      width: this.width,
      height: this.height,
    };
  }

  /** 고정 시간 단계 업데이트 */
  abstract update(dt: number): void;

  /** 렌더 */
  abstract render(ctx: CanvasRenderingContext2D, cameraX: number): void;
}
