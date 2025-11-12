using OceanKing.Server.Data;
using OceanKing.Server.Models;
using OceanKing.Server.Entities;

namespace OceanKing.Server.Systems.Paths;

/// <summary>
/// Generates appropriate movement paths for each fish type
/// </summary>
public class PathGenerator
{
    private const float CANVAS_WIDTH = 1800f;
    private const float CANVAS_HEIGHT = 900f;
    private static int _seedCounter = 0;
    
    /// <summary>
    /// Generate a path for a fish based on its type
    /// </summary>
    public static IPath GeneratePathForFish(int fishId, FishDefinition fishType, int currentTick)
    {
        // Generate unique seed for this fish
        int seed = GenerateSeed(fishId, currentTick);
        var rng = new SeededRandom(seed);
        
        // Determine path type based on fish category
        return fishType.Category switch
        {
            FishCategory.SmallFish => GenerateLinearOrSinePath(fishId, seed, currentTick, fishType, rng),
            FishCategory.MediumFish => GenerateLinearOrSinePath(fishId, seed, currentTick, fishType, rng),
            FishCategory.LargeFish => GenerateBezierPath(fishId, seed, currentTick, fishType, rng),
            FishCategory.BonusFish => GenerateSinePath(fishId, seed, currentTick, fishType, rng),
            _ => GenerateLinearPath(fishId, seed, currentTick, fishType, rng)
        };
    }
    
    private static int GenerateSeed(int fishId, int tick)
    {
        // Combine fish ID, tick, and counter for unique seed
        // Use 64-bit arithmetic to prevent overflow before modulo
        long combined = ((long)fishId * 31L + (long)tick * 17L + _seedCounter++);
        return (int)(combined % int.MaxValue);
    }
    
    private static IPath GenerateLinearOrSinePath(int fishId, int seed, int startTick, FishDefinition fishType, SeededRandom rng)
    {
        // 50% chance for linear, 50% for sine wave
        bool useSine = rng.NextFloat() > 0.5f;
        
        // Generate random entry and exit points on opposite edges
        var (start, end) = GenerateEdgeToEdgePoints(rng);
        
        if (useSine)
        {
            float amplitude = rng.NextFloat(20f, 50f);
            float frequency = rng.NextFloat(2f, 5f);
            return new SinePath(fishId, seed, startTick, fishType.BaseSpeed, start, end, amplitude, frequency);
        }
        else
        {
            return new LinearPath(fishId, seed, startTick, fishType.BaseSpeed, start, end);
        }
    }
    
    private static IPath GenerateLinearPath(int fishId, int seed, int startTick, FishDefinition fishType, SeededRandom rng)
    {
        var (start, end) = GenerateEdgeToEdgePoints(rng);
        return new LinearPath(fishId, seed, startTick, fishType.BaseSpeed, start, end);
    }
    
    private static IPath GenerateSinePath(int fishId, int seed, int startTick, FishDefinition fishType, SeededRandom rng)
    {
        var (start, end) = GenerateEdgeToEdgePoints(rng);
        float amplitude = rng.NextFloat(40f, 80f);
        float frequency = rng.NextFloat(3f, 6f);
        return new SinePath(fishId, seed, startTick, fishType.BaseSpeed, start, end, amplitude, frequency);
    }
    
    /// <summary>
    /// Generate a sine wave path with specific start and end points (for Wave Rider bonus fish)
    /// </summary>
    public static IPath GenerateSinePathWithPoints(int fishId, int seed, int startTick, float speed, float[] start, float[] end)
    {
        float amplitude = 40f + ((seed % 41) * (80f - 40f) / 40f);
        float frequency = 3f + ((seed % 4) * (6f - 3f) / 3f);
        return new SinePath(fishId, seed, startTick, speed, start, end, amplitude, frequency);
    }
    
    private static IPath GenerateBezierPath(int fishId, int seed, int startTick, FishDefinition fishType, SeededRandom rng)
    {
        // Generate start and end points on edges
        var (start, end) = GenerateEdgeToEdgePoints(rng);
        
        // Generate control points for smooth curve - KEEP WITHIN BOUNDS
        float[] p1 = new[]
        {
            MathF.Max(100f, MathF.Min(CANVAS_WIDTH - 100f, start[0] + rng.NextFloat(-200f, 200f))),
            MathF.Max(100f, MathF.Min(CANVAS_HEIGHT - 100f, start[1] + rng.NextFloat(-200f, 200f)))
        };
        
        float[] p2 = new[]
        {
            MathF.Max(100f, MathF.Min(CANVAS_WIDTH - 100f, end[0] + rng.NextFloat(-200f, 200f))),
            MathF.Max(100f, MathF.Min(CANVAS_HEIGHT - 100f, end[1] + rng.NextFloat(-200f, 200f)))
        };
        
        return new BezierPath(fishId, seed, startTick, fishType.BaseSpeed, start, p1, p2, end);
    }
    
    private static IPath GenerateCircularOrComplexPath(int fishId, int seed, int startTick, FishDefinition fishType, SeededRandom rng)
    {
        // 70% Bezier, 30% Circular for variety
        if (rng.NextFloat() > 0.3f)
        {
            return GenerateBezierPath(fishId, seed, startTick, fishType, rng);
        }
        
        // Circular path - ensure entire circle stays within bounds
        float maxRadiusX = MathF.Min(250f, CANVAS_WIDTH / 3f);
        float maxRadiusY = MathF.Min(200f, CANVAS_HEIGHT / 3f);
        
        float radiusX = rng.NextFloat(100f, maxRadiusX);
        float radiusY = rng.NextFloat(80f, maxRadiusY);
        
        // Center must keep entire circle within bounds
        float[] center = new[]
        {
            rng.NextFloat(radiusX + 50f, CANVAS_WIDTH - radiusX - 50f),
            rng.NextFloat(radiusY + 50f, CANVAS_HEIGHT - radiusY - 50f)
        };
        
        float startAngle = rng.NextFloat(0f, MathF.PI * 2);
        bool clockwise = rng.NextFloat() > 0.5f;
        
        return new CircularPath(fishId, seed, startTick, fishType.BaseSpeed, center, radiusX, radiusY, startAngle, clockwise);
    }
    
    private static IPath GenerateBossPath(int fishId, int seed, int startTick, FishDefinition fishType, SeededRandom rng)
    {
        // Bosses get dramatic curved paths
        var (start, end) = GenerateEdgeToEdgePoints(rng);
        
        // Large, sweeping Bezier curves - KEEP WITHIN BOUNDS
        float[] p1 = new[]
        {
            MathF.Max(200f, MathF.Min(CANVAS_WIDTH - 200f, rng.NextFloat(300f, CANVAS_WIDTH - 300f))),
            MathF.Max(100f, MathF.Min(CANVAS_HEIGHT - 100f, rng.NextFloat(100f, CANVAS_HEIGHT - 100f)))
        };
        
        float[] p2 = new[]
        {
            MathF.Max(200f, MathF.Min(CANVAS_WIDTH - 200f, rng.NextFloat(300f, CANVAS_WIDTH - 300f))),
            MathF.Max(100f, MathF.Min(CANVAS_HEIGHT - 100f, rng.NextFloat(100f, CANVAS_HEIGHT - 100f)))
        };
        
        return new BezierPath(fishId, seed, startTick, fishType.BaseSpeed * 0.7f, start, p1, p2, end);
    }
    
    /// <summary>
    /// Generate start and end points on opposite edges of the play area
    /// </summary>
    private static (float[] start, float[] end) GenerateEdgeToEdgePoints(SeededRandom rng)
    {
        int startEdge = rng.NextInt(0, 4); // 0=left, 1=right, 2=top, 3=bottom
        int endEdge = (startEdge + 2) % 4; // Opposite edge
        
        float[] start = GeneratePointOnEdge(startEdge, rng);
        float[] end = GeneratePointOnEdge(endEdge, rng);
        
        return (start, end);
    }
    
    private static float[] GeneratePointOnEdge(int edge, SeededRandom rng)
    {
        return edge switch
        {
            0 => new[] { 0f, rng.NextFloat(100f, CANVAS_HEIGHT - 100f) }, // Left - spawn AT edge
            1 => new[] { CANVAS_WIDTH, rng.NextFloat(100f, CANVAS_HEIGHT - 100f) }, // Right - spawn AT edge
            2 => new[] { rng.NextFloat(100f, CANVAS_WIDTH - 100f), 0f }, // Top - spawn AT edge
            3 => new[] { rng.NextFloat(100f, CANVAS_WIDTH - 100f), CANVAS_HEIGHT }, // Bottom - spawn AT edge
            _ => new[] { 0f, 0f }
        };
    }
}
