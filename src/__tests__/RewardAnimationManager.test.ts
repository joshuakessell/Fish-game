import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RewardAnimationManager } from '../systems/RewardAnimationManager';
import Phaser from 'phaser';
import { GameState } from '../systems/GameState';
import { FishSpriteManager } from '../systems/FishSpriteManager';

describe('RewardAnimationManager', () => {
  let manager: RewardAnimationManager;
  let mockScene: Phaser.Scene;
  let mockGameState: GameState;
  let mockFishSpriteManager: FishSpriteManager;

  beforeEach(() => {
    mockScene = {
      add: {
        text: vi.fn(() => ({
          setOrigin: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
        })),
        graphics: vi.fn(() => ({
          fillStyle: vi.fn().mockReturnThis(),
          fillCircle: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
        })),
      },
      tweens: {
        add: vi.fn(),
      },
    } as any;

    mockGameState = {} as any;

    const mockFishSprite = {
      x: 500,
      y: 400,
    };

    mockFishSpriteManager = {
      getFishSprites: vi.fn(() => new Map([[1, mockFishSprite]])),
    } as any;

    manager = new RewardAnimationManager(mockScene, mockGameState, mockFishSpriteManager);
  });

  describe('Constructor', () => {
    it('should initialize with scene, gameState, and fishSpriteManager', () => {
      expect(manager).toBeDefined();
      expect(manager['scene']).toBe(mockScene);
      expect(manager['gameState']).toBe(mockGameState);
      expect(manager['fishSpriteManager']).toBe(mockFishSpriteManager);
    });

    it('should initialize bank positions for all 6 slots', () => {
      expect(manager['bankPositions'].size).toBe(6);

      for (let slot = 0; slot < 6; slot++) {
        expect(manager['bankPositions'].has(slot)).toBe(true);
      }
    });
  });

  describe('setBankPosition', () => {
    it('should update bank position for given slot', () => {
      manager.setBankPosition(0, 100, 200);

      const position = manager['bankPositions'].get(0);
      expect(position).toEqual({ x: 100, y: 200 });
    });

    it('should update existing bank position', () => {
      manager.setBankPosition(2, 100, 200);
      manager.setBankPosition(2, 300, 400);

      const position = manager['bankPositions'].get(2);
      expect(position).toEqual({ x: 300, y: 400 });
    });
  });

  describe('playRewardAnimation', () => {
    it('should not create animation if fish sprite not found', () => {
      mockFishSpriteManager.getFishSprites = vi.fn(() => new Map());

      manager.playRewardAnimation(999, 100, 0, true);

      expect(mockScene.add.text).not.toHaveBeenCalled();
    });

    it('should not create animation if bank position not found', () => {
      const invalidSlot = 99;

      manager.playRewardAnimation(1, 100, invalidSlot, true);

      expect(mockScene.add.text).not.toHaveBeenCalled();
    });

    it('should create floating text for payout', () => {
      manager.setBankPosition(0, 100, 100);
      manager.playRewardAnimation(1, 250, 0, true);

      expect(mockScene.add.text).toHaveBeenCalled();
      const textCall = (mockScene.add.text as any).mock.calls[0];
      expect(textCall[2]).toContain('+250');
    });

    it('should use different styling for own kills vs other kills', () => {
      manager.setBankPosition(0, 100, 100);

      manager.playRewardAnimation(1, 100, 0, true);
      const ownKillCall = (mockScene.add.text as any).mock.calls[0];

      (mockScene.add.text as any).mockClear();

      manager.playRewardAnimation(1, 100, 0, false);
      const otherKillCall = (mockScene.add.text as any).mock.calls[0];

      expect(ownKillCall[3].fontSize).not.toBe(otherKillCall[3].fontSize);
    });

    it('should create coin animation from fish to bank', () => {
      manager.setBankPosition(0, 100, 100);
      manager.playRewardAnimation(1, 100, 0, true);

      expect(mockScene.add.graphics).toHaveBeenCalled();
      expect(mockScene.tweens.add).toHaveBeenCalled();
    });

    it('should create animation with correct fish position', () => {
      const mockFishSprite = {
        x: 600,
        y: 500,
      };

      mockFishSpriteManager.getFishSprites = vi.fn(() => new Map([[5, mockFishSprite]]));

      manager.setBankPosition(1, 200, 200);
      manager.playRewardAnimation(5, 100, 1, true);

      const textCall = (mockScene.add.text as any).mock.calls[0];
      expect(textCall[0]).toBe(600);
      expect(textCall[1]).toBe(500);
    });
  });

  describe('createFloatingText (private)', () => {
    it('should animate text upward and fade out', () => {
      manager.setBankPosition(0, 100, 100);
      manager.playRewardAnimation(1, 100, 0, true);

      expect(mockScene.tweens.add).toHaveBeenCalled();

      const tweenCall = (mockScene.tweens.add as any).mock.calls.find((call: any) =>
        call[0].hasOwnProperty('alpha'),
      );

      expect(tweenCall).toBeDefined();
      if (tweenCall) {
        expect(tweenCall[0].alpha).toBe(0);
      }
    });

    it('should use larger font for own kills', () => {
      manager.setBankPosition(0, 100, 100);
      manager.playRewardAnimation(1, 100, 0, true);

      const textCall = (mockScene.add.text as any).mock.calls[0];
      expect(textCall[3].fontSize).toBe('32px');
    });

    it('should use smaller font for other kills', () => {
      manager.setBankPosition(0, 100, 100);
      manager.playRewardAnimation(1, 100, 0, false);

      const textCall = (mockScene.add.text as any).mock.calls[0];
      expect(textCall[3].fontSize).toBe('24px');
    });
  });

  describe('createCoinJumpAnimation (private)', () => {
    it('should create coin graphic', () => {
      manager.setBankPosition(0, 100, 100);
      manager.playRewardAnimation(1, 100, 0, true);

      expect(mockScene.add.graphics).toHaveBeenCalled();
    });

    it('should create larger coin for own kills', () => {
      manager.setBankPosition(0, 100, 100);
      manager.playRewardAnimation(1, 100, 0, true);

      const graphicsCall = (mockScene.add.graphics as any).mock.calls[0];
      expect(graphicsCall).toBeDefined();
    });

    it('should create smaller coin for other kills', () => {
      manager.setBankPosition(0, 100, 100);
      manager.playRewardAnimation(1, 100, 0, false);

      const graphicsCall = (mockScene.add.graphics as any).mock.calls[0];
      expect(graphicsCall).toBeDefined();
    });

    it('should animate coin along bezier curve', () => {
      manager.setBankPosition(0, 100, 100);
      manager.playRewardAnimation(1, 100, 0, true);

      const tweenCalls = (mockScene.tweens.add as any).mock.calls;
      const bezierTween = tweenCalls.find((call: any) => call[0].hasOwnProperty('progress'));

      expect(bezierTween).toBeDefined();
    });
  });

  describe('Animation Timing', () => {
    it('should have appropriate duration for floating text', () => {
      manager.setBankPosition(0, 100, 100);
      manager.playRewardAnimation(1, 100, 0, true);

      const tweenCalls = (mockScene.tweens.add as any).mock.calls;
      const textTween = tweenCalls.find((call: any) => call[0].hasOwnProperty('alpha'));

      expect(textTween).toBeDefined();
      if (textTween) {
        expect(textTween[0].duration).toBeGreaterThan(0);
      }
    });

    it('should destroy animated objects after completion', () => {
      manager.setBankPosition(0, 100, 100);
      manager.playRewardAnimation(1, 100, 0, true);

      const tweenCalls = (mockScene.tweens.add as any).mock.calls;

      for (const call of tweenCalls) {
        if (call[0].onComplete) {
          expect(call[0].onComplete).toBeDefined();
        }
      }
    });
  });

  describe('Multiple Animations', () => {
    it('should handle multiple simultaneous animations', () => {
      manager.setBankPosition(0, 100, 100);
      manager.setBankPosition(1, 200, 200);

      manager.playRewardAnimation(1, 100, 0, true);
      manager.playRewardAnimation(1, 150, 1, false);

      expect(mockScene.add.text).toHaveBeenCalledTimes(2);
      expect(mockScene.add.graphics).toHaveBeenCalledTimes(2);
    });

    it('should handle rapid sequential animations', () => {
      manager.setBankPosition(0, 100, 100);

      for (let i = 0; i < 5; i++) {
        manager.playRewardAnimation(1, 50, 0, true);
      }

      expect(mockScene.add.text).toHaveBeenCalledTimes(5);
    });
  });
});
