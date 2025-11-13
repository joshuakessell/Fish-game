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
    public static IPath GeneratePathForFish(int fishId, FishDefinition fishType, int currentTick, int spawnEdge = -1, int groupIndex = 0)
    {
        // Generate unique seed for this fish, incorporating spawn edge and group index for variation
        int seed = GenerateSeed(fishId, currentTick, spawnEdge, groupIndex);
        var rng = new SeededRandom(seed);
        
        // Determine path type based on fish category
        return fishType.Category switch
        {
            FishCategory.SmallFish => GenerateLinearOrSinePath(fishId, seed, currentTick, fishType, rng, spawnEdge, groupIndex),
            FishCategory.MediumFish => GenerateLinearOrSinePath(fishId, seed, currentTick, fishType, rng, spawnEdge, groupIndex),
            FishCategory.LargeFish => GenerateBezierPath(fishId, seed, currentTick, fishType, rng, spawnEdge, groupIndex),
            FishCategory.BonusFish => GenerateSinePath(fishId, seed, currentTick, fishType, rng, spawnEdge, groupIndex),
            _ => GenerateLinearPath(fishId, seed, currentTick, fishType, rng, spawnEdge, groupIndex)
        };
    }
    
    private static int GenerateSeed(int fishId, int tick, int spawnEdge, int groupIndex)
    {
        // Combine fish ID, tick, spawn edge, group index and counter for unique seed
        // Use 64-bit arithmetic to prevent overflow before modulo
        long combined = ((long)fishId * 31L + (long)tick * 17L + (long)spawnEdge * 13L + (long)groupIndex * 7L + _seedCounter++);
        return (int)(combined % int.MaxValue);
    }
    
    private static IPath GenerateLinearOrSinePath(int fishId, int seed, int startTick, FishDefinition fishType, SeededRandom rng, int spawnEdge, int groupIndex)
    {
        // 50% chance for linear, 50% for sine wave
        bool useSine = rng.NextFloat() > 0.5f;
        
        // Generate entry and exit points based on spawn edge
        var (start, end) = GenerateEdgeToEdgePointsFromSpawnEdge(rng, spawnEdge, groupIndex);
        
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
    
    private static IPath GenerateLinearPath(int fishId, int seed, int startTick, FishDefinition fishType, SeededRandom rng, int spawnEdge, int groupIndex)
    {
        var (start, end) = GenerateEdgeToEdgePointsFromSpawnEdge(rng, spawnEdge, groupIndex);
        return new LinearPath(fishId, seed, startTick, fishType.BaseSpeed, start, end);
    }
    
    private static IPath GenerateSinePath(int fishId, int seed, int startTick, FishDefinition fishType, SeededRandom rng, int spawnEdge, int groupIndex)
    {
        var (start, end) = GenerateEdgeToEdgePointsFromSpawnEdge(rng, spawnEdge, groupIndex);
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
    
    private static IPath GenerateBezierPath(int fishId, int seed, int startTick, FishDefinition fishType, SeededRandom rng, int spawnEdge, int groupIndex)
    {
        // Generate start and end points based on spawn edge
        var (start, end) = GenerateEdgeToEdgePointsFromSpawnEdge(rng, spawnEdge, groupIndex);
        
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
    
    private static IPath GenerateCircularOrComplexPath(int fishId, int seed, int startTick, FishDefinition fishType, SeededRandom rng, int spawnEdge, int groupIndex)
    {
        // 70% Bezier, 30% Circular for variety
        if (rng.NextFloat() > 0.3f)
        {
            return GenerateBezierPath(fishId, seed, startTick, fishType, rng, spawnEdge, groupIndex);
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
    
    /// <summary>
    /// Generate start and end points based on specified spawn edge
    /// </summary>
    private static (float[] start, float[] end) GenerateEdgeToEdgePointsFromSpawnEdge(SeededRandom rng, int spawnEdge, int groupIndex)
    {
        // If no spawn edge specified, use random edge
        if (spawnEdge < 0 || spawnEdge > 7)
        {
            return GenerateEdgeToEdgePoints(rng);
        }
        
        // Map spawn direction (0-7) to edge (0-3)
        // 0: left, 1: right, 2: top, 3: bottom, 4: left-top, 5: right-top, 6: left-bottom, 7: right-bottom
        int startEdge;
        float[] start;
        
        switch (spawnEdge)
        {
            case 0: // From left edge
                startEdge = 0;
                start = new[] { 0f, rng.NextFloat(100f, CANVAS_HEIGHT - 100f) + groupIndex * 20f };
                break;
            case 1: // From right edge
                startEdge = 1;
                start = new[] { CANVAS_WIDTH, rng.NextFloat(100f, CANVAS_HEIGHT - 100f) + groupIndex * 20f };
                break;
            case 2: // From top edge
                startEdge = 2;
                start = new[] { rng.NextFloat(100f, CANVAS_WIDTH - 100f) + groupIndex * 20f, 0f };
                break;
            case 3: // From bottom edge
                startEdge = 3;
                start = new[] { rng.NextFloat(100f, CANVAS_WIDTH - 100f) + groupIndex * 20f, CANVAS_HEIGHT };
                break;
            case 4: // From left-top corner
                startEdge = rng.NextFloat() > 0.5f ? 0 : 2;
                start = startEdge == 0 
                    ? new[] { 0f, rng.NextFloat(0f, 200f) + groupIndex * 15f }
                    : new[] { rng.NextFloat(0f, 200f) + groupIndex * 15f, 0f };
                break;
            case 5: // From right-top corner
                startEdge = rng.NextFloat() > 0.5f ? 1 : 2;
                start = startEdge == 1 
                    ? new[] { CANVAS_WIDTH, rng.NextFloat(0f, 200f) + groupIndex * 15f }
                    : new[] { rng.NextFloat(CANVAS_WIDTH - 200f, CANVAS_WIDTH) - groupIndex * 15f, 0f };
                break;
            case 6: // From left-bottom corner
                startEdge = rng.NextFloat() > 0.5f ? 0 : 3;
                start = startEdge == 0 
                    ? new[] { 0f, rng.NextFloat(CANVAS_HEIGHT - 200f, CANVAS_HEIGHT) - groupIndex * 15f }
                    : new[] { rng.NextFloat(0f, 200f) + groupIndex * 15f, CANVAS_HEIGHT };
                break;
            case 7: // From right-bottom corner
                startEdge = rng.NextFloat() > 0.5f ? 1 : 3;
                start = startEdge == 1 
                    ? new[] { CANVAS_WIDTH, rng.NextFloat(CANVAS_HEIGHT - 200f, CANVAS_HEIGHT) - groupIndex * 15f }
                    : new[] { rng.NextFloat(CANVAS_WIDTH - 200f, CANVAS_WIDTH) - groupIndex * 15f, CANVAS_HEIGHT };
                break;
            default:
                startEdge = 0;
                start = new[] { 0f, CANVAS_HEIGHT / 2f };
                break;
        }
        
        // End edge is generally opposite, but with some variation for diagonal spawns
        int endEdge = spawnEdge < 4 ? (startEdge + 2) % 4 : ((startEdge + 1 + rng.NextInt(0, 2)) % 4);
        
        // Generate end point with some variation
        float[] end = GeneratePointOnEdge(endEdge, rng);
        
        // Clamp values to ensure they're within bounds
        start[0] = MathF.Max(0f, MathF.Min(CANVAS_WIDTH, start[0]));
        start[1] = MathF.Max(0f, MathF.Min(CANVAS_HEIGHT, start[1]));
        
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
