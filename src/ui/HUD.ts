/**
 * HUD — 상단 점수/코인/월드/시간 렌더러 + 게임 상태 오버레이
 * Phase 5: 카운트다운 타이머, 게임 오버 화면, 스테이지 클리어 화면
 */

import { drawSprite } from '../graphics/ProceduralSprite';

export const enum GamePhase {
  PLAYING,
  DYING,
  GAME_OVER,
  STAGE_CLEAR,
}

export class HUD {
  public gamePhase: GamePhase = GamePhase.PLAYING;
  public time: number = 400;        // 게임 내 타임
  public world: string = '1-1';

  private timeAccumulator: number = 0;
  private gameOverTimer: number = 0;
  private stageClearTimer: number = 0;
  private stageClearTimeBonus: boolean = false;

  /** 매 프레임 타이머 업데이트 (타임 카운트다운) */
  updateTime(): void {
    if (this.gamePhase !== GamePhase.PLAYING) return;

    this.timeAccumulator++;
    // 약 24프레임(0.4초)마다 1초씩 감소 (SMB 원작 기준)
    if (this.timeAccumulator >= 24) {
      this.timeAccumulator = 0;
      if (this.time > 0) {
        this.time--;
      }
    }
  }

  /** 사망 상태 업데이트 */
  updateDying(): boolean {
    if (this.gamePhase !== GamePhase.DYING) return false;
    this.gameOverTimer++;
    // 3초 후 게임 오버
    if (this.gameOverTimer >= 180) {
      this.gamePhase = GamePhase.GAME_OVER;
      return true;
    }
    return false;
  }

  /** 스테이지 클리어 업데이트 — 남은 시간 보너스 점수 전환 */
  updateStageClear(): number {
    if (this.gamePhase !== GamePhase.STAGE_CLEAR) return 0;
    this.stageClearTimer++;

    // 1초 대기 후 시간 보너스 전환 시작
    if (this.stageClearTimer > 60 && !this.stageClearTimeBonus) {
      this.stageClearTimeBonus = true;
    }

    if (this.stageClearTimeBonus && this.time > 0) {
      // 매 프레임 시간 2씩 감소, 점수 50씩 추가
      const decrement = Math.min(this.time, 2);
      this.time -= decrement;
      return decrement * 50; // 반환된 보너스 점수
    }
    return 0;
  }

  /** 사망 시작 */
  startDying(): void {
    this.gamePhase = GamePhase.DYING;
    this.gameOverTimer = 0;
  }

  /** 구멍 낙하 등으로 즉시 게임 오버 전환 */
  triggerGameOverImmediately(): void {
    this.gamePhase = GamePhase.GAME_OVER;
    this.gameOverTimer = 0;
  }

  /** 스테이지 클리어 시작 */
  startStageClear(): void {
    this.gamePhase = GamePhase.STAGE_CLEAR;
    this.stageClearTimer = 0;
    this.stageClearTimeBonus = false;
  }

  /** 리셋 */
  reset(): void {
    this.gamePhase = GamePhase.PLAYING;
    this.time = 400;
    this.timeAccumulator = 0;
    this.gameOverTimer = 0;
    this.stageClearTimer = 0;
    this.stageClearTimeBonus = false;
  }

  /** HUD 렌더 */
  render(
    ctx: CanvasRenderingContext2D,
    score: number,
    coins: number,
    gameWidth: number,
    gameHeight: number,
  ): void {
    // 반투명 HUD 헤더 바 (세련된 비네팅)
    const gradient = ctx.createLinearGradient(0, 0, 0, 30);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, gameWidth, 30);

    const drawPixelText = (text: string, x: number, y: number, color = '#fcfcfc', size = 8) => {
      ctx.font = `${size}px 'Press Start 2P', monospace, sans-serif`;
      // 선명한 레트로 텍스트 그림자
      ctx.fillStyle = '#101018';
      ctx.fillText(text, x + 1, y + 1);
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
    };

    // MARIO + 점수
    drawPixelText('MARIO', 16, 12, '#ffffff', 8);
    drawPixelText(String(score).padStart(6, '0'), 16, 22, '#ffffff', 8);

    // 코인 아이콘 + 개수
    drawSprite(ctx, 'coin', 88, 12);
    drawPixelText(`×${String(coins).padStart(2, '0')}`, 104, 22, '#f8d838', 8);

    // WORLD
    drawPixelText('WORLD', 148, 12, '#ffffff', 8);
    drawPixelText(this.world, 158, 22, '#ffffff', 8);

    // TIME
    drawPixelText('TIME', 204, 12, '#ffffff', 8);
    drawPixelText(String(this.time).padStart(3, '0'), 208, 22, '#f8a850', 8);

    // 게임 오버 오버레이
    if (this.gamePhase === GamePhase.GAME_OVER) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, 0, gameWidth, gameHeight);
      
      const title = 'GAME OVER';
      drawPixelText(title, Math.floor(gameWidth / 2 - (title.length * 10) / 2), gameHeight / 2 - 12, '#e52521', 10);
      
      const sub = 'PRESS SPACE TO RESTART';
      drawPixelText(sub, Math.floor(gameWidth / 2 - (sub.length * 6) / 2), gameHeight / 2 + 16, '#fcfcfc', 6);
    }

    // 스테이지 클리어 오버레이
    if (this.gamePhase === GamePhase.STAGE_CLEAR) {
      if (this.stageClearTimer > 30) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(0, gameHeight / 2 - 45, gameWidth, 90);

        if (this.world === '1-5' && this.time === 0) {
          // 5라운드 최종 올클리어 축하
          const winText = '★ ALL CLEARED! ★';
          drawPixelText(winText, Math.floor(gameWidth / 2 - (winText.length * 9) / 2), gameHeight / 2 - 20, '#f8d838', 9);
          const congrats = 'THANK YOU MARIO!';
          drawPixelText(congrats, Math.floor(gameWidth / 2 - (congrats.length * 7) / 2), gameHeight / 2 - 4, '#ffffff', 7);
          const restartText = 'PRESS SPACE TO PLAY AGAIN';
          drawPixelText(restartText, Math.floor(gameWidth / 2 - (restartText.length * 6) / 2), gameHeight / 2 + 20, '#3880f8', 6);
        } else {
          const clearText = 'COURSE CLEAR!';
          drawPixelText(clearText, Math.floor(gameWidth / 2 - (clearText.length * 9) / 2), gameHeight / 2 - 18, '#f8d838', 9);

          if (this.stageClearTimeBonus) {
            const bonusText = `TIME BONUS: ${this.time * 50}`;
            drawPixelText(bonusText, Math.floor(gameWidth / 2 - (bonusText.length * 7) / 2), gameHeight / 2 + 3, '#ffffff', 7);
          }
          if (this.time === 0 && this.stageClearTimer > 100) {
            const contText = 'PRESS SPACE FOR NEXT WORLD';
            drawPixelText(contText, Math.floor(gameWidth / 2 - (contText.length * 6) / 2), gameHeight / 2 + 22, '#3880f8', 6);
          }
        }
      }
    }
  }
}
