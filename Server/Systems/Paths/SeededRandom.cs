namespace OceanKing.Server.Systems.Paths;

/// <summary>
/// Deterministic random number generator using Linear Congruential Generator (LCG)
/// Same algorithm will be implemented in TypeScript to ensure identical results
/// Uses explicit 64-bit math to avoid overflow differences between platforms
/// </summary>
public class SeededRandom
{
    private const long A = 1103515245L;
    private const long C = 12345L;
    private const long M = 2147483648L; // 2^31
    
    private long _seed;
    
    public SeededRandom(int seed)
    {
        _seed = (long)seed & 0x7FFFFFFFL; // Ensure positive seed
    }
    
    /// <summary>
    /// Get next random integer (0 to 2^31-1)
    /// </summary>
    public int Next()
    {
        _seed = (A * _seed + C) % M;
        return (int)_seed;
    }
    
    /// <summary>
    /// Get next random float between 0.0 and 1.0
    /// </summary>
    public float NextFloat()
    {
        return (float)Next() / M;
    }
    
    /// <summary>
    /// Get next random float between min and max
    /// </summary>
    public float NextFloat(float min, float max)
    {
        return min + NextFloat() * (max - min);
    }
    
    /// <summary>
    /// Get next random integer between min (inclusive) and max (exclusive)
    /// </summary>
    public int NextInt(int min, int max)
    {
        return min + (int)(NextFloat() * (max - min));
    }
    
    /// <summary>
    /// Reset the seed
    /// </summary>
    public void Reset(int seed)
    {
        _seed = seed;
    }
}
