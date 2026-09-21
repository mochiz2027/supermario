/**
 * Player — 마리오 플레이어 엔티티
 * 
 * 물리 상수 (SUPER_MARIO_DEV_GUIDE.md §3.1):
 * - 걷기 가속도: 0.098 px/frame²
 * - 달리기 가속도: 0.14 px/frame²
 * - 최대 걷기 속도: 1.5 px/frame
 * - 최대 달리기 속도: 2.5 px/frame
 * - 마찰 감속: 0.08 px/frame²
 * - 스키드 감속: 0.18 px/frame²
 * - 중력: 0.35 px/frame²
 * - 점프 초속도: -4.0 px/frame
 * - 가변 점프: 키 뗐을 때 중력 3배
 * - 종단 속도: 4.5 px/frame
 */

import { Entity } from './Entity';
import { Input } from '../core/Input';
import { marioSpriteManager } from '../graphics/MarioSpriteSheet';
import { moveAndCollide, TileType, CollisionResult } from '../physics/Collision';

// ─── 물리 상수 (즉각적인 플랫포머 반응성) ─────────────
const ACCEL_WALK = 0.30;
const ACCEL_RUN = 0.45;
const MAX_SPEED_WALK = 1.6;
const MAX_SPEED_RUN = 2.6;
const FRICTION = 0.40;       // 키 뗐을 때 즉시 정지 (미끄러짐 방지)
const SKID_FRICTION = 0.65;  // 반대 방향 전환 즉시 반응

const GRAVITY = 0.25;
const GRAVITY_RELEASE = 0.55; // 점프 키 뗐을 때 (가변 점프)
const JUMP_VEL = -6.4;        // 파이프(32px~48px)를 시원하게 뛰어넘는 점프력
const TERMINAL_VEL = 5.5;
const STOMP_BOUNCE_VEL = -4.5;

// ─── 플레이어 상태 ───────────────────────────
export const enum PlayerState {
  IDLE,
  WALKING,
  RUNNING,
  JUMPING,
  FALLING,
  DEAD,
}

export class Player extends Entity {
  public state: PlayerState = PlayerState.IDLE;
  public facingRight: boolean = true;
  public onGround: boolean = false;
  public score: number = 0;
  public coins: number = 0;

  // 점프 키 held 추적 (가변 점프)
  private jumpHeld: boolean = false;
  // 점프 입력 반응성 개선: 점프 버퍼링 & 코요테 타임 & 최소 점프 보장
  private jumpBufferTimer: number = 0;
  private coyoteTimer: number = 0;
  private jumpAirTimer: number = 0;

  // 슈퍼 마리오 & 무적 상태
  public isBig: boolean = false;
  public invulnerableTimer: number = 0;
  private transformTimer: number = 0;
  // 걷기/달리기 애니메이션 프레임
  private animTimer: number = 0;
  private animFrame: number = 0;

  // 사망 애니메이션
  private deadTimer: number = 0;
  private deadBounceApplied: boolean = false;

  constructor(x: number, y: number) {
    super(x, y, 14, 16); // 충돌 박스: 14×16 (스프라이트보다 약간 좁음)
  }

  /** 슈퍼 마리오 파워업 */
  powerUp(): void {
    if (!this.isBig) {
      this.isBig = true;
      this.pos.y -= 16;
      this.height = 32;
      this.transformTimer = 40;
    }
  }

  /** 데미지 피격 처리: 큰 마리오면 축소 + 무적 부여(사망 안 함), 작은 마리오면 사망(true 반환) */
  takeDamage(): boolean {
    if (this.invulnerableTimer > 0) return false;

    if (this.isBig) {
      this.isBig = false;
      this.height = 16;
      this.invulnerableTimer = 90; // 1.5초간 무적
      return false; // 생존
    } else {
      this.die();
      return true; // 사망
    }
  }

  /** 입력 기반 물리 업데이트 */
  updateWithInput(input: Input, tilemap: TileType[][], mapWidth: number, mapHeight: number): CollisionResult | null {
    if (this.state === PlayerState.DEAD) {
      return this.updateDead();
    }

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer--;
    }
    if (this.transformTimer > 0) {
      this.transformTimer--;
    }

    // 코요테 타임 타이머 갱신 (지면에 닿아있을 때 풀 충전)
    if (this.onGround) {
      this.coyoteTimer = 8;
      this.jumpAirTimer = 0;
    } else if (this.coyoteTimer > 0) {
      this.coyoteTimer--;
    }

    // 점프 버퍼링 타이머 갱신 (점프 키를 누르면 10프레임 동안 유지)
    if (input.isJustPressed('jump')) {
      this.jumpBufferTimer = 10;
    } else if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer--;
    }

    // ─── 수평 이동 ─────────────────────────
    const wantLeft = input.isHeld('left');
    const wantRight = input.isHeld('right');
    const wantRun = input.isHeld('run');
    const accel = wantRun ? ACCEL_RUN : ACCEL_WALK;
    const maxSpeed = wantRun ? MAX_SPEED_RUN : MAX_SPEED_WALK;

    if (wantRight) {
      this.facingRight = true;
      if (this.vel.x < 0) {
        this.vel.x += SKID_FRICTION;
      } else if (this.vel.x === 0) {
        this.vel.x = 0.8; // 즉각적인 첫걸음 반응
      } else {
        this.vel.x += accel;
      }
      if (this.vel.x > maxSpeed) this.vel.x = maxSpeed;
    } else if (wantLeft) {
      this.facingRight = false;
      if (this.vel.x > 0) {
        this.vel.x -= SKID_FRICTION;
      } else if (this.vel.x === 0) {
        this.vel.x = -0.8; // 즉각적인 첫걸음 반응
      } else {
        this.vel.x -= accel;
      }
      if (this.vel.x < -maxSpeed) this.vel.x = -maxSpeed;
    } else {
      // 마찰 감속: 키를 떼면 미끄러지지 않고 즉시 정지
      if (Math.abs(this.vel.x) <= FRICTION) {
        this.vel.x = 0;
      } else if (this.vel.x > 0) {
        this.vel.x -= FRICTION;
      } else if (this.vel.x < 0) {
        this.vel.x += FRICTION;
      }
    }

    // ─── 점프 키 상태 추적 (가변 점프용) ────
    this.jumpHeld = input.isHeld('jump');

    // ─── 점프 시작 판정 (버퍼링 + 코요테 타임 통합) ───
    const canJump = (this.onGround || this.coyoteTimer > 0) && this.vel.y >= 0;
    if (this.jumpBufferTimer > 0 && canJump) {
      this.vel.y = JUMP_VEL;
      this.jumpHeld = true;
      this.onGround = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.jumpAirTimer = 0;
    }

    // ─── 중력 & 가변 점프 판정 ─────────────
    if (this.vel.y < 0) {
      this.jumpAirTimer++;
      // 점프 초기 6프레임은 최소 점프 보장(안정감 확보), 이후 키를 뗐을 때만 빠른 하강
      const shouldCutJump = !this.jumpHeld && this.jumpAirTimer > 6;
      this.vel.y += shouldCutJump ? GRAVITY_RELEASE : GRAVITY;
    } else {
      this.vel.y += GRAVITY;
    }
    if (this.vel.y > TERMINAL_VEL) this.vel.y = TERMINAL_VEL;

    // ─── 이동 & 충돌 ────────────────────────
    const result = moveAndCollide(this, tilemap, mapWidth, mapHeight);
    this.onGround = result.onGround;

    // 구멍에 빠짐 (맵 하단 초과)
    if (this.pos.y > mapHeight * 16) {
      this.die();
    }

    // ─── 상태 업데이트 ──────────────────────
    if (!this.onGround) {
      this.state = this.vel.y < 0 ? PlayerState.JUMPING : PlayerState.FALLING;
      this.animTimer = 0;
      this.animFrame = 0;
    } else if (Math.abs(this.vel.x) > 0.1) {
      this.state = Math.abs(this.vel.x) > MAX_SPEED_WALK ? PlayerState.RUNNING : PlayerState.WALKING;
      this.animTimer += Math.abs(this.vel.x);
      const stepInterval = Math.abs(this.vel.x) > MAX_SPEED_WALK ? 10 : 14;
      if (this.animTimer >= stepInterval) {
        this.animTimer = 0;
        this.animFrame = (this.animFrame + 1) % 2;
      }
    } else {
      this.state = PlayerState.IDLE;
      this.animTimer = 0;
      this.animFrame = 0;
    }

    return result;
  }

  /** 사망 처리 */
  die(): void {
    if (this.state === PlayerState.DEAD) return;
    this.state = PlayerState.DEAD;
    this.isBig = false;
    this.height = 16;
    this.vel.x = 0;
    this.vel.y = -4.5; // 사망 도약
    this.deadTimer = 0;
    this.deadBounceApplied = true;
  }

  /** 사망 상태 업데이트 (중력만 적용, 충돌 무시) */
  private updateDead(): null {
    this.deadTimer++;
    if (this.deadBounceApplied) {
      this.vel.y += GRAVITY;
      this.pos.y += this.vel.y;
    }
    return null;
  }

  /** 적을 밟았을 때 반동 */
  stomp(): void {
    this.vel.y = STOMP_BOUNCE_VEL;
    this.onGround = false;
  }

  /** 고정 시간 단계 업데이트 (Entity 인터페이스, 단독 사용 시) */
  update(_dt: number): void {
    // updateWithInput을 사용합니다
  }

  /** 렌더 */
  render(ctx: CanvasRenderingContext2D, cameraX: number): void {
    // 무적 상태일 때 깜빡임 효과 (4프레임 주기)
    if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer / 4) % 2 === 0) {
      return;
    }

    const screenX = this.pos.x - cameraX;
    const screenY = this.pos.y;
    const flipX = !this.facingRight;

    // 변신 중(transformTimer > 0)일 때: 작은 마리오와 큰 마리오를 교차 깜빡임하여 커지는 연출
    const isTransforming = this.transformTimer > 0;
    const showSmallDuringTransform = isTransforming && Math.floor(this.transformTimer / 4) % 2 === 0;
    const currentBig = this.isBig && !showSmallDuringTransform;

    // 상태와 상황에 따른 포즈 매핑:
    // - 정지 및 일반 걷기: 손을 내린 안정된 모습 (달달거리며 떠는 현상 완전 제거)
    // - 빠른 달리기 및 점프/체공: 손을 올리고 달리는 역동적인 모습
    let spriteName: string;
    if (this.state === PlayerState.DEAD) {
      spriteName = 'mario_die';
    } else if (!this.onGround) {
      // 점프 또는 공중 체공: 손을 올린 모습
      spriteName = currentBig ? 'mario_big_run' : 'mario_run';
    } else if (this.state === PlayerState.RUNNING) {
      // 달리기(대시): 손을 올리고 달리는 모습
      spriteName = currentBig ? 'mario_big_run' : 'mario_run';
    } else {
      // 정지 및 일반 걷기: 손을 내린 안정된 모습
      spriteName = currentBig ? 'mario_big_idle' : 'mario_idle';
    }

    const effectiveHeight = (this.isBig && showSmallDuringTransform) ? 16 : this.height;

    marioSpriteManager.draw(ctx, spriteName, screenX, screenY, this.width, effectiveHeight, flipX);
  }
}
