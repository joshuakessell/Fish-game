import { PathData, PathType } from './PathData';
import { LinearPath } from './LinearPath';
import { SinePath } from './SinePath';
import { BezierPath } from './BezierPath';
import { CircularPath } from './CircularPath';

/**
 * Utility to compute fish positions from PathData
 * Hydrates the correct path class and evaluates position at any time
 */
export class PathComputer {
  /**
   * Compute position from PathData at a specific tick
   * @param pathData The path data received from server
   * @param currentTick Current game tick
   * @returns Position [x, y] or null if unable to compute
   */
  static computePosition(pathData: PathData, currentTick: number): [number, number] | null {
    if (!pathData || !pathData.controlPoints || pathData.controlPoints.length === 0) {
      return null;
    }

    const elapsedTicks = currentTick - pathData.startTick;
    if (elapsedTicks < 0) {
      return null;
    }

    // CRITICAL: Must match server tick rate (MatchInstance.TARGET_TPS = 30)
    const ticksPerSecond = 30;
    const elapsedSeconds = elapsedTicks / ticksPerSecond;
    
    let t = elapsedSeconds / pathData.duration;

    if (pathData.loop) {
      t = t % 1.0;
    } else {
      if (t > 1.0) {
        t = 1.0;
      }
    }

    return this.evaluatePathAtTime(pathData, t);
  }

  /**
   * Evaluate the path at normalized time t (0.0 to 1.0)
   * @param pathData The path data
   * @param t Normalized time (0.0 to 1.0)
   * @returns Position [x, y] or null if unable to compute
   */
  static evaluatePathAtTime(pathData: PathData, t: number): [number, number] | null {
    try {
      switch (pathData.pathType) {
        case PathType.Linear:
          return this.evaluateLinear(pathData, t);
        
        case PathType.Sine:
          return this.evaluateSine(pathData, t);
        
        case PathType.Bezier:
          return this.evaluateBezier(pathData, t);
        
        case PathType.Circular:
          return this.evaluateCircular(pathData, t);
        
        default:
          console.warn(`Unknown path type: ${pathData.pathType}`);
          return null;
      }
    } catch (error) {
      console.error('Error computing path position:', error);
      return null;
    }
  }

  private static evaluateLinear(pathData: PathData, t: number): [number, number] | null {
    if (pathData.controlPoints.length < 2) {
      return null;
    }

    const start: [number, number] = [pathData.controlPoints[0][0], pathData.controlPoints[0][1]];
    const end: [number, number] = [pathData.controlPoints[1][0], pathData.controlPoints[1][1]];

    const path = new LinearPath(
      pathData.fishId,
      pathData.seed,
      pathData.startTick,
      pathData.speed,
      start,
      end
    );

    return path.getPosition(t);
  }

  private static evaluateSine(pathData: PathData, t: number): [number, number] | null {
    if (pathData.controlPoints.length < 3) {
      return null;
    }

    const start: [number, number] = [pathData.controlPoints[0][0], pathData.controlPoints[0][1]];
    const end: [number, number] = [pathData.controlPoints[1][0], pathData.controlPoints[1][1]];
    const amplitude = pathData.controlPoints[2][0];
    const frequency = pathData.controlPoints[2][1];

    const path = new SinePath(
      pathData.fishId,
      pathData.seed,
      pathData.startTick,
      pathData.speed,
      start,
      end,
      amplitude,
      frequency
    );

    return path.getPosition(t);
  }

  private static evaluateBezier(pathData: PathData, t: number): [number, number] | null {
    if (pathData.controlPoints.length < 4) {
      return null;
    }

    const p0: [number, number] = [pathData.controlPoints[0][0], pathData.controlPoints[0][1]];
    const p1: [number, number] = [pathData.controlPoints[1][0], pathData.controlPoints[1][1]];
    const p2: [number, number] = [pathData.controlPoints[2][0], pathData.controlPoints[2][1]];
    const p3: [number, number] = [pathData.controlPoints[3][0], pathData.controlPoints[3][1]];

    const path = new BezierPath(
      pathData.fishId,
      pathData.seed,
      pathData.startTick,
      pathData.speed,
      p0,
      p1,
      p2,
      p3
    );

    return path.getPosition(t);
  }

  private static evaluateCircular(pathData: PathData, t: number): [number, number] | null {
    if (pathData.controlPoints.length < 3) {
      return null;
    }

    const center: [number, number] = [pathData.controlPoints[0][0], pathData.controlPoints[0][1]];
    const radiusX = pathData.controlPoints[1][0];
    const radiusY = pathData.controlPoints[1][1];
    const startAngle = pathData.controlPoints[2][0];
    const clockwise = pathData.controlPoints[2][1] === 1;

    const path = new CircularPath(
      pathData.fishId,
      pathData.seed,
      pathData.startTick,
      pathData.speed,
      center,
      radiusX,
      radiusY,
      startAngle,
      clockwise
    );

    return path.getPosition(t);
  }
}
