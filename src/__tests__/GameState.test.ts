import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameState } from '../systems/GameState';

describe('GameState', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = GameState.getInstance();
    gameState.fish.clear();
    gameState.bullets.clear();
    gameState.players.clear();
    gameState.currentTick = 0;
    gameState.isSynced = false;
  });

  afterEach(() => {
    if (gameState.connection) {
      gameState.connection.stop();
    }
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = GameState.getInstance();
      const instance2 = GameState.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('Betting System', () => {
    it('should initialize with default bet value', () => {
      expect(gameState.currentBet).toBe(10);
    });

    it('should have correct min and max bet values', () => {
      expect(gameState.MIN_BET).toBe(10);
      expect(gameState.MAX_BET).toBe(200);
      expect(gameState.BET_INCREMENT).toBe(10);
    });

    it('should allow setting bet within valid range', () => {
      gameState.currentBet = 50;
      expect(gameState.currentBet).toBe(50);

      gameState.currentBet = 10;
      expect(gameState.currentBet).toBe(10);

      gameState.currentBet = 200;
      expect(gameState.currentBet).toBe(200);
    });
  });

  describe('Fish Management', () => {
    it('should start with empty fish collection', () => {
      expect(gameState.fish.size).toBe(0);
    });

    it('should add fish to collection', () => {
      const fishData = {
        id: 1,
        type: 0,
        x: 100,
        y: 200,
        path: null,
        isNewSpawn: true,
      };

      gameState.fish.set(1, fishData);

      expect(gameState.fish.size).toBe(1);
      expect(gameState.fish.get(1)).toBe(fishData);
    });

    it('should remove fish from collection', () => {
      const fishData = {
        id: 1,
        type: 0,
        x: 100,
        y: 200,
        path: null,
        isNewSpawn: true,
      };

      gameState.fish.set(1, fishData);
      expect(gameState.fish.size).toBe(1);

      gameState.fish.delete(1);
      expect(gameState.fish.size).toBe(0);
    });
  });

  describe('Bullet Management', () => {
    it('should start with empty bullets collection', () => {
      expect(gameState.bullets.size).toBe(0);
    });

    it('should add bullet to collection', () => {
      const bulletData = {
        id: 1,
        x: 100,
        y: 200,
        directionX: 1,
        directionY: 0,
        ownerId: 'player1',
        clientNonce: 'nonce1',
        targetFishId: null,
      };

      gameState.bullets.set(1, bulletData);

      expect(gameState.bullets.size).toBe(1);
      expect(gameState.bullets.get(1)).toBe(bulletData);
    });

    it('should remove bullet from collection', () => {
      const bulletData = {
        id: 1,
        x: 100,
        y: 200,
        directionX: 1,
        directionY: 0,
        ownerId: 'player1',
        clientNonce: 'nonce1',
        targetFishId: null,
      };

      gameState.bullets.set(1, bulletData);
      expect(gameState.bullets.size).toBe(1);

      gameState.bullets.delete(1);
      expect(gameState.bullets.size).toBe(0);
    });
  });

  describe('Player Management', () => {
    it('should start with empty players collection', () => {
      expect(gameState.players.size).toBe(0);
    });

    it('should add player to collection', () => {
      const playerData = {
        playerId: 'player1',
        displayName: 'Test Player',
        credits: 1000,
        cannonLevel: 1,
        playerSlot: 0,
        totalKills: 0,
        betValue: 10,
      };

      gameState.players.set(0, playerData);

      expect(gameState.players.size).toBe(1);
      expect(gameState.players.get(0)).toBe(playerData);
    });

    it('should update player data', () => {
      const playerData = {
        playerId: 'player1',
        displayName: 'Test Player',
        credits: 1000,
        cannonLevel: 1,
        playerSlot: 0,
        totalKills: 0,
        betValue: 10,
      };

      gameState.players.set(0, playerData);

      const updatedData = {
        ...playerData,
        credits: 1500,
        totalKills: 5,
      };

      gameState.players.set(0, updatedData);

      expect(gameState.players.get(0)?.credits).toBe(1500);
      expect(gameState.players.get(0)?.totalKills).toBe(5);
    });
  });

  describe('Tick Synchronization', () => {
    it('should initialize with tick 0', () => {
      expect(gameState.currentTick).toBe(0);
    });

    it('should track sync status', () => {
      expect(gameState.isSynced).toBe(false);

      gameState.isSynced = true;
      expect(gameState.isSynced).toBe(true);
    });

    it('should track tick drift', () => {
      expect(gameState.tickDrift).toBe(0);

      gameState.tickDrift = 3;
      expect(gameState.tickDrift).toBe(3);
    });

    it('should have tick drift threshold defined', () => {
      expect(gameState['TICK_DRIFT_THRESHOLD']).toBeDefined();
      expect(gameState['TICK_DRIFT_THRESHOLD']).toBeGreaterThan(0);
    });
  });

  describe('FishPathManager Integration', () => {
    it('should have fishPathManager instance', () => {
      expect(gameState.fishPathManager).toBeDefined();
      expect(gameState.fishPathManager).not.toBeNull();
    });

    it('should be able to get fish position', () => {
      const mockPosition = [100, 200];
      gameState.fishPathManager.getFishPosition = vi.fn(() => mockPosition as [number, number]);

      const position = gameState.getFishPosition(1, 10);

      expect(gameState.fishPathManager.getFishPosition).toHaveBeenCalledWith(1, 10);
      expect(position).toEqual(mockPosition);
    });
  });

  describe('Event Callbacks', () => {
    it('should support fish spawned callback', () => {
      const callback = vi.fn();
      gameState.onFishSpawned = callback;

      if (gameState.onFishSpawned) {
        gameState.onFishSpawned(1, 0);
      }

      expect(callback).toHaveBeenCalledWith(1, 0);
    });

    it('should support fish removed callback', () => {
      const callback = vi.fn();
      gameState.onFishRemoved = callback;

      if (gameState.onFishRemoved) {
        gameState.onFishRemoved(1);
      }

      expect(callback).toHaveBeenCalledWith(1);
    });

    it('should support payout event callback', () => {
      const callback = vi.fn();
      gameState.onPayoutEvent = callback;

      if (gameState.onPayoutEvent) {
        gameState.onPayoutEvent(1, 100, 0, true);
      }

      expect(callback).toHaveBeenCalledWith(1, 100, 0, true);
    });

    it('should support credits changed callback', () => {
      const callback = vi.fn();
      gameState.onCreditsChanged = callback;

      if (gameState.onCreditsChanged) {
        gameState.onCreditsChanged();
      }

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('Player Authentication', () => {
    it('should start with no player auth', () => {
      expect(gameState.playerAuth).toBeNull();
    });

    it('should store player auth data', () => {
      const authData = {
        userId: 'user1',
        name: 'Test User',
        token: 'test-token',
        credits: 1000,
        isGuest: true,
      };

      gameState.playerAuth = authData;

      expect(gameState.playerAuth).toEqual(authData);
    });
  });

  describe('Connection Status', () => {
    it('should start disconnected', () => {
      expect(gameState.isConnected).toBe(false);
    });

    it('should track connection status', () => {
      gameState.isConnected = true;
      expect(gameState.isConnected).toBe(true);

      gameState.isConnected = false;
      expect(gameState.isConnected).toBe(false);
    });
  });

  describe('Player Slot', () => {
    it('should start with no assigned slot', () => {
      expect(gameState.myPlayerSlot).toBeNull();
    });

    it('should allow setting player slot', () => {
      gameState.myPlayerSlot = 2;
      expect(gameState.myPlayerSlot).toBe(2);
    });

    it('should allow valid slot numbers 0-5', () => {
      for (let i = 0; i < 6; i++) {
        gameState.myPlayerSlot = i;
        expect(gameState.myPlayerSlot).toBe(i);
      }
    });
  });
});
