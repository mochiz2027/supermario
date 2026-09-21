/**
 * Game — Fixed Timestep 메인 게임 루프 & 고해상도 레트로 렌더러
 * - 슈퍼 버섯 파워업(큰 마리오 변신 & 피격 축소)
 * - 깃발 하강 & 성채 걸어가기 클래식 클리어 시퀀스
 * - 총 5개 라운드(World 1-1 ~ World 1-5) 연속 플레이 시스템
 */

import { Input } from './Input';
import { Camera } from './Camera';
import { Sound } from './Sound';
import { Player, PlayerState } from '../entities/Player';
import { Goomba, GoombaState } from '../entities/Goomba';
import { Mushroom } from '../entities/Mushroom';
import { Tilemap } from '../levels/Tilemap';
import { getLevel1_1 } from '../levels/Level1_1';
import { getLevel1_2 } from '../levels/Level1_2';
import { getLevel1_3 } from '../levels/Level1_3';
import { getLevel1_4 } from '../levels/Level1_4';
import { getLevel1_5 } from '../levels/Level1_5';
import { LevelConfig } from '../levels/LevelData';
import { TileType, TILE_SIZE } from '../physics/Collision';
import { drawSprite } from '../graphics/ProceduralSprite';
import { HUD, GamePhase } from '../ui/HUD';

/** 게임에서 사용하는 논리적 가상 해상도 (NES 규격) */
export const GAME_WIDTH = 256;
export const GAME_HEIGHT = 240;
/** 깨짐 방지를 위한 캔버스 내부 서브픽셀 렌더 스케일 (2배 버퍼) */
export const RENDER_SCALE = 2;

const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS;

/** 5개 라운드 로더 목록 */
const LEVEL_LOADERS = [
  getLevel1_1,
  getLevel1_2,
  getLevel1_3,
  getLevel1_4,
  getLevel1_5,
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

interface BlockBounce {
  col: number;
  row: number;
  offsetY: number;
  velY: number;
}

const enum ClearStep {
  NONE,
  FLAG_SLIDING,
  WALKING_TO_CASTLE,
  INSIDE_CASTLE,
}

export class Game {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public input: Input;

  private lastTime = 0;
  private accumulator = 0;
  private running = false;

  // 현재 레벨 설정
  public currentLevelIndex: number = 0;
  private currentLevelConfig!: LevelConfig;

  // 게임 오브젝트
  private player!: Player;
  private goombas!: Goomba[];
  private mushrooms: Mushroom[] = [];
  private tilemap!: Tilemap;
  private camera!: Camera;
  private sound: Sound;
  private hud!: HUD;

  // 깃발 하강 및 성채 연출 상태
  private clearStep: ClearStep = ClearStep.NONE;
  private flagY: number = 48; // 깃발 Y 위치 (초기 꼭대기)
  private castleDoorX: number = 0;
  private marioInsideCastle: boolean = false;

  // 이펙트 & 애니메이션
  private coinPopups: { x: number; y: number; timer: number }[] = [];
  private scorePopups: { x: number; y: number; timer: number; text: string }[] = [];
  private particles: Particle[] = [];
  private blockBounces: BlockBounce[] = [];

  // 모바일 터치 상태
  private touchButtons: Map<string, boolean> = new Map();
  private isMobile: boolean = false;

  // 생명 및 게임 오버 메뉴 선택 상태
  public lives: number = 3;
  public selectedGameOverOption: number = 0; // 0: 이어서 하기, 1: 처음부터 다시 하기

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context를 가져올 수 없습니다.');
    this.ctx = ctx;

    // 내부 버퍼 해상도 2배(512x480) 설정 (픽셀 깨짐 방지)
    this.canvas.width = GAME_WIDTH * RENDER_SCALE;
    this.canvas.height = GAME_HEIGHT * RENDER_SCALE;
    this.ctx.imageSmoothingEnabled = false;

    this.input = new Input();
    this.sound = new Sound();
    this.hud = new HUD();

    this.loadLevel(0);

    // 모바일 감지
    this.isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (this.isMobile) {
      this.setupTouchControls();
    }

    // 게임 오버 화면 마우스 클릭 선택 지원
    this.canvas.addEventListener('click', (e) => {
      if (this.hud.gamePhase !== GamePhase.GAME_OVER) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = GAME_WIDTH / rect.width;
      const scaleY = GAME_HEIGHT / rect.height;
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      // 옵션 1 (이어서 하기): x: 26 ~ 230, y: 106 ~ 138
      if (clickX >= 26 && clickX <= 230 && clickY >= 106 && clickY <= 138) {
        this.selectedGameOverOption = 0;
        this.confirmGameOverChoice();
      }
      // 옵션 2 (처음부터 다시 하기): x: 26 ~ 230, y: 146 ~ 178
      else if (clickX >= 26 && clickX <= 230 && clickY >= 146 && clickY <= 178) {
        this.selectedGameOverOption = 1;
        this.confirmGameOverChoice();
      }
    });

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  /** 지정 인덱스의 레벨 로드 */
  private loadLevel(index: number, retainPlayerState = false): void {
    this.currentLevelIndex = index;
    const loader = LEVEL_LOADERS[index] ?? LEVEL_LOADERS[0]!;
    this.currentLevelConfig = loader();

    this.tilemap = new Tilemap(this.currentLevelConfig.map);
    this.camera = new Camera();

    const oldScore = retainPlayerState ? this.player.score : 0;
    const oldCoins = retainPlayerState ? this.player.coins : 0;
    const oldIsBig = retainPlayerState ? this.player.isBig : false;

    this.player = new Player(40, 192);
    if (retainPlayerState) {
      this.player.score = oldScore;
      this.player.coins = oldCoins;
      if (oldIsBig) {
        this.player.powerUp();
      }
    }

    this.hud.world = this.currentLevelConfig.worldName;
    this.hud.reset();

    this.coinPopups = [];
    this.scorePopups = [];
    this.particles = [];
    this.blockBounces = [];
    this.mushrooms = [];

    // 깃발 및 성채 초기화
    this.clearStep = ClearStep.NONE;
    this.flagY = 3 * TILE_SIZE; // 48px
    this.castleDoorX = (this.currentLevelConfig.flagpoleCol + 7) * TILE_SIZE + 2;
    this.marioInsideCastle = false;

    // 굼바 배치
    this.goombas = this.currentLevelConfig.goombas.map(([x, y]) => new Goomba(x, y));
  }

  /** 화면 비율을 정확히 유지하는 픽셀-퍼펙트 스케일링 */
  private resizeCanvas(): void {
    const scaleX = window.innerWidth / GAME_WIDTH;
    const scaleY = window.innerHeight / GAME_HEIGHT;
    let scale = Math.floor(Math.min(scaleX, scaleY));
    if (scale < 1) scale = 1;

    this.canvas.style.width = `${GAME_WIDTH * scale}px`;
    this.canvas.style.height = `${GAME_HEIGHT * scale}px`;
  }

  /** 모바일 터치 컨트롤 설정 */
  private setupTouchControls(): void {
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleTouches(e.touches, true);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      this.touchButtons.clear();
      this.handleTouches(e.touches, true);
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.touchButtons.clear();
      this.handleTouches(e.touches, true);
    }, { passive: false });
  }

  /** 터치 이벤트 처리 */
  private handleTouches(touches: TouchList, _active: boolean): void {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    const scaleY = GAME_HEIGHT / rect.height;

    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i]!;
      const x = (touch.clientX - rect.left) * scaleX;
      const y = (touch.clientY - rect.top) * scaleY;

      if (x < 80 && y > 180) {
        if (x < 35) this.touchButtons.set('left', true);
        else if (x > 45) this.touchButtons.set('right', true);
        if (y < 205) this.touchButtons.set('up', true);
        else if (y > 220) this.touchButtons.set('down', true);
      }
      if (x > 200 && x < 235 && y > 195) {
        this.touchButtons.set('jump', true);
      }
      if (x > 165 && x < 200 && y > 195) {
        this.touchButtons.set('run', true);
      }
    }
  }

  /** 터치 입력을 Input 시스템에 반영 */
  private applyTouchInput(): void {
    if (!this.isMobile) return;
    const left = this.touchButtons.get('left') ?? false;
    const right = this.touchButtons.get('right') ?? false;
    const jump = this.touchButtons.get('jump') ?? false;
    const run = this.touchButtons.get('run') ?? false;

    if (left) this.input.injectKey('left', true);
    if (right) this.input.injectKey('right', true);
    if (jump) this.input.injectKey('jump', true);
    if (run) this.input.injectKey('run', true);
  }


  private spawnStarBurst(x: number, y: number, count = 8): void {
    const colors = ['#f8d838', '#ffffff', '#f89800', '#ff5c58', '#00c800'];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 1.2 + Math.random() * 1.8;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)]!,
        size: 2,
        life: 18,
        maxLife: 18,
      });
    }
  }

  /** 게임 시작 */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    requestAnimationFrame((t) => this.loop(t));
  }

  /** 게임 루프 */
  private loop(currentTime: number): void {
    if (!this.running) return;

    let dt = currentTime - this.lastTime;
    if (dt > 250) dt = 250;
    this.lastTime = currentTime;
    this.accumulator += dt;

    this.applyTouchInput();

    while (this.accumulator >= FRAME_TIME) {
      this.update();
      this.accumulator -= FRAME_TIME;
    }

    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  /** 플레이어 사망 통합 처리 (생명 차감 및 리스폰/게임오버 판정) */
  private handlePlayerDeath(): void {
    if (this.player.state === PlayerState.DEAD) return;
    this.player.die();
    this.sound.playDie();
    this.lives--;
    const isGameOver = this.lives <= 0;
    this.hud.startDying(isGameOver);
  }

  /** 게임 오버 선택지 확정 (이어서 하기 vs 처음부터 다시 하기) */
  private confirmGameOverChoice(): void {
    this.sound.playCoin();
    this.lives = 3; // 생명 3개 충전
    if (this.selectedGameOverOption === 0) {
      // 1. 이어서 하기: 현재 도달한 라운드에서 점수/코인 유지한 채 재도전
      this.loadLevel(this.currentLevelIndex, true);
    } else {
      // 2. 처음부터 다시 하기: World 1-1부터 점수 0으로 새로 시작
      this.loadLevel(0, false);
    }
  }

  /** Fixed Timestep 업데이트 */
  private update(): void {
    // ─── GAME OVER 상태 (이어서 하기 / 처음부터 다시 하기) ───
    if (this.hud.gamePhase === GamePhase.GAME_OVER) {
      if (this.input.isJustPressed('up') || this.input.isJustPressed('down')) {
        this.selectedGameOverOption = this.selectedGameOverOption === 0 ? 1 : 0;
        this.sound.playJump();
      } else if (this.input.isJustPressed('option1')) {
        this.selectedGameOverOption = 0;
        this.confirmGameOverChoice();
      } else if (this.input.isJustPressed('option2')) {
        this.selectedGameOverOption = 1;
        this.confirmGameOverChoice();
      } else if (this.input.isJustPressed('jump') || this.input.isJustPressed('confirm')) {
        this.confirmGameOverChoice();
      }
      this.input.endFrame();
      return;
    }

    // ─── STAGE CLEAR 연출 & 다음 라운드 진행 ───
    if (this.hud.gamePhase === GamePhase.STAGE_CLEAR) {
      this.updateStageClearSequence();
      this.input.endFrame();
      return;
    }

    // ─── DYING 상태 ─────────────────────
    if (this.hud.gamePhase === GamePhase.DYING) {
      this.player.updateWithInput(this.input, this.tilemap.data, this.tilemap.cols, this.tilemap.rows);
      const outcome = this.hud.updateDying();
      if (outcome === 'respawn') {
        this.loadLevel(this.currentLevelIndex, true);
      }
      this.input.endFrame();
      return;
    }

    // ─── HUD 타이머 ─────────────────────
    this.hud.updateTime();
    if (this.hud.time <= 0 && this.player.state !== PlayerState.DEAD) {
      this.handlePlayerDeath();
    }

    // ─── Player 물리 업데이트 ─────────────
    const wasOnGround = this.player.onGround;
    const result = this.player.updateWithInput(
      this.input,
      this.tilemap.data,
      this.tilemap.cols,
      this.tilemap.rows,
    );

    // 점프 사운드 재생 (먼지 효과는 제거)
    if (wasOnGround && !this.player.onGround && this.player.vel.y < 0) {
      this.sound.playJump();
    }

    // ─── Headbonk: 물음표 블록 타격 (버섯 또는 코인) ───
    if (result?.headbonkTile) {
      const { col, row } = result.headbonkTile;
      const tile = this.tilemap.getTile(col, row);

      this.blockBounces.push({
        col,
        row,
        offsetY: 0,
        velY: -3.5,
      });

      if (tile === TileType.QUESTION) {
        this.tilemap.setTile(col, row, TileType.EMPTY_BLOCK);

        // 첫 물음표 블록 또는 작은 마리오 상태이거나 35% 확률로 슈퍼 버섯 출현!
        const shouldSpawnMushroom = (!this.player.isBig && Math.random() < 0.5) || col === 16 || col === 43;

        if (shouldSpawnMushroom) {
          // 슈퍼 버섯 생성
          const mushroom = new Mushroom(col * TILE_SIZE, row * TILE_SIZE);
          this.mushrooms.push(mushroom);
          this.sound.playSprout();
          this.scorePopups.push({
            x: col * TILE_SIZE,
            y: row * TILE_SIZE - 12,
            timer: 30,
            text: 'MUSHROOM',
          });
        } else {
          // 코인 지급
          this.player.coins++;
          this.player.score += 200;
          this.sound.playCoin();
          this.coinPopups.push({
            x: col * TILE_SIZE + 4,
            y: row * TILE_SIZE - 16,
            timer: 30,
          });
          this.spawnStarBurst(col * TILE_SIZE + 8, row * TILE_SIZE + 4, 5);
        }
      }
    }

    // 블록 바운스 물리 업데이트
    for (let i = this.blockBounces.length - 1; i >= 0; i--) {
      const b = this.blockBounces[i]!;
      b.offsetY += b.velY;
      b.velY += 0.7;
      if (b.offsetY >= 0) {
        this.blockBounces.splice(i, 1);
      }
    }

    // ─── 버섯 업데이트 & 마리오와 충돌 감지 ─────
    for (let i = this.mushrooms.length - 1; i >= 0; i--) {
      const m = this.mushrooms[i]!;
      m.updateWithTilemap(this.tilemap.data, this.tilemap.cols, this.tilemap.rows);

      if (!m.alive) {
        this.mushrooms.splice(i, 1);
        continue;
      }

      // 마리오와 버섯 충돌
      if (!m.isPopping && this.aabbOverlap(this.player, m)) {
        m.alive = false;
        this.mushrooms.splice(i, 1);
        this.player.powerUp();
        this.player.score += 1000;
        this.sound.playPowerup();
        this.spawnStarBurst(m.pos.x + 8, m.pos.y + 8, 12);
        this.scorePopups.push({
          x: m.pos.x,
          y: m.pos.y - 12,
          timer: 40,
          text: '1000',
        });
      }
    }

    // ─── 깃대 체크 (클리어 시작) ─────────
    const flagpoleX = this.currentLevelConfig.flagpoleCol * TILE_SIZE;
    if (
      this.player.pos.x + this.player.width >= flagpoleX &&
      this.player.pos.x <= flagpoleX + TILE_SIZE + 4 &&
      this.hud.gamePhase === GamePhase.PLAYING
    ) {
      this.startStageClearSequence();
    }

    // ─── 굼바 업데이트 ──────────────────
    const activationRange = this.camera.x + GAME_WIDTH + 32;
    for (const goomba of this.goombas) {
      if (!goomba.alive) continue;
      if (goomba.pos.x > activationRange) continue;
      goomba.updateWithTilemap(this.tilemap.data, this.tilemap.cols, this.tilemap.rows);
    }

    // ─── 플레이어-적 충돌 ────────────────
    if (this.player.state !== PlayerState.DEAD) {
      for (const goomba of this.goombas) {
        if (!goomba.alive || goomba.goombaState === GoombaState.CRUSHED) continue;
        if (!this.aabbOverlap(this.player, goomba)) continue;

        const playerBottom = this.player.pos.y + this.player.height;
        const goombaTop25 = goomba.pos.y + goomba.height * 0.25;

        // 위에서 밟음
        if (this.player.vel.y > 0 && playerBottom <= goombaTop25 + 6) {
          goomba.crush();
          this.player.stomp();
          this.player.score += 100;
          this.sound.playStomp();
          this.spawnStarBurst(goomba.pos.x + 8, goomba.pos.y + 8, 8);
          this.scorePopups.push({
            x: goomba.pos.x,
            y: goomba.pos.y - 8,
            timer: 40,
            text: '100',
          });
        } else {
          // 피격 처리: 큰 마리오면 축소 및 생존, 작은 마리오면 사망
          const killed = this.player.takeDamage();
          if (killed) {
            this.handlePlayerDeath();
          } else {
            // 생존 시 효과음 및 파티클
            this.sound.playJump();
            this.spawnStarBurst(this.player.pos.x + 8, this.player.pos.y + 8, 8);
          }
        }
      }
    }

    // ─── 이펙트 & 파티클 업데이트 ──────────────────
    for (let i = this.coinPopups.length - 1; i >= 0; i--) {
      const popup = this.coinPopups[i]!;
      popup.y -= 1.5;
      popup.timer--;
      if (popup.timer <= 0) this.coinPopups.splice(i, 1);
    }
    for (let i = this.scorePopups.length - 1; i >= 0; i--) {
      const popup = this.scorePopups[i]!;
      popup.y -= 0.8;
      popup.timer--;
      if (popup.timer <= 0) this.scorePopups.splice(i, 1);
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]!;
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // ─── 카메라 ──────────────────────────
    this.camera.update(this.player.pos.x, GAME_WIDTH, this.tilemap.widthPx);
    const clampedX = this.camera.clampPlayerLeft(this.player.pos.x);
    if (clampedX !== this.player.pos.x) {
      this.player.pos.x = clampedX;
      this.player.vel.x = Math.max(0, this.player.vel.x);
    }

    // 구멍에 빠짐 (생명 1개 차감)
    if (this.player.pos.y > this.tilemap.rows * TILE_SIZE) {
      if (this.player.state !== PlayerState.DEAD) {
        this.handlePlayerDeath();
      }
    }

    this.input.endFrame();
  }

  /** 깃발 하강 및 성채 진입 연출 시작 */
  private startStageClearSequence(): void {
    this.hud.startStageClear();
    this.sound.playFlagpole();

    const flagpoleX = this.currentLevelConfig.flagpoleCol * TILE_SIZE;
    this.player.pos.x = flagpoleX + 5;
    this.player.vel.x = 0;
    this.player.vel.y = 0;
    this.player.facingRight = false; // 깃대 붙잡기 포즈
    this.clearStep = ClearStep.FLAG_SLIDING;
  }

  /** 깃발 하강 & 성채 걸어가기 시퀀스 업데이트 */
  private updateStageClearSequence(): void {
    const bottomY = 12 * TILE_SIZE; // 192px

    // 1단계: 깃발 및 마리오 슬라이딩 하강
    if (this.clearStep === ClearStep.FLAG_SLIDING) {
      // 깃발 하강
      if (this.flagY < bottomY - 16) {
        this.flagY += 2.0;
      }
      // 마리오 하강
      if (this.player.pos.y + this.player.height < bottomY) {
        this.player.pos.y += 2.0;
      } else {
        // 깃대 바닥에 도달 → 오른쪽으로 돌아서서 착지
        this.player.pos.y = bottomY - this.player.height;
        this.player.pos.x = (this.currentLevelConfig.flagpoleCol + 1) * TILE_SIZE + 4;
        this.player.facingRight = true;
        this.clearStep = ClearStep.WALKING_TO_CASTLE;
        this.sound.playPowerup();
      }
      return;
    }

    // 2단계: 성채 문으로 자동 걸어가기
    if (this.clearStep === ClearStep.WALKING_TO_CASTLE) {
      this.player.pos.x += 1.2;
      this.player.facingRight = true;

      // 성문 위치 도달
      if (this.player.pos.x >= this.castleDoorX) {
        this.marioInsideCastle = true;
        this.clearStep = ClearStep.INSIDE_CASTLE;
      }
      return;
    }

    // 3단계: 성 안으로 들어감 → 타임 보너스 정산 및 다음 레벨 전환 대기
    if (this.clearStep === ClearStep.INSIDE_CASTLE) {
      const bonusScore = this.hud.updateStageClear();
      if (bonusScore > 0) {
        this.player.score += bonusScore;
        this.sound.playCoin();
      }

      // 시간 정산 완료 후 스페이스 누르면 다음 라운드로 전환
      if (this.hud.time === 0 && this.input.isJustPressed('jump')) {
        const nextIndex = (this.currentLevelIndex + 1) % LEVEL_LOADERS.length;
        // 5라운드 모두 클리어했으면 점수 리셋, 아니면 점수 유지
        const retain = this.currentLevelIndex < LEVEL_LOADERS.length - 1;
        this.loadLevel(nextIndex, retain);
      }
    }
  }

  /** AABB 겹침 판정 */
  private aabbOverlap(
    a: { pos: { x: number; y: number }; width: number; height: number },
    b: { pos: { x: number; y: number }; width: number; height: number },
  ): boolean {
    return (
      a.pos.x < b.pos.x + b.width &&
      a.pos.x + a.width > b.pos.x &&
      a.pos.y < b.pos.y + b.height &&
      a.pos.y + a.height > b.pos.y
    );
  }

  /** 렌더 */
  private render(): void {
    const { ctx } = this;

    // 2x 렌더 스케일 적용 (512x480 고해상도 버퍼)
    ctx.save();
    ctx.scale(RENDER_SCALE, RENDER_SCALE);
    ctx.imageSmoothingEnabled = false;

    // ─── 테마별 스카이 그라데이션 배경 ─────
    const gradColors = this.currentLevelConfig.skyGradient;
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    skyGrad.addColorStop(0, gradColors[0]);
    skyGrad.addColorStop(0.7, gradColors[1]);
    skyGrad.addColorStop(1, gradColors[2]);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 오버월드 테마일 때만 구름, 언덕, 수풀 렌더링
    if (this.currentLevelConfig.theme === 'overworld' || this.currentLevelConfig.theme === 'athletic') {
      this.renderClouds(ctx);
      this.renderHills(ctx);
      this.renderBushes(ctx);
    }

    // 바운스 맵 생성
    const bounceMap = new Map<string, number>();
    for (const b of this.blockBounces) {
      bounceMap.set(`${b.col},${b.row}`, b.offsetY);
    }

    // 타일맵 렌더링
    this.tilemap.render(ctx, this.camera.x, GAME_WIDTH, bounceMap);

    // ─── 깃발 렌더링 (하강 애니메이션 반영, 봉 왼쪽에 틈 없이 밀착) ───
    const flagScreenX = this.currentLevelConfig.flagpoleCol * TILE_SIZE - this.camera.x - 9;
    if (flagScreenX > -20 && flagScreenX < GAME_WIDTH + 20) {
      drawSprite(ctx, 'flag', flagScreenX, this.flagY);
    }

    // 버섯 렌더링
    for (const m of this.mushrooms) {
      m.render(ctx, this.camera.x);
    }

    // 코인 팝업
    for (const popup of this.coinPopups) {
      drawSprite(ctx, 'coin', popup.x - this.camera.x, popup.y);
    }

    // 파티클 렌더링
    for (const p of this.particles) {
      const screenX = p.x - this.camera.x;
      if (screenX >= -10 && screenX <= GAME_WIDTH + 10) {
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.floor(screenX), Math.floor(p.y), p.size, p.size);
      }
    }

    // 굼바
    for (const goomba of this.goombas) {
      if (!goomba.alive) continue;
      const screenX = goomba.pos.x - this.camera.x;
      if (screenX > -20 && screenX < GAME_WIDTH + 20) {
        goomba.render(ctx, this.camera.x);
      }
    }

    // Player (성문 안에 들어간 상태면 렌더링 생략)
    if (!this.marioInsideCastle) {
      this.player.render(ctx, this.camera.x);
    }

    // 스코어 팝업 (선명한 레트로 텍스트)
    ctx.font = "7px 'Press Start 2P', monospace";
    for (const popup of this.scorePopups) {
      const sx = popup.x - this.camera.x;
      ctx.fillStyle = '#101018';
      ctx.fillText(popup.text, sx + 1, popup.y + 1);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(popup.text, sx, popup.y);
    }

    // HUD (상단 점수/코인/생명/월드/타임)
    this.hud.render(ctx, this.player.score, this.player.coins, this.lives, GAME_WIDTH, GAME_HEIGHT, this.selectedGameOverOption);

    // 모바일 터치 컨트롤
    if (this.isMobile) {
      this.renderTouchControls(ctx);
    }

    ctx.restore();
  }

  /** 모바일 D-Pad + A/B 버튼 오버레이 */
  private renderTouchControls(ctx: CanvasRenderingContext2D): void {
    ctx.globalAlpha = 0.45;

    // D-Pad 배경
    ctx.fillStyle = '#181c28';
    ctx.beginPath();
    ctx.roundRect?.(10, 186, 70, 48, 6);
    ctx.fill();

    // 방향 화살표
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px monospace';
    ctx.fillText('◀', 15, 215);
    ctx.fillText('▶', 58, 215);
    ctx.fillText('▲', 37, 198);
    ctx.fillText('▼', 37, 230);

    // A 버튼 (점프)
    ctx.fillStyle = '#e52521';
    ctx.beginPath();
    ctx.arc(220, 210, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = "9px 'Press Start 2P', monospace";
    ctx.fillText('A', 216, 214);

    // B 버튼 (달리기)
    ctx.fillStyle = '#3880f8';
    ctx.beginPath();
    ctx.arc(182, 210, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = "9px 'Press Start 2P', monospace";
    ctx.fillText('B', 178, 214);

    ctx.globalAlpha = 1.0;
  }

  /** 배경 클래식 마리오 구름 */
  private renderClouds(ctx: CanvasRenderingContext2D): void {
    const cloudBases = [
      { x: 30, y: 40 },
      { x: 130, y: 48 },
      { x: 230, y: 36 },
    ];

    for (const base of cloudBases) {
      const cx = ((base.x * 2.5 - this.camera.x * 0.2) % (GAME_WIDTH + 140)) - 70;
      const cy = base.y;

      ctx.fillStyle = '#d0e0f8';
      ctx.beginPath();
      ctx.arc(cx, cy + 2, 10, 0, Math.PI * 2);
      ctx.arc(cx + 12, cy - 2, 13, 0, Math.PI * 2);
      ctx.arc(cx + 24, cy + 2, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.arc(cx + 12, cy - 4, 13, 0, Math.PI * 2);
      ctx.arc(cx + 24, cy, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#101018';
      ctx.fillRect(cx + 8, cy - 1, 2, 5);
      ctx.fillRect(cx + 14, cy - 1, 2, 5);
    }
  }

  /** 배경 클래식 마리오 언덕 */
  private renderHills(ctx: CanvasRenderingContext2D): void {
    const hillData = [
      { x: 0, w: 40, h: 22 },
      { x: 120, w: 60, h: 32 },
      { x: 250, w: 35, h: 18 },
    ];

    for (const hill of hillData) {
      const hx = ((hill.x * 2.8 - this.camera.x * 0.4) % (GAME_WIDTH + 180)) - 80;
      const hy = 208;

      ctx.fillStyle = '#00a800';
      ctx.beginPath();
      ctx.ellipse(hx, hy, hill.w, hill.h, 0, Math.PI, 0);
      ctx.fill();

      ctx.strokeStyle = '#101018';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#005800';
      ctx.fillRect(hx - 2, hy - hill.h * 0.6, 2, 4);
      ctx.fillRect(hx + 2, hy - hill.h * 0.6, 2, 4);
    }
  }

  /** 배경 클래식 마리오 초록 수풀 */
  private renderBushes(ctx: CanvasRenderingContext2D): void {
    const bushPositions = [
      { x: 45, w: 30 },
      { x: 160, w: 42 },
      { x: 280, w: 24 },
    ];

    for (const bush of bushPositions) {
      const bx = ((bush.x * 2.4 - this.camera.x * 0.6) % (GAME_WIDTH + 140)) - 60;
      const by = 208;

      ctx.fillStyle = '#00c800';
      ctx.beginPath();
      ctx.arc(bx, by, 7, 0, Math.PI * 2);
      ctx.arc(bx + 10, by - 3, 9, 0, Math.PI * 2);
      ctx.arc(bx + 20, by, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#005800';
      ctx.fillRect(bx - 7, by - 1, 34, 2);
    }
  }
}
