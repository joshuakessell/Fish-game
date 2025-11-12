export interface PathData {
  fishId: number;
  pathType: 'linear' | 'sine' | 'bezier' | 'circular';
  seed: number;
  startTick: number;
  speed: number;
  controlPoints?: number[][];
}

export interface FishData {
  id: number;
  type: number;
  x: number;
  y: number;
  path?: PathData;
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
