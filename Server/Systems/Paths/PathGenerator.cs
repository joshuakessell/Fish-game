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
    
    // Cache for shared group parameters - key is unique group ID (tick + edge + counter)
    private static readonly Dictionary<long, SharedGroupParameters> _groupParametersCache = new();
    private static readonly object _cacheLock = new object();
    private static long _groupCounter = 0; // Ensures unique group IDs even for same tick/edge
    
    private enum PathType { Linear, Sine }
    
    private class SharedGroupParameters
    {
        public PathType PathType { get; set; }
        public float Amplitude { get; set; }
        public float Frequency { get; set; }
        public float BonusAmplitude { get; set; }
        public float BonusFrequency { get; set; }
        public float BezierP1OffsetX { get; set; }
        public float BezierP1OffsetY { get; set; }
        public float BezierP2OffsetX { get; set; }
        public float BezierP2OffsetY { get; set; }
        public long CreatedTick { get; set; } // For cache cleanup
        
        // Pre-computed BASE anchor coordinates that all fish in group share
        public float[] BaseAnchorStart { get; set; } = null!;
        public float[] BaseAnchorEnd { get; set; } = null!;
        public int StartEdge { get; set; }  // Which edge the group spawns from
        public int EndEdge { get; set; }    // Which edge the group exits to
    }
    
    /// <summary>
    /// Generate a path for a fish based on its type
    /// </summary>
    public static IPath GeneratePathForFish(int fishId, FishDefinition fishType, int currentTick, int spawnEdge = -1, int groupIndex = 0, long groupId = 0)
    {
        // Generate unique seed for this fish, incorporating spawn edge and group index for variation
        int seed = GenerateSeed(fishId, currentTick, spawnEdge, groupIndex);
        var rng = new SeededRandom(seed);
        
        // Generate group-level anchor seed using ONLY shared components (tick + edge)
        // This ensures all fish in the same group share the same base position
        int groupAnchorSeed = GenerateGroupAnchorSeed(currentTick, spawnEdge);
        
        // Get or create shared parameters for this group (cached by unique groupId)
        SharedGroupParameters sharedParams;
        lock (_cacheLock)
        {
            if (!_groupParametersCache.TryGetValue(groupId, out sharedParams!))
            {
                // First fish in group - create and cache shared parameters
                var groupRng = new SeededRandom(groupAnchorSeed);
                
                // Pre-compute base anchor points that all fish in group will share
                var (baseStart, baseEnd, startEdge, endEdge) = ComputeBaseAnchorPoints(groupRng, spawnEdge);
                
                sharedParams = new SharedGroupParameters
                {
                    PathType = groupRng.NextFloat() > 0.4f ? PathType.Sine : PathType.Linear,
                    Amplitude = groupRng.NextFloat(15f, 80f),
                    Frequency = groupRng.NextFloat(1.5f, 7f),
                    BonusAmplitude = groupRng.NextFloat(30f, 120f),
                    BonusFrequency = groupRng.NextFloat(2f, 8f),
                    BezierP1OffsetX = groupRng.NextFloat(-400f, 400f),
                    BezierP1OffsetY = groupRng.NextFloat(-300f, 300f),
                    BezierP2OffsetX = groupRng.NextFloat(-400f, 400f),
                    BezierP2OffsetY = groupRng.NextFloat(-300f, 300f),
                    CreatedTick = currentTick,
                    BaseAnchorStart = baseStart,
                    BaseAnchorEnd = baseEnd,
                    StartEdge = startEdge,
                    EndEdge = endEdge
                };
                _groupParametersCache[groupId] = sharedParams;
                
                // Cleanup old cache entries (older than 5 seconds = 150 ticks at 30 TPS)
                CleanupOldCacheEntries(currentTick);
            }
        }
        
        // Determine path type based on fish category
        return fishType.Category switch
        {
            FishCategory.SmallFish => GenerateLinearOrSinePath(fishId, seed, currentTick, fishType, rng, spawnEdge, groupIndex, groupAnchorSeed, sharedParams),
            FishCategory.MediumFish => GenerateLinearOrSinePath(fishId, seed, currentTick, fishType, rng, spawnEdge, groupIndex, groupAnchorSeed, sharedParams),
            FishCategory.LargeFish => GenerateBezierPath(fishId, seed, currentTick, fishType, rng, spawnEdge, groupIndex, groupAnchorSeed, sharedParams),
            FishCategory.BonusFish => GenerateSinePath(fishId, seed, currentTick, fishType, rng, spawnEdge, groupIndex, groupAnchorSeed, sharedParams),
            _ => GenerateLinearPath(fishId, seed, currentTick, fishType, rng, spawnEdge, groupIndex, groupAnchorSeed, sharedParams)
        };
    }
    
    private static void CleanupOldCacheEntries(long currentTick)
    {
        // Remove entries older than 150 ticks (5 seconds at 30 TPS)
        var keysToRemove = _groupParametersCache
            .Where(kvp => currentTick - kvp.Value.CreatedTick > 150)
            .Select(kvp => kvp.Key)
            .ToList();
        
        foreach (var key in keysToRemove)
        {
            _groupParametersCache.Remove(key);
        }
    }
    
    /// <summary>
    /// Compute base anchor points for the entire group (before formation offsets)
    /// </summary>
    private static (float[] baseStart, float[] baseEnd, int startEdge, int endEdge) ComputeBaseAnchorPoints(SeededRandom groupRng, int spawnEdge)
    {
        // If no spawn edge specified, use random edge
        if (spawnEdge < 0 || spawnEdge > 7)
        {
            int startEdge = groupRng.NextInt(0, 4);
            int endEdge = (startEdge + 2) % 4;
            float[] start = GeneratePointOnEdge(startEdge, groupRng);
            float[] end = GeneratePointOnEdge(endEdge, groupRng);
            return (start, end, startEdge, endEdge);
        }
        
        // Map spawn direction to edge and generate base anchor points
        int computedStartEdge;
        float[] baseStart;
        
        switch (spawnEdge)
        {
            case 0: // From left edge
                computedStartEdge = 0;
                baseStart = new[] { 0f, groupRng.NextFloat(200f, CANVAS_HEIGHT - 200f) };
                break;
            case 1: // From right edge
                computedStartEdge = 1;
                baseStart = new[] { CANVAS_WIDTH, groupRng.NextFloat(200f, CANVAS_HEIGHT - 200f) };
                break;
            case 2: // From top edge
                computedStartEdge = 2;
                baseStart = new[] { groupRng.NextFloat(200f, CANVAS_WIDTH - 200f), 0f };
                break;
            case 3: // From bottom edge
                computedStartEdge = 3;
                baseStart = new[] { groupRng.NextFloat(200f, CANVAS_WIDTH - 200f), CANVAS_HEIGHT };
                break;
            case 4: // From left-top corner
                computedStartEdge = groupRng.NextFloat() > 0.5f ? 0 : 2;
                if (computedStartEdge == 0)
                {
                    baseStart = new[] { 0f, groupRng.NextFloat(50f, 200f) };
                }
                else
                {
                    baseStart = new[] { groupRng.NextFloat(50f, 200f), 0f };
                }
                break;
            case 5: // From right-top corner
                computedStartEdge = groupRng.NextFloat() > 0.5f ? 1 : 2;
                if (computedStartEdge == 1)
                {
                    baseStart = new[] { CANVAS_WIDTH, groupRng.NextFloat(50f, 200f) };
                }
                else
                {
                    baseStart = new[] { groupRng.NextFloat(CANVAS_WIDTH - 200f, CANVAS_WIDTH - 50f), 0f };
                }
                break;
            case 6: // From left-bottom corner
                computedStartEdge = groupRng.NextFloat() > 0.5f ? 0 : 3;
                if (computedStartEdge == 0)
                {
                    baseStart = new[] { 0f, groupRng.NextFloat(CANVAS_HEIGHT - 200f, CANVAS_HEIGHT - 50f) };
                }
                else
                {
                    baseStart = new[] { groupRng.NextFloat(50f, 200f), CANVAS_HEIGHT };
                }
                break;
            case 7: // From right-bottom corner
                computedStartEdge = groupRng.NextFloat() > 0.5f ? 1 : 3;
                if (computedStartEdge == 1)
                {
                    baseStart = new[] { CANVAS_WIDTH, groupRng.NextFloat(CANVAS_HEIGHT - 200f, CANVAS_HEIGHT - 50f) };
                }
                else
                {
                    baseStart = new[] { groupRng.NextFloat(CANVAS_WIDTH - 200f, CANVAS_WIDTH - 50f), CANVAS_HEIGHT };
                }
                break;
            default:
                computedStartEdge = 0;
                baseStart = new[] { 0f, CANVAS_HEIGHT / 2f };
                break;
        }
        
        // Compute end edge and base end point
        int computedEndEdge = spawnEdge < 4 ? (computedStartEdge + 2) % 4 : ((computedStartEdge + 1 + groupRng.NextInt(0, 2)) % 4);
        float[] baseEnd = GeneratePointOnEdge(computedEndEdge, groupRng);
        
        return (baseStart, baseEnd, computedStartEdge, computedEndEdge);
    }
    
    private static int GenerateGroupAnchorSeed(int tick, int spawnEdge)
    {
        // Use only shared group properties to create consistent anchor across all fish in group
        long combined = ((long)tick * 31L + (long)spawnEdge * 17L);
        return (int)(combined % int.MaxValue);
    }
    
    private static int GenerateSeed(int fishId, int tick, int spawnEdge, int groupIndex)
    {
        // Combine fish ID, tick, spawn edge, group index and counter for unique seed
        // Use 64-bit arithmetic to prevent overflow before modulo
        long combined = ((long)fishId * 31L + (long)tick * 17L + (long)spawnEdge * 13L + (long)groupIndex * 7L + _seedCounter++);
        return (int)(combined % int.MaxValue);
    }
    
    private static IPath GenerateLinearOrSinePath(int fishId, int seed, int startTick, FishDefinition fishType, SeededRandom rng, int spawnEdge, int groupIndex, int groupAnchorSeed, SharedGroupParameters sharedParams)
    {
        // Generate entry and exit points based on spawn edge using pre-computed base anchors
        var (start, end) = GenerateEdgeToEdgePointsFromSpawnEdge(rng, spawnEdge, groupIndex, sharedParams);
        
        // Use pre-computed shared parameters for the group
        if (sharedParams.PathType == PathType.Sine)
        {
            return new SinePath(fishId, seed, startTick, fishType.BaseSpeed, start, end, sharedParams.Amplitude, sharedParams.Frequency);
        }
        else
        {
            return new LinearPath(fishId, seed, startTick, fishType.BaseSpeed, start, end);
        }
    }
    
    private static IPath GenerateLinearPath(int fishId, int seed, int startTick, FishDefinition fishType, SeededRandom rng, int spawnEdge, int groupIndex, int groupAnchorSeed, SharedGroupParameters sharedParams)
    {
        var (start, end) = GenerateEdgeToEdgePointsFromSpawnEdge(rng, spawnEdge, groupIndex, sharedParams);
        return new LinearPath(fishId, seed, startTick, fishType.BaseSpeed, start, end);
    }
    
    private static IPath GenerateSinePath(int fishId, int seed, int startTick, FishDefinition fishType, SeededRandom rng, int spawnEdge, int groupIndex, int groupAnchorSeed, SharedGroupParameters sharedParams)
    {
        var (start, end) = GenerateEdgeToEdgePointsFromSpawnEdge(rng, spawnEdge, groupIndex, sharedParams);
        
        // Use pre-computed shared parameters for bonus fish sine waves
        return new SinePath(fishId, seed, startTick, fishType.BaseSpeed, start, end, sharedParams.BonusAmplitude, sharedParams.BonusFrequency);
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
    
    private static IPath GenerateBezierPath(int fishId, int seed, int startTick, FishDefinition fishType, SeededRandom rng, int spawnEdge, int groupIndex, int groupAnchorSeed, SharedGroupParameters sharedParams)
    {
        // Generate start and end points based on spawn edge using pre-computed base anchors
        var (start, end) = GenerateEdgeToEdgePointsFromSpawnEdge(rng, spawnEdge, groupIndex, sharedParams);
        
        // Apply pre-computed shared control point offsets to this fish's start/end points
        float[] p1 = new[]
        {
            MathF.Max(100f, MathF.Min(CANVAS_WIDTH - 100f, start[0] + sharedParams.BezierP1OffsetX)),
            MathF.Max(100f, MathF.Min(CANVAS_HEIGHT - 100f, start[1] + sharedParams.BezierP1OffsetY))
        };
        
        float[] p2 = new[]
        {
            MathF.Max(100f, MathF.Min(CANVAS_WIDTH - 100f, end[0] + sharedParams.BezierP2OffsetX)),
            MathF.Max(100f, MathF.Min(CANVAS_HEIGHT - 100f, end[1] + sharedParams.BezierP2OffsetY))
        };
        
        return new BezierPath(fishId, seed, startTick, fishType.BaseSpeed, start, p1, p2, end);
    }
    
    private static IPath GenerateCircularOrComplexPath(int fishId, int seed, int startTick, FishDefinition fishType, SeededRandom rng, int spawnEdge, int groupIndex, int groupAnchorSeed, SharedGroupParameters sharedParams)
    {
        // 70% Bezier, 30% Circular for variety
        if (rng.NextFloat() > 0.3f)
        {
            return GenerateBezierPath(fishId, seed, startTick, fishType, rng, spawnEdge, groupIndex, groupAnchorSeed, sharedParams);
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
    /// Uses pre-computed base anchors from SharedGroupParameters and applies formation offsets
    /// </summary>
    private static (float[] start, float[] end) GenerateEdgeToEdgePointsFromSpawnEdge(SeededRandom rng, int spawnEdge, int groupIndex, SharedGroupParameters sharedParams)
    {
        // If no spawn edge specified, use random edge
        if (spawnEdge < 0 || spawnEdge > 7)
        {
            return GenerateEdgeToEdgePoints(rng);
        }
        
        // Calculate 2D formation offsets for diamond patterns
        // For diamond formations, negative indices create left/up offsets, positive create right/down
        float offsetMultiplier = 30f; // Spacing between fish in formation
        float lateralOffset = groupIndex * offsetMultiplier;  // Perpendicular to movement
        float longitudinalOffset = MathF.Abs(groupIndex) * 15f;  // Along movement direction
        
        // Use pre-computed base anchors from SharedGroupParameters
        float[] baseStart = sharedParams.BaseAnchorStart;
        float[] baseEnd = sharedParams.BaseAnchorEnd;
        int startEdge = sharedParams.StartEdge;
        int endEdge = sharedParams.EndEdge;
        
        // Apply formation offsets to base start position based on edge
        float[] start = new float[2];
        if (startEdge == 0)
        {
            // Left edge - offset vertically (lateral) and push inward (longitudinal)
            start[0] = baseStart[0] + longitudinalOffset;
            start[1] = baseStart[1] + lateralOffset;
        }
        else if (startEdge == 1)
        {
            // Right edge - offset vertically (lateral) and push inward (longitudinal)
            start[0] = baseStart[0] - longitudinalOffset;
            start[1] = baseStart[1] + lateralOffset;
        }
        else if (startEdge == 2)
        {
            // Top edge - offset horizontally (lateral) and push inward (longitudinal)
            start[0] = baseStart[0] + lateralOffset;
            start[1] = baseStart[1] + longitudinalOffset;
        }
        else
        {
            // Bottom edge - offset horizontally (lateral) and push inward (longitudinal)
            start[0] = baseStart[0] + lateralOffset;
            start[1] = baseStart[1] - longitudinalOffset;
        }
        
        // Apply formation offsets to base end position based on edge
        float[] end = new float[2];
        if (endEdge == 0)
        {
            // Left edge exit - apply Y offset (lateral) and push inward from edge (longitudinal)
            end[0] = baseEnd[0] + longitudinalOffset;
            end[1] = baseEnd[1] + lateralOffset;
        }
        else if (endEdge == 1)
        {
            // Right edge exit - apply Y offset (lateral) and push inward from edge (longitudinal)
            end[0] = baseEnd[0] - longitudinalOffset;
            end[1] = baseEnd[1] + lateralOffset;
        }
        else if (endEdge == 2)
        {
            // Top edge exit - apply X offset (lateral) and push inward from edge (longitudinal)
            end[0] = baseEnd[0] + lateralOffset;
            end[1] = baseEnd[1] + longitudinalOffset;
        }
        else
        {
            // Bottom edge exit - apply X offset (lateral) and push inward from edge (longitudinal)
            end[0] = baseEnd[0] + lateralOffset;
            end[1] = baseEnd[1] - longitudinalOffset;
        }
        
        // Clamp values to ensure they're within bounds
        start[0] = MathF.Max(0f, MathF.Min(CANVAS_WIDTH, start[0]));
        start[1] = MathF.Max(0f, MathF.Min(CANVAS_HEIGHT, start[1]));
        end[0] = MathF.Max(0f, MathF.Min(CANVAS_WIDTH, end[0]));
        end[1] = MathF.Max(0f, MathF.Min(CANVAS_HEIGHT, end[1]));
        
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
