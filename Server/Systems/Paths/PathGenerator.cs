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
                    Amplitude = groupRng.NextFloat(5f, 25f),
                    Frequency = groupRng.NextFloat(1.5f, 7f),
                    BonusAmplitude = groupRng.NextFloat(10f, 40f),
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
        // Remove entries older than 450 ticks (15 seconds at 30 TPS)
        var keysToRemove = _groupParametersCache
            .Where(kvp => currentTick - kvp.Value.CreatedTick > 450)
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
            return new SinePath(fishId, seed, startTick, fishType.BaseSpeed, start, end, sharedParams.BaseAnchorStart, sharedParams.BaseAnchorEnd, sharedParams.Amplitude, sharedParams.Frequency);
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
        return new SinePath(fishId, seed, startTick, fishType.BaseSpeed, start, end, sharedParams.BaseAnchorStart, sharedParams.BaseAnchorEnd, sharedParams.BonusAmplitude, sharedParams.BonusFrequency);
    }
    
    /// <summary>
    /// Generate a sine wave path with specific start and end points (for Wave Rider bonus fish)
    /// </summary>
    public static IPath GenerateSinePathWithPoints(int fishId, int seed, int startTick, float speed, float[] start, float[] end)
    {
        float amplitude = 40f + ((seed % 41) * (80f - 40f) / 40f);
        float frequency = 3f + ((seed % 4) * (6f - 3f) / 3f);
        return new SinePath(fishId, seed, startTick, speed, start, end, start, end, amplitude, frequency);
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
    /// in LOCAL movement space (perpendicular and parallel to direction vector)
    /// </summary>
    private static (float[] start, float[] end) GenerateEdgeToEdgePointsFromSpawnEdge(SeededRandom rng, int spawnEdge, int groupIndex, SharedGroupParameters sharedParams)
    {
        // If no spawn edge specified, use random edge
        if (spawnEdge < 0 || spawnEdge > 7)
        {
            return GenerateEdgeToEdgePoints(rng);
        }
        
        // Use pre-computed base anchors from SharedGroupParameters
        float[] baseStart = sharedParams.BaseAnchorStart;
        float[] baseEnd = sharedParams.BaseAnchorEnd;
        
        // Compute movement direction vector (normalized)
        float dx = baseEnd[0] - baseStart[0];
        float dy = baseEnd[1] - baseStart[1];
        float distance = MathF.Sqrt(dx * dx + dy * dy);
        
        // Avoid division by zero
        if (distance < 0.001f)
        {
            return (baseStart, baseEnd);
        }
        
        float dirX = dx / distance;
        float dirY = dy / distance;
        
        // Compute perpendicular vector (rotate direction by 90 degrees)
        // For 2D: perpendicular of (x, y) is (-y, x)
        float perpX = -dirY;
        float perpY = dirX;
        
        // Calculate formation offsets in LOCAL movement space
        // LINE-FOLLOWING BEHAVIOR: Fish follow behind each other in a line
        // Small lateral variation for natural swimming, large longitudinal spacing for line formation
        float lateralVariation = rng.NextFloat(-5f, 5f); // Small random drift for natural movement
        float lateralOffset = lateralVariation;  // Minimal perpendicular offset
        float longitudinalOffset = groupIndex * 50f;  // Large spacing along movement direction (line formation)
        
        // Apply offsets to start position in LOCAL space
        float[] start = new float[2];
        start[0] = baseStart[0] + (perpX * lateralOffset) + (dirX * longitudinalOffset);
        start[1] = baseStart[1] + (perpY * lateralOffset) + (dirY * longitudinalOffset);
        
        // Apply SAME offsets to end position in LOCAL space (maintains formation)
        float[] end = new float[2];
        end[0] = baseEnd[0] + (perpX * lateralOffset) + (dirX * longitudinalOffset);
        end[1] = baseEnd[1] + (perpY * lateralOffset) + (dirY * longitudinalOffset);
        
        // Add buffer zone to prevent fish from getting stuck at exact boundaries
        // Allow fish to spawn slightly outside and exit slightly outside for smooth transitions
        const float EDGE_BUFFER = 50f;
        start[0] = MathF.Max(-EDGE_BUFFER, MathF.Min(CANVAS_WIDTH + EDGE_BUFFER, start[0]));
        start[1] = MathF.Max(-EDGE_BUFFER, MathF.Min(CANVAS_HEIGHT + EDGE_BUFFER, start[1]));
        end[0] = MathF.Max(-EDGE_BUFFER, MathF.Min(CANVAS_WIDTH + EDGE_BUFFER, end[0]));
        end[1] = MathF.Max(-EDGE_BUFFER, MathF.Min(CANVAS_HEIGHT + EDGE_BUFFER, end[1]));
        
        return (start, end);
    }
    
    private static float[] GeneratePointOnEdge(int edge, SeededRandom rng)
    {
        // Spawn slightly outside boundaries to prevent fish from getting stuck at edges
        const float SPAWN_OFFSET = -10f; // Start slightly off-screen
        return edge switch
        {
            0 => new[] { SPAWN_OFFSET, rng.NextFloat(100f, CANVAS_HEIGHT - 100f) }, // Left - spawn slightly outside
            1 => new[] { CANVAS_WIDTH - SPAWN_OFFSET, rng.NextFloat(100f, CANVAS_HEIGHT - 100f) }, // Right - spawn slightly outside
            2 => new[] { rng.NextFloat(100f, CANVAS_WIDTH - 100f), SPAWN_OFFSET }, // Top - spawn slightly outside
            3 => new[] { rng.NextFloat(100f, CANVAS_WIDTH - 100f), CANVAS_HEIGHT - SPAWN_OFFSET }, // Bottom - spawn slightly outside
            _ => new[] { CANVAS_WIDTH / 2f, CANVAS_HEIGHT / 2f } // Default to center instead of 0,0
        };
    }
}
