/**
 * HUD — 상단 점수/코인/생명/월드/시간 렌더러 + 게임 상태 오버레이
 * - 생명(LIVES) 3개 시스템
 * - 게임 오버 시 [이어서 하기] / [처음부터 다시 하기] 선택 UI
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
  private dyingTimer: number = 0;
  private isGameOverPending: boolean = false;
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

  /** 사망 시작 (생명 소진 여부 전달) */
  startDying(isGameOver: boolean): void {
    this.gamePhase = GamePhase.DYING;
    this.dyingTimer = 0;
    this.isGameOverPending = isGameOver;
  }

  /** 사망 상태 업데이트 */
  updateDying(): 'none' | 'respawn' | 'game_over' {
    if (this.gamePhase !== GamePhase.DYING) return 'none';
    this.dyingTimer++;
    // 약 130프레임 (약 2.1초) 사망 도약 후 다음 상태 전환
    if (this.dyingTimer >= 130) {
      if (this.isGameOverPending) {
        this.gamePhase = GamePhase.GAME_OVER;
        return 'game_over';
      } else {
        this.gamePhase = GamePhase.PLAYING;
        return 'respawn';
      }
    }
    return 'none';
  }

  /** 구멍 낙하 등 즉각적인 사망 시 */
  triggerGameOverImmediately(isGameOver: boolean): void {
    this.startDying(isGameOver);
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
    this.dyingTimer = 0;
    this.stageClearTimer = 0;
    this.stageClearTimeBonus = false;
  }

  /** HUD 렌더 */
  render(
    ctx: CanvasRenderingContext2D,
    score: number,
    coins: number,
    lives: number,
    gameWidth: number,
    gameHeight: number,
    selectedGameOverOption: number = 0,
  ): void {
    // 반투명 HUD 헤더 바 (세련된 비네팅)
    const gradient = ctx.createLinearGradient(0, 0, 0, 30);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
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

    // 1. MARIO + 점수
    drawPixelText('MARIO', 14, 12, '#ffffff', 8);
    drawPixelText(String(score).padStart(6, '0'), 14, 22, '#ffffff', 8);

    const drawPixelHeart = (hx: number, hy: number) => {
      // 레트로 픽셀 하트 (그림자 포함)
      ctx.fillStyle = '#101018';
      ctx.fillRect(hx + 1, hy + 1, 3, 2);
      ctx.fillRect(hx + 5, hy + 1, 3, 2);
      ctx.fillRect(hx + 1, hy + 3, 7, 2);
      ctx.fillRect(hx + 2, hy + 5, 5, 1);
      ctx.fillRect(hx + 3, hy + 6, 3, 1);
      ctx.fillRect(hx + 4, hy + 7, 1, 1);

      ctx.fillStyle = lives > 1 ? '#e52521' : '#ff4444';
      ctx.fillRect(hx, hy, 3, 2);
      ctx.fillRect(hx + 4, hy, 3, 2);
      ctx.fillRect(hx, hy + 2, 7, 2);
      ctx.fillRect(hx + 1, hy + 4, 5, 1);
      ctx.fillRect(hx + 2, hy + 5, 3, 1);
      ctx.fillRect(hx + 3, hy + 6, 1, 1);
    };

    // 2. LIVES (남은 생명 총 3개)
    drawPixelText('LIVES', 72, 12, '#f85858', 7);
    drawPixelHeart(72, 16);
    drawPixelText(`×${Math.max(0, lives)}`, 82, 22, lives > 1 ? '#ffffff' : '#ff7777', 8);

    // 3. 코인 아이콘 + 개수
    drawSprite(ctx, 'coin', 114, 12);
    drawPixelText(`×${String(coins).padStart(2, '0')}`, 130, 22, '#f8d838', 8);

    // 4. WORLD
    drawPixelText('WORLD', 166, 12, '#ffffff', 8);
    drawPixelText(this.world, 174, 22, '#ffffff', 8);

    // 5. TIME
    drawPixelText('TIME', 212, 12, '#ffffff', 8);
    drawPixelText(String(this.time).padStart(3, '0'), 216, 22, '#f8a850', 8);

    // ─── 게임 오버 오버레이 (이어서 하기 / 처음부터 다시 하기) ───
    if (this.gamePhase === GamePhase.GAME_OVER) {
      ctx.fillStyle = 'rgba(10, 10, 18, 0.88)';
      ctx.fillRect(0, 0, gameWidth, gameHeight);

      // 타이틀
      const title = 'GAME OVER';
      drawPixelText(title, Math.floor(gameWidth / 2 - (title.length * 12) / 2), 52, '#e52521', 12);

      const stageInfo = `REACHED WORLD ${this.world}`;
      drawPixelText(stageInfo, Math.floor(gameWidth / 2 - (stageInfo.length * 6) / 2), 70, '#f8d838', 6);

      const scoreInfo = `FINAL SCORE: ${score}`;
      drawPixelText(scoreInfo, Math.floor(gameWidth / 2 - (scoreInfo.length * 6) / 2), 84, '#aaaaaa', 6);

      // 옵션 1: [1] 이어서 하기 (CONTINUE)
      const opt1X = 26;
      const opt1Y = 106;
      const btnW = 204;
      const btnH = 32;

      // 옵션 1 박스
      ctx.fillStyle = selectedGameOverOption === 0 ? 'rgba(248, 216, 56, 0.22)' : 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(opt1X, opt1Y, btnW, btnH);
      ctx.strokeStyle = selectedGameOverOption === 0 ? '#f8d838' : '#444455';
      ctx.lineWidth = selectedGameOverOption === 0 ? 2 : 1;
      ctx.strokeRect(opt1X, opt1Y, btnW, btnH);

      const opt1Text = selectedGameOverOption === 0 ? '▶ 1. 이어서 하기' : '   1. 이어서 하기';
      drawPixelText(opt1Text, opt1X + 12, opt1Y + 14, selectedGameOverOption === 0 ? '#f8d838' : '#cccccc', 7);
      drawPixelText(`현재 ${this.world}부터 생명 3개로 재도전`, opt1X + 24, opt1Y + 25, selectedGameOverOption === 0 ? '#ffffff' : '#888888', 5);

      // 옵션 2: [2] 처음부터 다시 하기 (RESTART)
      const opt2X = 26;
      const opt2Y = 146;

      ctx.fillStyle = selectedGameOverOption === 1 ? 'rgba(248, 216, 56, 0.22)' : 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(opt2X, opt2Y, btnW, btnH);
      ctx.strokeStyle = selectedGameOverOption === 1 ? '#f8d838' : '#444455';
      ctx.lineWidth = selectedGameOverOption === 1 ? 2 : 1;
      ctx.strokeRect(opt2X, opt2Y, btnW, btnH);

      const opt2Text = selectedGameOverOption === 1 ? '▶ 2. 처음부터 다시' : '   2. 처음부터 다시';
      drawPixelText(opt2Text, opt2X + 12, opt2Y + 14, selectedGameOverOption === 1 ? '#f8d838' : '#cccccc', 7);
      drawPixelText('1-1부터 점수 초기화 후 새로 시작', opt2X + 24, opt2Y + 25, selectedGameOverOption === 1 ? '#ffffff' : '#888888', 5);

      // 조작 가이드 안내
      const guide1 = '▲/▼ : 선택     SPACE/ENTER : 결정';
      drawPixelText(guide1, Math.floor(gameWidth / 2 - (guide1.length * 6) / 2), 196, '#a0a0b8', 6);
      const guide2 = '[1]번 키: 이어서    [2]번 키: 처음부터';
      drawPixelText(guide2, Math.floor(gameWidth / 2 - (guide2.length * 6) / 2), 210, '#f8d838', 6);
      const guide3 = '(화면 버튼을 마우스/터치로 직접 클릭 가능)';
      drawPixelText(guide3, Math.floor(gameWidth / 2 - (guide3.length * 5) / 2), 224, '#777788', 5);
    }

    // ─── 스테이지 클리어 오버레이 ─────────
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
