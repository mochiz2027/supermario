/**
 * Collision — AABB 기반 타일맵 충돌 판정
 * 수평(X축) → 수직(Y축) 순차 해결 방식으로 침투를 보정합니다.
 */

import { Entity } from '../entities/Entity';

/** 타일 타입 정의 */
export const TILE_SIZE = 16;

export const enum TileType {
  EMPTY = 0,
  GROUND = 1,
  BRICK = 2,
  QUESTION = 3,
  EMPTY_BLOCK = 4,
  PIPE_TOP = 5,
  PIPE_BODY = 6,
  FLAGPOLE = 7,
  CASTLE_BRICK = 8,
  CASTLE_TOP = 9,
  CASTLE_DOOR = 10,  // 문은 통과 가능
  GROUND_BLUE = 11,
  BRICK_BLUE = 12,
}

/** 충돌이 있는(solid) 타일인지 판별 */
export function isSolid(tile: TileType): boolean {
  return (
    tile === TileType.GROUND ||
    tile === TileType.BRICK ||
    tile === TileType.QUESTION ||
    tile === TileType.EMPTY_BLOCK ||
    tile === TileType.PIPE_TOP ||
    tile === TileType.PIPE_BODY ||
    tile === TileType.CASTLE_BRICK ||
    tile === TileType.CASTLE_TOP ||
    tile === TileType.GROUND_BLUE ||
    tile === TileType.BRICK_BLUE
  );
}

export interface CollisionResult {
  collidedX: boolean;
  collidedY: boolean;
  /** 아래에서 천장을 타격한 타일 좌표 (headbonk) */
  headbonkTile: { col: number; row: number } | null;
  /** 바닥에 착지했는지 */
  onGround: boolean;
}

/**
 * 엔티티의 X축 이동 후 타일맵 충돌을 해결합니다.
 */
function resolveX(
  entity: Entity,
  tilemap: TileType[][],
  mapWidth: number,
  mapHeight: number,
): boolean {
  let collided = false;

  const left = Math.floor(entity.pos.x / TILE_SIZE);
  const right = Math.floor((entity.pos.x + entity.width - 1) / TILE_SIZE);
  const top = Math.floor(entity.pos.y / TILE_SIZE);
  const bottom = Math.floor((entity.pos.y + entity.height - 1) / TILE_SIZE);

  for (let row = top; row <= bottom; row++) {
    for (let col = left; col <= right; col++) {
      if (col < 0 || col >= mapWidth || row < 0 || row >= mapHeight) continue;
      const tile = tilemap[row]?.[col];
      if (tile === undefined || !isSolid(tile)) continue;

      // ─── 코너 레지 어시스트 (Ledge Assist) ───
      // 발끝이 타일 상단 5px 이내에 살짝 걸치고 위쪽 타일이 비어있다면, 튕겨내지 않고 위로 자연스럽게 스텝 업!
      const penetrationY = (entity.pos.y + entity.height) - (row * TILE_SIZE);
      const aboveTile = row > 0 ? tilemap[row - 1]?.[col] : undefined;
      const isAboveEmpty = aboveTile === undefined || !isSolid(aboveTile);

      if (penetrationY > 0 && penetrationY <= 5 && isAboveEmpty) {
        entity.pos.y = row * TILE_SIZE - entity.height;
        continue; // X축 충돌을 발생시키지 않고 발판 위로 매끄럽게 올라탐
      }

      // 침투 보정
      if (entity.vel.x > 0) {
        // 오른쪽 이동 → 왼쪽 벽에 부딪힘
        entity.pos.x = col * TILE_SIZE - entity.width;
        entity.vel.x = 0;
        collided = true;
      } else if (entity.vel.x < 0) {
        // 왼쪽 이동 → 오른쪽 벽에 부딪힘
        entity.pos.x = (col + 1) * TILE_SIZE;
        entity.vel.x = 0;
        collided = true;
      }
    }
  }

  return collided;
}

/**
 * 엔티티의 Y축 이동 후 타일맵 충돌을 해결합니다.
 */
function resolveY(
  entity: Entity,
  tilemap: TileType[][],
  mapWidth: number,
  mapHeight: number,
): { collided: boolean; onGround: boolean; headbonkTile: { col: number; row: number } | null } {
  let collided = false;
  let onGround = false;
  let headbonkTile: { col: number; row: number } | null = null;

  const left = Math.floor(entity.pos.x / TILE_SIZE);
  const right = Math.floor((entity.pos.x + entity.width - 1) / TILE_SIZE);
  const top = Math.floor(entity.pos.y / TILE_SIZE);
  const bottom = Math.floor((entity.pos.y + entity.height - 1) / TILE_SIZE);

  for (let row = top; row <= bottom; row++) {
    for (let col = left; col <= right; col++) {
      if (col < 0 || col >= mapWidth || row < 0 || row >= mapHeight) continue;
      const tile = tilemap[row]?.[col];
      if (tile === undefined || !isSolid(tile)) continue;

      if (entity.vel.y > 0) {
        // 하강 중 → 바닥 착지
        entity.pos.y = row * TILE_SIZE - entity.height;
        entity.vel.y = 0;
        onGround = true;
        collided = true;
      } else if (entity.vel.y < 0) {
        // 상승 중 → 천장 타격 (Headbonk)
        entity.pos.y = (row + 1) * TILE_SIZE;
        entity.vel.y = 0;
        collided = true;
        headbonkTile = { col, row };
      }
    }
  }

  return { collided, onGround, headbonkTile };
}

/**
 * 엔티티를 이동시키고 타일맵 충돌을 X→Y 순서로 해결합니다.
 */
export function moveAndCollide(
  entity: Entity,
  tilemap: TileType[][],
  mapWidth: number,
  mapHeight: number,
): CollisionResult {
  // X축 이동 및 충돌
  entity.pos.x += entity.vel.x;
  const collidedX = resolveX(entity, tilemap, mapWidth, mapHeight);

  // Y축 이동 및 충돌
  entity.pos.y += entity.vel.y;
  const yResult = resolveY(entity, tilemap, mapWidth, mapHeight);

  return {
    collidedX,
    collidedY: yResult.collided,
    headbonkTile: yResult.headbonkTile,
    onGround: yResult.onGround,
  };
}
