/**
 * Input — 키보드 / 가상 터치 입력 핸들러
 * 현재 프레임에서 키의 눌림 상태와, 이번 프레임에 새로 눌린(justPressed) 상태를 추적합니다.
 */

export type GameKey = 'left' | 'right' | 'up' | 'down' | 'jump' | 'run' | 'confirm' | 'option1' | 'option2';

const KEY_MAP: Record<string, GameKey> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
  KeyA: 'left',
  KeyD: 'right',
  KeyW: 'up',
  KeyS: 'down',
  Space: 'jump',
  Enter: 'confirm',
  NumpadEnter: 'confirm',
  Digit1: 'option1',
  Numpad1: 'option1',
  Digit2: 'option2',
  Numpad2: 'option2',
  KeyX: 'jump',
  KeyC: 'jump',
  ShiftLeft: 'run',
  ShiftRight: 'run',
  KeyZ: 'run',
  KeyJ: 'run',
  KeyK: 'jump',
};

export class Input {
  private held = new Set<GameKey>();
  private pressed = new Set<GameKey>();
  private _released = new Set<GameKey>();

  constructor() {
    window.addEventListener('keydown', (e) => {
      // code 및 key 둘 다 검사 (스페이스바 및 한글 IME 상태 완벽 호환)
      let mapped = KEY_MAP[e.code];
      if (!mapped) {
        if (e.key === ' ' || e.key === 'Spacebar') mapped = 'jump';
        else if (e.key === 'Enter') mapped = 'confirm';
        else if (e.key === '1') mapped = 'option1';
        else if (e.key === '2') mapped = 'option2';
        else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') mapped = 'up';
        else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') mapped = 'down';
        else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') mapped = 'left';
        else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') mapped = 'right';
      }

      if (mapped) {
        e.preventDefault();
        if (!this.held.has(mapped)) {
          this.pressed.add(mapped);
        }
        this.held.add(mapped);
      }
    });

    window.addEventListener('keyup', (e) => {
      let mapped = KEY_MAP[e.code];
      if (!mapped) {
        if (e.key === ' ' || e.key === 'Spacebar') mapped = 'jump';
        else if (e.key === 'Enter') mapped = 'confirm';
        else if (e.key === '1') mapped = 'option1';
        else if (e.key === '2') mapped = 'option2';
        else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') mapped = 'up';
        else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') mapped = 'down';
        else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') mapped = 'left';
        else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') mapped = 'right';
      }

      if (mapped) {
        e.preventDefault();
        this.held.delete(mapped);
        this._released.add(mapped);
      }
    });
  }

  /** 매 프레임 끝에서 호출 — justPressed / justReleased 초기화 */
  endFrame(): void {
    this.pressed.clear();
    this._released.clear();
  }

  /** 키가 현재 눌려있는지 */
  isHeld(key: GameKey): boolean {
    return this.held.has(key);
  }

  /** 이번 프레임에 새로 눌렸는지 */
  isJustPressed(key: GameKey): boolean {
    return this.pressed.has(key);
  }

  /** 이번 프레임에 떼어졌는지 */
  isJustReleased(key: GameKey): boolean {
    return this._released.has(key);
  }

  /** 가상 키 주입 (모바일 터치 컨트롤 등) */
  injectKey(key: GameKey, isDown: boolean): void {
    if (isDown) {
      if (!this.held.has(key)) {
        this.pressed.add(key);
      }
      this.held.add(key);
    } else {
      this.held.delete(key);
      this._released.add(key);
    }
  }
}
