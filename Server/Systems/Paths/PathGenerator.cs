using OceanKing.Server.Data;
using OceanKing.Server.Models;

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
    public static IPath GeneratePathForFish(int fishId, FishType fishType, int currentTick)
    {
        // Generate unique seed for this fish
        int seed = GenerateSeed(fishId, currentTick);
        var rng = new SeededRandom(seed);
        
        // Determine path type based on fish category
        return fishType.Category switch
        {
            "Common" => GenerateLinearOrSinePath(fishId, seed, currentTick, fishType, rng),
            "Rare" => GenerateBezierPath(fishId, seed, currentTick, fishType, rng),
            "Special" => GenerateCircularOrComplexPath(fishId, seed, currentTick, fishType, rng),
            "Boss" => GenerateBossPath(fishId, seed, currentTick, fishType, rng),
            _ => GenerateLinearPath(fishId, seed, currentTick, fishType, rng)
        };
    }
    
    private static int GenerateSeed(int fishId, int tick)
    {
        // Combine fish ID, tick, and counter for unique seed
        return (fishId * 31 + tick * 17 + _seedCounter++) % int.MaxValue;
    }
    
    private static IPath GenerateLinearOrSinePath(int fishId, int seed, int startTick, FishType fishType, SeededRandom rng)
    {
        // 50% chance for linear, 50% for sine wave
        bool useSine = rng.NextFloat() > 0.5f;
        
        // Generate random entry and exit points on opposite edges
        var (start, end) = GenerateEdgeToEdgePoints(rng);
        
        if (useSine)
        {
            float amplitude = rng.NextFloat(20f, 50f);
            float frequency = rng.NextFloat(2f, 5f);
            return new SinePath(fishId, seed, startTick, fishType.Speed, start, end, amplitude, frequency);
        }
        else
        {
            return new LinearPath(fishId, seed, startTick, fishType.Speed, start, end);
        }
    }
    
    private static IPath GenerateLinearPath(int fishId, int seed, int startTick, FishType fishType, SeededRandom rng)
    {
        var (start, end) = GenerateEdgeToEdgePoints(rng);
        return new LinearPath(fishId, seed, startTick, fishType.Speed, start, end);
    }
    
    private static IPath GenerateBezierPath(int fishId, int seed, int startTick, FishType fishType, SeededRandom rng)
    {
        // Generate start and end points on edges
        var (start, end) = GenerateEdgeToEdgePoints(rng);
        
        // Generate control points for smooth curve
        float[] p1 = new[]
        {
            start[0] + rng.NextFloat(-200f, 200f),
            start[1] + rng.NextFloat(-200f, 200f)
        };
        
        float[] p2 = new[]
        {
            end[0] + rng.NextFloat(-200f, 200f),
            end[1] + rng.NextFloat(-200f, 200f)
        };
        
        return new BezierPath(fishId, seed, startTick, fishType.Speed, start, p1, p2, end);
    }
    
    private static IPath GenerateCircularOrComplexPath(int fishId, int seed, int startTick, FishType fishType, SeededRandom rng)
    {
        // 70% Bezier, 30% Circular for variety
        if (rng.NextFloat() > 0.3f)
        {
            return GenerateBezierPath(fishId, seed, startTick, fishType, rng);
        }
        
        // Circular path
        float[] center = new[]
        {
            rng.NextFloat(300f, CANVAS_WIDTH - 300f),
            rng.NextFloat(200f, CANVAS_HEIGHT - 200f)
        };
        
        float radiusX = rng.NextFloat(100f, 250f);
        float radiusY = rng.NextFloat(80f, 200f);
        float startAngle = rng.NextFloat(0f, MathF.PI * 2);
        bool clockwise = rng.NextFloat() > 0.5f;
        
        return new CircularPath(fishId, seed, startTick, fishType.Speed, center, radiusX, radiusY, startAngle, clockwise);
    }
    
    private static IPath GenerateBossPath(int fishId, int seed, int startTick, FishType fishType, SeededRandom rng)
    {
        // Bosses get dramatic curved paths
        var (start, end) = GenerateEdgeToEdgePoints(rng);
        
        // Large, sweeping Bezier curves
        float[] p1 = new[]
        {
            rng.NextFloat(300f, CANVAS_WIDTH - 300f),
            rng.NextFloat(100f, CANVAS_HEIGHT - 100f)
        };
        
        float[] p2 = new[]
        {
            rng.NextFloat(300f, CANVAS_WIDTH - 300f),
            rng.NextFloat(100f, CANVAS_HEIGHT - 100f)
        };
        
        return new BezierPath(fishId, seed, startTick, fishType.Speed * 0.7f, start, p1, p2, end);
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
            0 => new[] { -50f, rng.NextFloat(100f, CANVAS_HEIGHT - 100f) }, // Left
            1 => new[] { CANVAS_WIDTH + 50f, rng.NextFloat(100f, CANVAS_HEIGHT - 100f) }, // Right
            2 => new[] { rng.NextFloat(100f, CANVAS_WIDTH - 100f), -50f }, // Top
            3 => new[] { rng.NextFloat(100f, CANVAS_WIDTH - 100f), CANVAS_HEIGHT + 50f }, // Bottom
            _ => new[] { 0f, 0f }
        };
    }
}
