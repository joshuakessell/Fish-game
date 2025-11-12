import { PathData } from '../systems/paths/PathData';

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
  playerId: string;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  timestamp: number;
}

export interface GameStateUpdate {
  tick: number;
  fish: FishData[];
  bullets: BulletData[];
  players: PlayerData[];
}
