import { PathData, PathType } from './PathData';

/**
 * Cubic Bezier curve for smooth, curved fish movement
 * Exact port of C# BezierPath implementation
 */
export class BezierPath {
  private readonly p0: [number, number];
  private readonly p1: [number, number];
  private readonly p2: [number, number];
  private readonly p3: [number, number];
  private readonly fishId: number;
  private readonly seed: number;
  private readonly startTick: number;
  private readonly speed: number;

  constructor(
    fishId: number,
    seed: number,
    startTick: number,
    speed: number,
    p0: [number, number],
    p1: [number, number],
    p2: [number, number],
    p3: [number, number],
  ) {
    this.fishId = fishId;
    this.seed = seed;
    this.startTick = startTick;
    this.speed = speed;
    this.p0 = p0;
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
  }

  /**
   * Get position along the Bezier curve at normalized time t
   * Matches C# BezierPath.GetPosition (lines 28-48)
   * Formula: B(t) = (1-t)³P0 + 3(1-t)²tP1 + 3(1-t)t²P2 + t³P3
   */
  getPosition(t: number): [number, number] {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;

    const x =
      uuu * this.p0[0] + 3 * uu * t * this.p1[0] + 3 * u * tt * this.p2[0] + ttt * this.p3[0];

    const y =
      uuu * this.p0[1] + 3 * uu * t * this.p1[1] + 3 * u * tt * this.p2[1] + ttt * this.p3[1];

    return [x, y];
  }

  getPathType(): PathType {
    return PathType.Bezier;
  }

  /**
   * Get serializable path data
   * Matches C# BezierPath.GetPathData (lines 52-65)
   */
  getPathData(): PathData {
    const arcLength = this.approximateArcLength(20);

    return {
      fishId: this.fishId,
      pathType: PathType.Bezier,
      seed: this.seed,
      startTick: this.startTick,
      speed: this.speed,
      controlPoints: [this.p0, this.p1, this.p2, this.p3],
      duration: arcLength / this.speed,
      loop: false,
    };
  }

  /**
   * Approximate arc length using Simpson's rule
   * Matches C# BezierPath.ApproximateArcLength (lines 67-84)
   */
  private approximateArcLength(segments: number): number {
    let length = 0;
    let prevPoint = this.getPosition(0);

    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const point = this.getPosition(t);

      const dx = point[0] - prevPoint[0];
      const dy = point[1] - prevPoint[1];
      length += Math.sqrt(dx * dx + dy * dy);

      prevPoint = point;
    }

    return length;
  }
}
