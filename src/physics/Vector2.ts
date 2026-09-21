/**
 * Vector2 — 2차원 벡터 연산 유틸리티 클래스
 * 물리 엔진에서 위치, 속도, 가속도 등에 사용됩니다.
 */
export class Vector2 {
  constructor(public x: number = 0, public y: number = 0) {}

  /** 복제본 생성 */
  clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  /** 벡터 덧셈 */
  add(v: Vector2): Vector2 {
    return new Vector2(this.x + v.x, this.y + v.y);
  }

  /** 벡터 뺄셈 */
  sub(v: Vector2): Vector2 {
    return new Vector2(this.x - v.x, this.y - v.y);
  }

  /** 스칼라 곱 */
  scale(s: number): Vector2 {
    return new Vector2(this.x * s, this.y * s);
  }

  /** 벡터 크기 */
  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /** 정규화 */
  normalize(): Vector2 {
    const mag = this.magnitude();
    if (mag === 0) return new Vector2();
    return new Vector2(this.x / mag, this.y / mag);
  }

  /** 제자리(mutating) 덧셈 */
  addMut(v: Vector2): this {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  /** 제자리(mutating) 설정 */
  set(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }
}
