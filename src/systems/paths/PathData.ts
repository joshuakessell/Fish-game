/**
 * MessagePack array format sent from server
 * [fishId, pathType, seed, startTick, speed, controlPoints, duration, loop, variance]
 */
export type PathDataTuple = [
  number, // [0] fishId
  string, // [1] pathType (enum name as string)
  number, // [2] seed
  number, // [3] startTick
  number, // [4] speed
  number[][], // [5] controlPoints
  number, // [6] duration
  boolean, // [7] loop
  number, // [8] variance - path duration variance multiplier (1.0 = no variance)
];

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
  variance: number; // Path duration variance multiplier (1.0 = no variance, used for group fish despawn stagger)
}

export enum PathType {
  Linear = 0, // Straight line movement
  Sine = 1, // Sinusoidal wave pattern
  Bezier = 2, // Cubic Bezier curve
  Circular = 3, // Circular/elliptical motion
  MultiSegment = 4, // Multiple path segments chained together
}

/**
 * Convert MessagePack PathDataTuple to typed PathData object
 * @param tuple Raw array from server or null
 * @returns Normalized PathData object or null
 */
export function deserializePathData(tuple: PathDataTuple | null): PathData | null {
  if (!tuple || !Array.isArray(tuple) || tuple.length < 9) {
    return null;
  }

  // Map string path type name to enum value
  const pathTypeMap: { [key: string]: PathType } = {
    Linear: PathType.Linear,
    Sine: PathType.Sine,
    Bezier: PathType.Bezier,
    Circular: PathType.Circular,
    MultiSegment: PathType.MultiSegment,
  };

  const pathTypeName = tuple[1];
  const pathType = pathTypeMap[pathTypeName];

  if (pathType === undefined) {
    console.error(`Unknown path type: ${pathTypeName}`);
    return null;
  }

  return {
    fishId: tuple[0],
    pathType: pathType,
    seed: tuple[2],
    startTick: tuple[3],
    speed: tuple[4],
    controlPoints: tuple[5],
    duration: tuple[6],
    loop: tuple[7],
    variance: tuple[8] ?? 1.0, // Default to 1.0 if variance not present (backwards compatibility)
  };
}
