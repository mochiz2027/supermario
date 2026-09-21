/**
 * Sound — Web Audio API 칩튠 사운드 합성기
 * 
 * SUPER_MARIO_DEV_GUIDE.md §4 사양:
 * - 점프: 150→600Hz Square 0.15s
 * - 코인: 987Hz→1318Hz Sine
 * - 밟기: 120→40Hz Triangle 0.1s
 * - 사망: 500→100Hz 하강 아르페지오
 */

export class Sound {
  private ctx: AudioContext | null = null;

  /** AudioContext를 지연 초기화합니다 (사용자 상호작용 후) */
  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  /** 점프 효과음 */
  playJump(): void {
    const ctx = this.ensureContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  }

  /** 코인 획득 효과음 */
  playCoin(): void {
    const ctx = this.ensureContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987, ctx.currentTime);          // B5
    osc.frequency.setValueAtTime(1318, ctx.currentTime + 0.08);  // E6

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.33);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.33);
  }

  /** 적 밟기 효과음 */
  playStomp(): void {
    const ctx = this.ensureContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }

  /** 사망 효과음 (하강 아르페지오) */
  playDie(): void {
    const ctx = this.ensureContext();
    const notes = [500, 400, 300, 200, 100];
    const noteDuration = 0.12;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * noteDuration);

      gain.gain.setValueAtTime(0.12, ctx.currentTime + i * noteDuration);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (i + 1) * noteDuration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * noteDuration);
      osc.stop(ctx.currentTime + (i + 1) * noteDuration);
    });
  }

  /** 1UP / 파워업 효과음 */
  playPowerup(): void {
    const ctx = this.ensureContext();
    const notes = [330, 392, 659, 523, 587, 784]; // E4 G4 E5 C5 D5 G5
    const noteDuration = 0.08;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * noteDuration);

      gain.gain.setValueAtTime(0.14, ctx.currentTime + i * noteDuration);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (i + 1) * noteDuration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * noteDuration);
      osc.stop(ctx.currentTime + (i + 1) * noteDuration);
    });
  }

  /** 버섯 솟아오름 효과음 */
  playSprout(): void {
    const ctx = this.ensureContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  }

  /** 깃대 하강 효과음 (휘슬 슬라이드) */
  playFlagpole(): void {
    const ctx = this.ensureContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.6);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  }
}
