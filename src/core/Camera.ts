/**
 * Camera — 횡스크롤 추적 카메라 + 좌측 스크롤 락
 * 플레이어를 화면의 1/3 지점에 위치시키고, 왼쪽으로는 스크롤되지 않습니다.
 */

export class Camera {
  public x: number = 0;

  /** 카메라가 추적할 목표 위치를 업데이트합니다 */
  update(
    playerX: number,
    viewWidth: number,
    worldWidth: number,
  ): void {
    // 플레이어가 화면의 1/3 지점에 위치하도록 추적
    const targetX = playerX - viewWidth / 3;

    // 좌측 스크롤 락: 카메라는 현재 위치보다 왼쪽으로 돌아가지 않음
    if (targetX > this.x) {
      this.x = targetX;
    }

    // 경계 제한
    if (this.x < 0) this.x = 0;
    const maxX = worldWidth - viewWidth;
    if (maxX > 0 && this.x > maxX) {
      this.x = maxX;
    }
  }

  /** 플레이어가 카메라 왼쪽 경계를 넘지 못하게 제한합니다 */
  clampPlayerLeft(playerX: number): number {
    return Math.max(playerX, this.x);
  }
}
