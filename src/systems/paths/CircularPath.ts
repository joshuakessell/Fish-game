import { PathData, PathType } from './PathData';

/**
 * Circular or elliptical movement pattern
 * Exact port of C# CircularPath implementation
 */
export class CircularPath {
  private readonly center: [number, number];
  private readonly radiusX: number;
  private readonly radiusY: number;
  private readonly startAngle: number;
  private readonly clockwise: boolean;
  private readonly fishId: number;
  private readonly seed: number;
  private readonly startTick: number;
  private readonly speed: number;

  constructor(
    fishId: number,
    seed: number,
    startTick: number,
    speed: number,
    center: [number, number],
    radiusX: number,
    radiusY: number,
    startAngle: number,
    clockwise: boolean,
  ) {
    this.fishId = fishId;
    this.seed = seed;
    this.startTick = startTick;
    this.speed = speed;
    this.center = center;
    this.radiusX = radiusX;
    this.radiusY = radiusY;
    this.startAngle = startAngle;
    this.clockwise = clockwise;
  }

  /**
   * Get position along the circular/elliptical path at normalized time t
   * Matches C# CircularPath.GetPosition (lines 32-43)
   */
  getPosition(t: number): [number, number] {
    let angle = this.startAngle + t * Math.PI * 2;
    if (this.clockwise) {
      angle = this.startAngle - t * Math.PI * 2;
    }

    const x = this.center[0] + Math.cos(angle) * this.radiusX;
    const y = this.center[1] + Math.sin(angle) * this.radiusY;

    return [x, y];
  }

  getPathType(): PathType {
    return PathType.Circular;
  }

  /**
   * Get serializable path data
   * Matches C# CircularPath.GetPathData (lines 47-67)
   */
  getPathData(): PathData {
    const a = this.radiusX;
    const b = this.radiusY;
    const circumference = Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));

    return {
      fishId: this.fishId,
      pathType: PathType.Circular,
      seed: this.seed,
      startTick: this.startTick,
      speed: this.speed,
      controlPoints: [
        this.center,
        [this.radiusX, this.radiusY],
        [this.startAngle, this.clockwise ? 1 : 0],
      ],
      duration: circumference / this.speed,
      loop: true,
    };
  }
}
