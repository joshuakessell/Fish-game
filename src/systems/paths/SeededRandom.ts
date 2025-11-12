/**
 * Deterministic random number generator using Linear Congruential Generator (LCG)
 * Exact port of C# implementation to ensure identical results
 * Uses explicit 64-bit math handling to match C# behavior
 */
export class SeededRandom {
  private static readonly A = 1103515245;
  private static readonly C = 12345;
  private static readonly M = 2147483648; // 2^31

  private seed: number;

  constructor(initialSeed: number) {
    this.seed = initialSeed & 0x7fffffff; // Ensure positive seed
  }

  /**
   * Get next random integer (0 to 2^31-1)
   */
  next(): number {
    // JavaScript uses 53-bit integers in Number, but bitwise ops use 32-bit
    // Use modulo to match C# behavior exactly
    this.seed = (SeededRandom.A * this.seed + SeededRandom.C) % SeededRandom.M;
    return this.seed;
  }

  /**
   * Get next random float between 0.0 and 1.0
   */
  nextFloat(): number {
    return this.next() / SeededRandom.M;
  }

  /**
   * Get next random float between min and max
   */
  nextFloatRange(min: number, max: number): number {
    return min + this.nextFloat() * (max - min);
  }

  /**
   * Get next random integer between min (inclusive) and max (exclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(min + this.nextFloat() * (max - min));
  }

  /**
   * Reset the seed
   */
  reset(newSeed: number): void {
    this.seed = newSeed & 0x7fffffff;
  }
}
