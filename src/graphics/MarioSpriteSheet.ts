/**
 * MarioSpriteSheet — 사용자가 제공한 고화질 픽셀 아트 마리오 스프라이트 렌더러
 * - 사전 이미지 로딩 및 캐싱
 * - 발바닥(지면) 및 중심축 기준 픽셀 퍼펙트 안착
 * - 도트 깨짐 방지 및 부드러운 스케일링
 */

import { drawSprite as drawProceduralSprite } from './ProceduralSprite';

interface SpriteSpec {
  url: string;
  width: number;   // 게임 가상 좌표계 폭
  height: number;  // 게임 가상 좌표계 높이
}

const BASE_URL = (((import.meta as any).env?.BASE_URL as string) || '/').replace(/\/$/, '') + '/';

const MARIO_SPECS: Record<string, SpriteSpec> = {
  // 작은 마리오 (첨부 이미지의 깔끔한 단일 포즈: 너비 17, 높이 22)
  mario_small: { url: `${BASE_URL}sprites/mario/mario_small_custom.png`, width: 17, height: 22 },
  mario_idle: { url: `${BASE_URL}sprites/mario/mario_small_custom.png`, width: 17, height: 22 },
  mario_walk1: { url: `${BASE_URL}sprites/mario/mario_small_custom.png`, width: 17, height: 22 },
  mario_walk2: { url: `${BASE_URL}sprites/mario/mario_small_custom.png`, width: 17, height: 22 },
  mario_jump: { url: `${BASE_URL}sprites/mario/mario_small_custom.png`, width: 17, height: 22 },
  mario_run: { url: `${BASE_URL}sprites/mario/mario_small_custom.png`, width: 17, height: 22 },
  mario_die: { url: `${BASE_URL}sprites/mario/mario_small_custom.png`, width: 17, height: 22 },

  // 큰 마리오 (버섯 획득 시: 너비 28, 높이 36)
  mario_big: { url: `${BASE_URL}sprites/mario/mario_big_custom.png`, width: 28, height: 36 },
  mario_big_idle: { url: `${BASE_URL}sprites/mario/mario_big_custom.png`, width: 28, height: 36 },
  mario_big_walk1: { url: `${BASE_URL}sprites/mario/mario_big_custom.png`, width: 28, height: 36 },
  mario_big_walk2: { url: `${BASE_URL}sprites/mario/mario_big_custom.png`, width: 28, height: 36 },
  mario_big_jump: { url: `${BASE_URL}sprites/mario/mario_big_custom.png`, width: 28, height: 36 },
  mario_big_run: { url: `${BASE_URL}sprites/mario/mario_big_custom.png`, width: 28, height: 36 },
};

class MarioSpriteManager {
  private images = new Map<string, HTMLImageElement>();
  private loaded = new Map<string, boolean>();

  constructor() {
    this.preloadAll();
  }

  private preloadAll(): void {
    if (typeof window === 'undefined') return;

    for (const [name, spec] of Object.entries(MARIO_SPECS)) {
      const img = new Image();
      img.src = spec.url;
      img.onload = () => {
        this.loaded.set(name, true);
      };
      img.onerror = () => {
        console.warn(`Failed to load Mario sprite: ${spec.url}`);
        this.loaded.set(name, false);
      };
      this.images.set(name, img);
    }
  }

  /**
   * 마리오 캐릭터를 지면과 중심축에 맞추어 떨림 없이 선명하게 렌더링
   */
  draw(
    ctx: CanvasRenderingContext2D,
    name: string,
    playerX: number,
    playerY: number,
    playerWidth: number,
    playerHeight: number,
    flipX: boolean,
  ): void {
    const spec = MARIO_SPECS[name];
    const img = this.images.get(name);
    // 이미지가 캐시되어 이미 완전 로드되었거나 onload 콜백이 완료된 경우 모두 즉시 준비 상태로 인정
    const isReady = (this.loaded.get(name) || (img && img.complete && img.naturalWidth > 0)) && img && img.naturalWidth > 0;

    // 이미지가 준비되지 않았을 때는 안전한 프로시저럴 대체 스프라이트 출력
    if (!spec || !isReady || !img) {
      try {
        const fallback = name.startsWith('mario_big') ? 'mario_big_idle' : 'mario_idle';
        drawProceduralSprite(ctx, fallback, Math.floor(playerX) - 1, Math.floor(playerY), flipX);
      } catch (e) {
        // 렌더링 루프 중단 방지
      }
      return;
    }

    const spriteW = spec.width;
    const spriteH = spec.height;

    // 일관된 정수 좌표 계산 (지면 발바닥 및 중심 정렬)
    const drawX = Math.floor(playerX + (playerWidth - spriteW) / 2);
    const drawY = Math.floor(playerY + playerHeight - spriteH);

    ctx.save();
    // 다운스케일링 시 픽셀 튀김/떨림(aliasing jitter) 방지를 위해 부드러운 안티앨리어싱 적용
    ctx.imageSmoothingEnabled = true;
    (ctx as any).imageSmoothingQuality = 'high';

    if (flipX) {
      ctx.translate(drawX + spriteW, drawY);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0, spriteW, spriteH);
    } else {
      ctx.drawImage(img, drawX, drawY, spriteW, spriteH);
    }

    ctx.restore();
  }
}

export const marioSpriteManager = new MarioSpriteManager();
