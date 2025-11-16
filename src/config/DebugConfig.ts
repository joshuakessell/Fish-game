/**
 * Master debug flag - automatically false in production, true in development
 * Set to false to disable ALL debug logging
 * 
 * Detects environment:
 * - Vite browser builds: import.meta.env.PROD
 * - Node/test environments: process.env.NODE_ENV
 */
function detectProductionMode(): boolean {
  // Node.js environment check (for unit tests, server-side code)
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') {
    return false; // Disable debug in production Node environment
  }
  
  // Vite browser environment check (wrapped in try-catch for safety)
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env?.PROD === true) {
      return false; // Disable debug in production browser builds
    }
  } catch (e) {
    // import.meta not available (e.g., CommonJS/Node), continue
  }
  
  // Default to debug enabled in development
  return true;
}

export const DEBUG_MODE = detectProductionMode();

/**
 * Fine-grained debug channel flags for specific subsystems
 * Individual channels can be toggled even when DEBUG_MODE is true
 */
export const DebugChannels = {
  pathComputation: true,    // PathComputer position calculations
  pathRegistration: true,   // FishPathManager path registration
  fishUpdates: true,        // GameState fish spawn/update events
  stateDelta: true,         // StateDelta processing (tick sync, fish counts)
  fishSprites: true,        // FishSprite creation/destruction
  validation: true,         // Validation warnings for anomalies (ACC > 1000, PROG > 100%)
};

export type DebugChannel = keyof typeof DebugChannels;

/**
 * Helper function to log debug messages only when DEBUG_MODE is enabled
 * and the specific channel is active
 */
export function debugLog(channel: DebugChannel, ...args: any[]) {
  if (DEBUG_MODE && DebugChannels[channel]) {
    console.log(...args);
  }
}
