namespace OceanKing.Server.Systems.Paths;

/// <summary>
/// Deterministic random number generator using Linear Congruential Generator (LCG)
/// Same algorithm will be implemented in TypeScript to ensure identical results
/// </summary>
public class SeededRandom
{
    private const int A = 1103515245;
    private const int C = 12345;
    private const int M = 2147483648; // 2^31
    
    private int _seed;
    
    public SeededRandom(int seed)
    {
        _seed = seed;
    }
    
    /// <summary>
    /// Get next random integer
    /// </summary>
    public int Next()
    {
        _seed = (A * _seed + C) % M;
        return _seed;
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
