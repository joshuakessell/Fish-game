import { PathData } from './paths/PathData';
import { PathComputer } from './paths/PathComputer';
import { debugLog } from '../config/DebugConfig';

/**
 * Manages fish paths and computes positions per frame
 * Tracks PathData for all active fish and provides position queries
 */
export class FishPathManager {
  private fishPaths: Map<number, PathData> = new Map();

  /**
   * Register a new fish path when a fish spawns
   * @param fishId The unique fish identifier
   * @param pathData The path data from the server
   */
  registerFishPath(fishId: number, pathData: PathData): void {
    if (!pathData) {
      console.warn(`Cannot register null path for fish ${fishId}`);
      return;
    }

    if (!pathData.controlPoints || pathData.controlPoints.length === 0) {
      console.error(`❌ PathData for fish ${fishId} has no controlPoints!`, pathData);
      return;
    }

    debugLog(
      'pathRegistration',
      `✅ Registered path for fish ${fishId}: type=${pathData.pathType}, points=${pathData.controlPoints.length}, startTick=${pathData.startTick}`,
    );
    this.fishPaths.set(fishId, pathData);
  }

  /**
   * Get the current position of a fish based on its path
   * @param fishId The unique fish identifier
   * @param currentTick Current game tick
   * @returns Position [x, y] or null if no path or unable to compute
   */
  getFishPosition(fishId: number, currentTick: number): [number, number] | null {
    const pathData = this.fishPaths.get(fishId);
    if (!pathData) {
      console.warn(`⚠️ No path registered for fish ${fishId}, cannot compute position`);
      return null;
    }

    return PathComputer.computePosition(pathData, currentTick);
  }

  /**
   * Remove a fish from tracking (when it dies or despawns)
   * @param fishId The unique fish identifier
   */
  removeFish(fishId: number): void {
    this.fishPaths.delete(fishId);
  }

  /**
   * Check if a fish has a registered path
   * @param fishId The unique fish identifier
   * @returns True if the fish has a path
   */
  hasFishPath(fishId: number): boolean {
    return this.fishPaths.has(fishId);
  }

  /**
   * Clear all fish paths (useful for room reset)
   */
  clear(): void {
    this.fishPaths.clear();
  }

  /**
   * Get the number of tracked fish
   */
  getTrackedFishCount(): number {
    return this.fishPaths.size;
  }
}
