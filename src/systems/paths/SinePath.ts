import { PathData, PathType } from './PathData';

/**
 * Sinusoidal wave pattern - fish moves in a wave
 * Exact port of C# SinePath implementation
 */
export class SinePath {
  private readonly start: [number, number];
  private readonly end: [number, number];
  private readonly amplitude: number;
  private readonly frequency: number;
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
    amplitude: number,
    frequency: number
  ) {
    this.fishId = fishId;
    this.seed = seed;
    this.startTick = startTick;
    this.speed = speed;
    this.start = start;
    this.end = end;
    this.amplitude = amplitude;
    this.frequency = frequency;
  }

  /**
   * Get position along the sine wave path at normalized time t
   * Matches C# SinePath.GetPosition (lines 31-52)
   */
  getPosition(t: number): [number, number] {
    const baseX = this.start[0] + (this.end[0] - this.start[0]) * t;
    const baseY = this.start[1] + (this.end[1] - this.start[1]) * t;

    const dx = this.end[0] - this.start[0];
    const dy = this.end[1] - this.start[1];
    const length = Math.sqrt(dx * dx + dy * dy);

    const perpX = -dy / length;
    const perpY = dx / length;

    const offset = Math.sin(t * this.frequency * Math.PI * 2) * this.amplitude;

    const x = baseX + perpX * offset;
    const y = baseY + perpY * offset;

    return [x, y];
  }

  getPathType(): PathType {
    return PathType.Sine;
  }

  /**
   * Get serializable path data
   * Matches C# SinePath.GetPathData (lines 56-77)
   */
  getPathData(): PathData {
    const distance = Math.sqrt(
      Math.pow(this.end[0] - this.start[0], 2) +
      Math.pow(this.end[1] - this.start[1], 2)
    );

    return {
      fishId: this.fishId,
      pathType: PathType.Sine,
      seed: this.seed,
      startTick: this.startTick,
      speed: this.speed,
      controlPoints: [
        this.start,
        this.end,
        [this.amplitude, this.frequency]
      ],
      duration: distance / this.speed,
      loop: false
    };
  }
}
