/**
 * Represents a fish movement path that can be deterministically computed by both server and client
 * Exact match of C# PathData model
 */
export interface PathData {
  fishId: number;
  pathType: PathType;
  seed: number;
  startTick: number;
  speed: number;
  controlPoints: number[][]; // Array of [x, y] coordinate pairs

  // Additional metadata
  duration: number; // How long the path lasts in seconds
  loop: boolean; // Whether the path loops
}

export enum PathType {
  Linear = 0,      // Straight line movement
  Sine = 1,        // Sinusoidal wave pattern
  Bezier = 2,      // Cubic Bezier curve
  Circular = 3,    // Circular/elliptical motion
  MultiSegment = 4 // Multiple path segments chained together
}
