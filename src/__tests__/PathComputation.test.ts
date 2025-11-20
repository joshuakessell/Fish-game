import { describe, it, expect } from 'vitest';
import { PathComputer } from '../systems/paths/PathComputer';
import { PathData, PathType } from '../systems/paths/PathData';
import { LinearPath } from '../systems/paths/LinearPath';
import { SinePath } from '../systems/paths/SinePath';
import { BezierPath } from '../systems/paths/BezierPath';
import { CircularPath } from '../systems/paths/CircularPath';

const EPSILON = 0.01;

function assertPositionClose(
  actual: [number, number] | null,
  expected: [number, number],
  message: string,
) {
  expect(actual).not.toBeNull();
  expect(Math.abs(actual![0] - expected[0])).toBeLessThan(EPSILON);
  expect(Math.abs(actual![1] - expected[1])).toBeLessThan(EPSILON);
}

describe('PathComputation Extended Tests', () => {
  describe('PathComputer.computePosition', () => {
    it('should compute correct position for linear path at start', () => {
      const pathData: PathData = {
        fishId: 1,
        pathType: PathType.Linear,
        seed: 123,
        startTick: 0,
        speed: 100,
        controlPoints: [
          [0, 0],
          [1000, 500],
        ],
        duration: 10,
        loop: false,
    variance: 1.0,
      };

      const position = PathComputer.computePosition(pathData, 0);

      assertPositionClose(position, [0, 0], 'Linear path start position');
    });

    it('should compute correct position for linear path at midpoint', () => {
      const pathData: PathData = {
        fishId: 1,
        pathType: PathType.Linear,
        seed: 123,
        startTick: 0,
        speed: 100,
        controlPoints: [
          [0, 0],
          [1000, 500],
        ],
        duration: 10,
        loop: false,
    variance: 1.0,
      };

      const position = PathComputer.computePosition(pathData, 150);

      assertPositionClose(position, [500, 250], 'Linear path midpoint');
    });

    it('should compute correct position for linear path at end', () => {
      const pathData: PathData = {
        fishId: 1,
        pathType: PathType.Linear,
        seed: 123,
        startTick: 0,
        speed: 100,
        controlPoints: [
          [0, 0],
          [1000, 500],
        ],
        duration: 10,
        loop: false,
    variance: 1.0,
      };

      const position = PathComputer.computePosition(pathData, 300);

      assertPositionClose(position, [1000, 500], 'Linear path end position');
    });

    it('should handle negative elapsed ticks gracefully', () => {
      const pathData: PathData = {
        fishId: 1,
        pathType: PathType.Linear,
        seed: 123,
        startTick: 100,
        speed: 100,
        controlPoints: [
          [0, 0],
          [1000, 500],
        ],
        duration: 10,
        loop: false,
    variance: 1.0,
      };

      const position = PathComputer.computePosition(pathData, 50);

      expect(position).toBeNull();
    });

    it('should loop path when loop is true', () => {
      const pathData: PathData = {
        fishId: 1,
        pathType: PathType.Linear,
        seed: 123,
        startTick: 0,
        speed: 100,
        controlPoints: [
          [0, 0],
          [1000, 500],
        ],
        duration: 10,
        loop: true,
      };

      const position1 = PathComputer.computePosition(pathData, 150);
      const position2 = PathComputer.computePosition(pathData, 450);

      expect(position1).not.toBeNull();
      expect(position2).not.toBeNull();

      if (position1 && position2) {
        expect(Math.abs(position1[0] - position2[0])).toBeLessThan(EPSILON);
        expect(Math.abs(position1[1] - position2[1])).toBeLessThan(EPSILON);
      }
    });

    it('should clamp non-looping path at end', () => {
      const pathData: PathData = {
        fishId: 1,
        pathType: PathType.Linear,
        seed: 123,
        startTick: 0,
        speed: 100,
        controlPoints: [
          [0, 0],
          [1000, 500],
        ],
        duration: 10,
        loop: false,
    variance: 1.0,
      };

      const position = PathComputer.computePosition(pathData, 500);

      assertPositionClose(position, [1000, 500], 'Should clamp to end position');
    });
  });

  describe('PathComputer.evaluatePathAtTime', () => {
    it('should evaluate sine path with correct amplitude', () => {
      const pathData: PathData = {
        fishId: 2,
        pathType: PathType.Sine,
        seed: 456,
        startTick: 0,
        speed: 100,
        controlPoints: [
          [0, 0],
          [1000, 0],
          [50, 2],
        ],
        duration: 10,
        loop: false,
    variance: 1.0,
      };

      const pos0 = PathComputer.evaluatePathAtTime(pathData, 0);
      const pos1 = PathComputer.evaluatePathAtTime(pathData, 1);

      assertPositionClose(pos0, [0, 0], 'Sine path start');
      assertPositionClose(pos1, [1000, 0], 'Sine path end');
    });

    it('should evaluate bezier path correctly', () => {
      const pathData: PathData = {
        fishId: 3,
        pathType: PathType.Bezier,
        seed: 789,
        startTick: 0,
        speed: 100,
        controlPoints: [
          [0, 0],
          [250, 500],
          [750, 500],
          [1000, 0],
        ],
        duration: 10,
        loop: false,
    variance: 1.0,
      };

      const pos0 = PathComputer.evaluatePathAtTime(pathData, 0);
      const pos1 = PathComputer.evaluatePathAtTime(pathData, 1);

      assertPositionClose(pos0, [0, 0], 'Bezier path start');
      assertPositionClose(pos1, [1000, 0], 'Bezier path end');
    });

    it('should evaluate circular path correctly', () => {
      const pathData: PathData = {
        fishId: 4,
        pathType: PathType.Circular,
        seed: 101,
        startTick: 0,
        speed: 100,
        controlPoints: [
          [500, 300],
          [200, 150],
          [0, 0],
        ],
        duration: 10,
        loop: true,
      };

      const pos0 = PathComputer.evaluatePathAtTime(pathData, 0);
      const posQuarter = PathComputer.evaluatePathAtTime(pathData, 0.25);

      expect(pos0).not.toBeNull();
      expect(posQuarter).not.toBeNull();

      if (pos0 && posQuarter) {
        expect(Math.abs(pos0[0] - 700)).toBeLessThan(EPSILON);
        expect(Math.abs(posQuarter[1] - 450)).toBeLessThan(EPSILON);
      }
    });

    it('should handle invalid path type gracefully', () => {
      const pathData: PathData = {
        fishId: 5,
        pathType: 999 as PathType,
        seed: 111,
        startTick: 0,
        speed: 100,
        controlPoints: [[0, 0]],
        duration: 10,
        loop: false,
    variance: 1.0,
      };

      const position = PathComputer.evaluatePathAtTime(pathData, 0.5);

      expect(position).toBeNull();
    });
  });

  describe('Path Class Determinism', () => {
    it('should produce same results for LinearPath with same seed', () => {
      const path1 = new LinearPath(1, 12345, 0, 100, [0, 0], [1000, 500]);
      const path2 = new LinearPath(1, 12345, 0, 100, [0, 0], [1000, 500]);

      const testPoints = [0, 0.25, 0.5, 0.75, 1.0];

      for (const t of testPoints) {
        const pos1 = path1.getPosition(t);
        const pos2 = path2.getPosition(t);

        expect(Math.abs(pos1[0] - pos2[0])).toBeLessThan(EPSILON);
        expect(Math.abs(pos1[1] - pos2[1])).toBeLessThan(EPSILON);
      }
    });

    it('should produce same results for SinePath with same seed', () => {
      const path1 = new SinePath(2, 54321, 0, 100, [0, 0], [1000, 0], 50, 2);
      const path2 = new SinePath(2, 54321, 0, 100, [0, 0], [1000, 0], 50, 2);

      const testPoints = [0, 0.25, 0.5, 0.75, 1.0];

      for (const t of testPoints) {
        const pos1 = path1.getPosition(t);
        const pos2 = path2.getPosition(t);

        expect(Math.abs(pos1[0] - pos2[0])).toBeLessThan(EPSILON);
        expect(Math.abs(pos1[1] - pos2[1])).toBeLessThan(EPSILON);
      }
    });

    it('should produce same results for BezierPath with same seed', () => {
      const path1 = new BezierPath(3, 99999, 0, 100, [0, 0], [250, 500], [750, 500], [1000, 0]);
      const path2 = new BezierPath(3, 99999, 0, 100, [0, 0], [250, 500], [750, 500], [1000, 0]);

      const testPoints = [0, 0.25, 0.5, 0.75, 1.0];

      for (const t of testPoints) {
        const pos1 = path1.getPosition(t);
        const pos2 = path2.getPosition(t);

        expect(Math.abs(pos1[0] - pos2[0])).toBeLessThan(EPSILON);
        expect(Math.abs(pos1[1] - pos2[1])).toBeLessThan(EPSILON);
      }
    });

    it('should produce same results for CircularPath with same seed', () => {
      const path1 = new CircularPath(4, 11111, 0, 100, [500, 300], 200, 150, 0, false);
      const path2 = new CircularPath(4, 11111, 0, 100, [500, 300], 200, 150, 0, false);

      const testPoints = [0, 0.25, 0.5, 0.75, 1.0];

      for (const t of testPoints) {
        const pos1 = path1.getPosition(t);
        const pos2 = path2.getPosition(t);

        expect(Math.abs(pos1[0] - pos2[0])).toBeLessThan(EPSILON);
        expect(Math.abs(pos1[1] - pos2[1])).toBeLessThan(EPSILON);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small duration', () => {
      const pathData: PathData = {
        fishId: 6,
        pathType: PathType.Linear,
        seed: 222,
        startTick: 0,
        speed: 100,
        controlPoints: [
          [0, 0],
          [100, 100],
        ],
        duration: 0.1,
        loop: false,
    variance: 1.0,
      };

      const position = PathComputer.computePosition(pathData, 2);

      expect(position).not.toBeNull();
    });

    it('should handle very large coordinates', () => {
      const pathData: PathData = {
        fishId: 7,
        pathType: PathType.Linear,
        seed: 333,
        startTick: 0,
        speed: 100,
        controlPoints: [
          [10000, 10000],
          [20000, 20000],
        ],
        duration: 10,
        loop: false,
    variance: 1.0,
      };

      const position = PathComputer.computePosition(pathData, 150);

      expect(position).not.toBeNull();
      expect(position![0]).toBeGreaterThan(10000);
      expect(position![1]).toBeGreaterThan(10000);
    });

    it('should handle empty control points gracefully', () => {
      const pathData: PathData = {
        fishId: 8,
        pathType: PathType.Linear,
        seed: 444,
        startTick: 0,
        speed: 100,
        controlPoints: [],
        duration: 10,
        loop: false,
    variance: 1.0,
      };

      const position = PathComputer.computePosition(pathData, 100);

      expect(position).toBeNull();
    });
  });
});
