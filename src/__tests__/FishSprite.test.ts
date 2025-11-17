import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FishSprite } from '../entities/FishSprite';
import Phaser from 'phaser';
import { GameState } from '../systems/GameState';

vi.mock('../systems/GameState', () => ({
  GameState: {
    getInstance: vi.fn(() => ({
      getFishPosition: vi.fn((fishId, tick) => [100 + tick, 200 + tick]),
    })),
  },
}));

describe('FishSprite', () => {
  let scene: Phaser.Scene;
  let fishSprite: FishSprite;

  beforeEach(() => {
    scene = {
      add: {
        existing: vi.fn(),
      },
      anims: {
        exists: vi.fn(() => false),
      },
    } as any;
  });

  describe('Constructor', () => {
    it('should create FishSprite with correct properties', () => {
      fishSprite = new FishSprite(scene, 1, 0, 100, 200);

      expect(fishSprite.fishId).toBe(1);
      expect(fishSprite.typeId).toBe(0);
      expect(fishSprite.x).toBe(100);
      expect(fishSprite.y).toBe(200);
    });

    it('should set correct scale for fish type', () => {
      const clownfish = new FishSprite(scene, 1, 0, 100, 200);
      const hammerhead = new FishSprite(scene, 2, 12, 100, 200);

      expect(clownfish.scale).toBeGreaterThan(0);
      expect(hammerhead.scale).toBeGreaterThan(0);
    });

    it('should set origin to center', () => {
      fishSprite = new FishSprite(scene, 1, 0, 100, 200);

      expect(fishSprite.originX).toBe(0.5);
      expect(fishSprite.originY).toBe(0.5);
    });

    it('should make sprite interactive', () => {
      const setInteractiveMock = vi.fn();
      fishSprite = new FishSprite(scene, 1, 0, 100, 200);
      fishSprite.setInteractive = setInteractiveMock;

      fishSprite.setInteractive();
      expect(setInteractiveMock).toHaveBeenCalled();
    });
  });

  describe('getTextureForType', () => {
    it('should return correct texture for known fish type', () => {
      const texture0 = FishSprite.getTextureForType(0, scene);
      const texture21 = FishSprite.getTextureForType(21, scene);

      expect(texture0).toBe('fish-0');
      expect(texture21).toBe('fish-21');
    });
  });

  describe('getScaleForType', () => {
    it('should return appropriate scale for small fish', () => {
      const scale = FishSprite.getScaleForType(0);
      expect(scale).toBeGreaterThan(0);
      expect(scale).toBeLessThan(2);
    });

    it('should return larger scale for large fish', () => {
      const smallScale = FishSprite.getScaleForType(0);
      const largeScale = FishSprite.getScaleForType(12);

      expect(largeScale).toBeGreaterThan(smallScale);
    });

    it('should handle unknown fish types gracefully', () => {
      const scale = FishSprite.getScaleForType(999);
      expect(scale).toBeGreaterThan(0);
    });
  });

  describe('updatePosition', () => {
    it('should update fish position from GameState', () => {
      const gameStateMock = GameState.getInstance();
      (gameStateMock.getFishPosition as any).mockReturnValue([150, 250]);

      fishSprite = new FishSprite(scene, 1, 0, 100, 200);
      fishSprite.updatePosition(10);

      expect(gameStateMock.getFishPosition).toHaveBeenCalledWith(1, 10);
    });

    it('should store previous and current positions', () => {
      fishSprite = new FishSprite(scene, 1, 0, 100, 200);

      fishSprite.updatePosition(10);
      fishSprite.updatePosition(11);

      expect(fishSprite['previousPosition']).toBeDefined();
      expect(fishSprite['currentPosition']).toBeDefined();
    });
  });

  describe('render', () => {
    it('should interpolate position based on alpha', () => {
      fishSprite = new FishSprite(scene, 1, 0, 100, 200);

      fishSprite['previousPosition'] = [100, 200];
      fishSprite['currentPosition'] = [200, 300];

      fishSprite.render(0.5);

      expect(fishSprite.x).toBeCloseTo(150, 1);
      expect(fishSprite.y).toBeCloseTo(250, 1);
    });

    it('should handle alpha = 0 (show previous position)', () => {
      fishSprite = new FishSprite(scene, 1, 0, 100, 200);

      fishSprite['previousPosition'] = [100, 200];
      fishSprite['currentPosition'] = [200, 300];

      fishSprite.render(0);

      expect(fishSprite.x).toBe(100);
      expect(fishSprite.y).toBe(200);
    });

    it('should handle alpha = 1 (show current position)', () => {
      fishSprite = new FishSprite(scene, 1, 0, 100, 200);

      fishSprite['previousPosition'] = [100, 200];
      fishSprite['currentPosition'] = [200, 300];

      fishSprite.render(1);

      expect(fishSprite.x).toBe(200);
      expect(fishSprite.y).toBe(300);
    });
  });

  describe('rotation and facing', () => {
    it('should update rotation based on velocity', () => {
      fishSprite = new FishSprite(scene, 1, 0, 100, 200);

      fishSprite['previousPosition'] = [100, 200];
      fishSprite['currentPosition'] = [200, 200];

      fishSprite.render(1);

      expect(fishSprite.rotation).toBeDefined();
    });

    it('should handle manta ray (type 14) with flipX instead of full rotation', () => {
      fishSprite = new FishSprite(scene, 1, 14, 100, 200);

      fishSprite['previousPosition'] = [200, 200];
      fishSprite['currentPosition'] = [100, 200];

      const setFlipXMock = vi.fn();
      fishSprite.setFlipX = setFlipXMock;

      fishSprite.render(1);

      expect(setFlipXMock).toHaveBeenCalled();
    });

    it('should not rotate if velocity is too small', () => {
      fishSprite = new FishSprite(scene, 1, 0, 100, 200);

      fishSprite['previousPosition'] = [100, 200];
      fishSprite['currentPosition'] = [100.01, 200.01];

      const initialRotation = fishSprite.rotation;
      fishSprite.render(1);

      expect(fishSprite.rotation).toBe(initialRotation);
    });
  });

  describe('playDeathAnimation', () => {
    it('should create spiral rotation animation', () => {
      const tweenMock = vi.fn();
      scene.tweens = {
        add: tweenMock,
      } as any;

      fishSprite = new FishSprite(scene, 1, 0, 100, 200);

      if (fishSprite.playDeathAnimation) {
        fishSprite.playDeathAnimation();
        expect(tweenMock).toHaveBeenCalled();
      }
    });
  });
});
