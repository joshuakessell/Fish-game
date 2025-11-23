import { PathData, PathType } from "./PathData";

/**
 * Straight line movement from start to end point
 * Exact port of C# LinearPath implementation
 */
export class LinearPath {
  private readonly start: [number, number];
  private readonly end: [number, number];
  private readonly fishId: number;
  private readonly seed: number;
  private readonly startTick: number;
  private readonly speed: number;

  constructor(
    fishId: number,
    seed: number,
    startTick: number,
    speed: number,
    start: [number, number],
    end: [number, number],
  ) {
    this.fishId = fishId;
    this.seed = seed;
    this.startTick = startTick;
    this.speed = speed;
    this.start = start;
    this.end = end;
  }

  /**
   * Get position along the linear path at normalized time t
   * Matches C# LinearPath.GetPosition (lines 27-32)
   */
  getPosition(t: number): [number, number] {
    const x = this.start[0] + (this.end[0] - this.start[0]) * t;
    const y = this.start[1] + (this.end[1] - this.start[1]) * t;
    return [x, y];
  }

  getPathType(): PathType {
    return PathType.Linear;
  }

  /**
   * Get serializable path data
   * Matches C# LinearPath.GetPathData (lines 37-55)
   */
  getPathData(): PathData {
    const distance = Math.sqrt(
      Math.pow(this.end[0] - this.start[0], 2) +
        Math.pow(this.end[1] - this.start[1], 2),
    );

    return {
      fishId: this.fishId,
      pathType: PathType.Linear,
      seed: this.seed,
      startTick: this.startTick,
      speed: this.speed,
      controlPoints: [this.start, this.end],
      duration: distance / this.speed,
      loop: false,
    };
  }
}
