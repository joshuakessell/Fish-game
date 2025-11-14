import { PathDataTuple } from "../systems/paths/PathData";

// MessagePack array format from server: [id, type, x, y, path, isNewSpawn]
export type FishData = [
  number,        // [0] id
  number,        // [1] type
  number,        // [2] x
  number,        // [3] y
  PathDataTuple | null, // [4] path (raw array from server)
  boolean        // [5] isNewSpawn
];

export interface PlayerData {
  slot: number;
  userId: string;
  name: string;
  credits: number;
  betValue: number;
}

// MessagePack array format from server: [id, x, y, directionX, directionY, ownerId, clientNonce, targetFishId]
export type BulletData = [
  number,  // [0] id
  number,  // [1] x
  number,  // [2] y
  number,  // [3] directionX
  number,  // [4] directionY
  string,  // [5] ownerId
  string,  // [6] clientNonce
  number | null  // [7] targetFishId
];

export interface GameStateUpdate {
  tick: number;
  fish: FishData[];
  bullets: BulletData[];
  players: PlayerData[];
}
