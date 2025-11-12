import { PathData } from "../systems/paths/PathData";

export interface FishData {
  id: number;
  type: number;
  x: number;
  y: number;
  path?: PathData;
  isNewSpawn?: boolean;
}

export interface PlayerData {
  slot: number;
  userId: string;
  name: string;
  credits: number;
  betValue: number;
}

export interface BulletData {
  id: number;
  ownerId: string;
  x: number;
  y: number;
  directionX: number;
  directionY: number;
}

export interface GameStateUpdate {
  tick: number;
  fish: FishData[];
  bullets: BulletData[];
  players: PlayerData[];
}
