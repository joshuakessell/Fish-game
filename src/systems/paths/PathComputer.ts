import Phaser from 'phaser';
import { PathData, PathType } from './PathData';
import { debugLog } from '../../config/DebugConfig';

/**
 * Utility to compute fish positions from PathData using Phaser.Curves API
 * Evaluates position at any time using deterministic curve calculations
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
      console.warn(`PathComputer: No valid pathData or controlPoints for fish ${pathData?.fishId}`);
      return null;
    }

    const elapsedTicks = currentTick - pathData.startTick;
    if (elapsedTicks < 0) {
      console.warn(
        `PathComputer: Negative elapsed ticks for fish ${pathData.fishId}: currentTick=${currentTick}, startTick=${pathData.startTick}`,
      );
      return null;
    }

    // CRITICAL: Must match server tick rate (MatchInstance.TARGET_TPS = 30)
    const ticksPerSecond = 30;
    const elapsedSeconds = elapsedTicks / ticksPerSecond;

    let t = elapsedSeconds / pathData.duration;

    // VALIDATION: Check for progress anomalies
    if (t > 1.1) {
      console.error(
        `[VALIDATION] Path progress exceeds 110%: ${(t * 100).toFixed(2)}% | Fish: ${pathData.fishId} | Elapsed: ${elapsedSeconds.toFixed(2)}s | Duration: ${pathData.duration.toFixed(2)}s | CurrentTick: ${currentTick} | StartTick: ${pathData.startTick}`,
      );
      debugLog(
        'validation',
        `[PROG ANOMALY] t: ${(t * 100).toFixed(2)}%, FishId: ${pathData.fishId}, Elapsed: ${elapsedSeconds.toFixed(2)}s, Duration: ${pathData.duration.toFixed(2)}s, Loop: ${pathData.loop}`,
      );
    }

    // Handle paths that exceed duration
    if (t > 1.0) {
      if (pathData.loop) {
        // Looping paths: wrap t to [0,1) range while avoiding zero-collapse at exact multiples
        // Using subtraction instead of modulo prevents t=0 when elapsed time is an exact multiple
        t -= Math.floor(t);
      } else {
        // Non-looping paths: clamp to endpoint for late-joiners
        t = 1.0;
      }
    }

    const position = this.evaluatePathAtTime(pathData, t);
    debugLog(
      'pathComputation',
      `PathComputer: fish ${pathData.fishId} at t=${t.toFixed(3)}, pos=${position ? `(${position[0].toFixed(1)}, ${position[1].toFixed(1)})` : 'null'}`,
    );
    return position;
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

    // Create Phaser.Curves.Line from control points
    const start = new Phaser.Math.Vector2(pathData.controlPoints[0][0], pathData.controlPoints[0][1]);
    const end = new Phaser.Math.Vector2(pathData.controlPoints[1][0], pathData.controlPoints[1][1]);

    const curve = new Phaser.Curves.Line(start, end);
    const point = curve.getPoint(t);

    return [point.x, point.y];
  }

  private static evaluateSine(pathData: PathData, t: number): [number, number] | null {
    if (pathData.controlPoints.length < 3) {
      return null;
    }

    // Extract control points
    const start = pathData.controlPoints[0];
    const end = pathData.controlPoints[1];
    const amplitude = pathData.controlPoints[2][0];
    const frequency = pathData.controlPoints[2][1];

    // Calculate base position along straight line (using Phaser.Curves.Line for consistency)
    const baseLine = new Phaser.Curves.Line(
      new Phaser.Math.Vector2(start[0], start[1]),
      new Phaser.Math.Vector2(end[0], end[1])
    );
    const basePoint = baseLine.getPoint(t);

    // Calculate perpendicular direction
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const length = Math.sqrt(dx * dx + dy * dy);
    
    const perpX = -dy / length;
    const perpY = dx / length;

    // Apply sine wave offset
    const offset = Math.sin(t * frequency * Math.PI * 2) * amplitude;

    return [basePoint.x + perpX * offset, basePoint.y + perpY * offset];
  }

  private static evaluateBezier(pathData: PathData, t: number): [number, number] | null {
    if (pathData.controlPoints.length < 4) {
      return null;
    }

    // Create Phaser.Curves.CubicBezier from control points
    const p0 = new Phaser.Math.Vector2(pathData.controlPoints[0][0], pathData.controlPoints[0][1]);
    const p1 = new Phaser.Math.Vector2(pathData.controlPoints[1][0], pathData.controlPoints[1][1]);
    const p2 = new Phaser.Math.Vector2(pathData.controlPoints[2][0], pathData.controlPoints[2][1]);
    const p3 = new Phaser.Math.Vector2(pathData.controlPoints[3][0], pathData.controlPoints[3][1]);

    const curve = new Phaser.Curves.CubicBezier(p0, p1, p2, p3);
    const point = curve.getPoint(t);

    return [point.x, point.y];
  }

  private static evaluateCircular(pathData: PathData, t: number): [number, number] | null {
    if (pathData.controlPoints.length < 3) {
      return null;
    }

    // Extract control points
    const centerX = pathData.controlPoints[0][0];
    const centerY = pathData.controlPoints[0][1];
    const radiusX = pathData.controlPoints[1][0];
    const radiusY = pathData.controlPoints[1][1];
    const startAngle = pathData.controlPoints[2][0];
    const clockwise = pathData.controlPoints[2][1] === 1;

    // Calculate angle (matching server logic exactly for determinism)
    let angle = startAngle + t * Math.PI * 2;
    if (clockwise) {
      angle = startAngle - t * Math.PI * 2;
    }

    // Calculate position on ellipse at the computed angle
    // Note: We use direct math instead of Phaser.Curves.Ellipse.getPoint() to ensure
    // exact deterministic matching with server calculations
    const x = centerX + Math.cos(angle) * radiusX;
    const y = centerY + Math.sin(angle) * radiusY;

    return [x, y];
  }
}
