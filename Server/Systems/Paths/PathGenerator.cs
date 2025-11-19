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
    
    private enum PathType { Linear, Sine, Parabola }
    
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
    public static IPath GeneratePathForFish(int fishId, FishDefinition fishType, int currentTick, int spawnEdge = -1, int lateralIndex = 0, int trailingRank = 0, long groupId = 0)
    {
        // Generate unique seed for this fish, incorporating spawn edge and trailing rank for variation
        int seed = GenerateSeed(fishId, currentTick, spawnEdge, trailingRank);
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
                
                // Determine path type with balanced distribution
                PathType pathType;
                float typeRoll = groupRng.NextFloat();
                if (typeRoll > 0.7f)
                    pathType = PathType.Sine;
                else if (typeRoll > 0.4f)
                    pathType = PathType.Linear;
                else
                    pathType = PathType.Parabola;
                
                sharedParams = new SharedGroupParameters
                {
                    PathType = pathType,
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
            FishCategory.SmallFish => GenerateLinearOrSinePath(fishId, seed, currentTick, fishType, rng, spawnEdge, lateralIndex, trailingRank, groupAnchorSeed, sharedParams),
            FishCategory.MediumFish => GenerateLinearOrSinePath(fishId, seed, currentTick, fishType, rng, spawnEdge, lateralIndex, trailingRank, groupAnchorSeed, sharedParams),
            FishCategory.LargeFish => GenerateBezierPath(fishId, seed, currentTick, fishType, rng, spawnEdge, lateralIndex, trailingRank, groupAnchorSeed, sharedParams),
            FishCategory.BonusFish => GenerateSinePath(fishId, seed, currentTick, fishType, rng, spawnEdge, lateralIndex, trailingRank, groupAnchorSeed, sharedParams),
            _ => GenerateLinearPath(fishId, seed, currentTick, fishType, rng, spawnEdge, lateralIndex, trailingRank, groupAnchorSeed, sharedParams)
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
        // Spawn slightly outside boundaries to prevent fish from getting stuck at edges
        const float SPAWN_OFFSET = -10f;
        
        // If no spawn edge specified, use random edge
        if (spawnEdge < 0 || spawnEdge > 11)
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
                baseStart = new[] { SPAWN_OFFSET, groupRng.NextFloat(200f, CANVAS_HEIGHT - 200f) };
                break;
            case 1: // From right edge
                computedStartEdge = 1;
                baseStart = new[] { CANVAS_WIDTH - SPAWN_OFFSET, groupRng.NextFloat(200f, CANVAS_HEIGHT - 200f) };
                break;
            case 2: // From top edge
                computedStartEdge = 2;
                baseStart = new[] { groupRng.NextFloat(200f, CANVAS_WIDTH - 200f), SPAWN_OFFSET };
                break;
            case 3: // From bottom edge
                computedStartEdge = 3;
                baseStart = new[] { groupRng.NextFloat(200f, CANVAS_WIDTH - 200f), CANVAS_HEIGHT - SPAWN_OFFSET };
                break;
            case 4: // From left-top corner
                computedStartEdge = groupRng.NextFloat() > 0.5f ? 0 : 2;
                if (computedStartEdge == 0)
                {
                    baseStart = new[] { SPAWN_OFFSET, groupRng.NextFloat(50f, 200f) };
                }
                else
                {
                    baseStart = new[] { groupRng.NextFloat(50f, 200f), SPAWN_OFFSET };
                }
                break;
            case 5: // From right-top corner
                computedStartEdge = groupRng.NextFloat() > 0.5f ? 1 : 2;
                if (computedStartEdge == 1)
                {
                    baseStart = new[] { CANVAS_WIDTH - SPAWN_OFFSET, groupRng.NextFloat(50f, 200f) };
                }
                else
                {
                    baseStart = new[] { groupRng.NextFloat(CANVAS_WIDTH - 200f, CANVAS_WIDTH - 50f), SPAWN_OFFSET };
                }
                break;
            case 6: // From left-bottom corner
                computedStartEdge = groupRng.NextFloat() > 0.5f ? 0 : 3;
                if (computedStartEdge == 0)
                {
                    baseStart = new[] { SPAWN_OFFSET, groupRng.NextFloat(CANVAS_HEIGHT - 200f, CANVAS_HEIGHT - 50f) };
                }
                else
                {
                    baseStart = new[] { groupRng.NextFloat(50f, 200f), CANVAS_HEIGHT - SPAWN_OFFSET };
                }
                break;
            case 7: // From right-bottom corner
                computedStartEdge = groupRng.NextFloat() > 0.5f ? 1 : 3;
                if (computedStartEdge == 1)
                {
                    baseStart = new[] { CANVAS_WIDTH - SPAWN_OFFSET, groupRng.NextFloat(CANVAS_HEIGHT - 200f, CANVAS_HEIGHT - 50f) };
                }
                else
                {
                    baseStart = new[] { groupRng.NextFloat(CANVAS_WIDTH - 200f, CANVAS_WIDTH - 50f), CANVAS_HEIGHT - SPAWN_OFFSET };
                }
                break;
            case 8: // From top-center (middle 40% of top edge)
                computedStartEdge = 2;
                baseStart = new[] { groupRng.NextFloat(CANVAS_WIDTH * 0.3f, CANVAS_WIDTH * 0.7f), SPAWN_OFFSET };
                break;
            case 9: // From bottom-center (middle 40% of bottom edge)
                computedStartEdge = 3;
                baseStart = new[] { groupRng.NextFloat(CANVAS_WIDTH * 0.3f, CANVAS_WIDTH * 0.7f), CANVAS_HEIGHT - SPAWN_OFFSET };
                break;
            case 10: // From left-center (middle 40% of left edge)
                computedStartEdge = 0;
                baseStart = new[] { SPAWN_OFFSET, groupRng.NextFloat(CANVAS_HEIGHT * 0.3f, CANVAS_HEIGHT * 0.7f) };
                break;
            case 11: // From right-center (middle 40% of right edge)
                computedStartEdge = 1;
                baseStart = new[] { CANVAS_WIDTH - SPAWN_OFFSET, groupRng.NextFloat(CANVAS_HEIGHT * 0.3f, CANVAS_HEIGHT * 0.7f) };
                break;
            default:
                computedStartEdge = 0;
                baseStart = new[] { SPAWN_OFFSET, CANVAS_HEIGHT / 2f };
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
        // Combine fish ID, tick, spawn edge, group index for deterministic seed
        // Use 64-bit arithmetic to prevent overflow before modulo
        // Note: Removed _seedCounter to ensure deterministic behavior for testing
        long combined = ((long)fishId * 31L + (long)tick * 17L + (long)spawnEdge * 13L + (long)groupIndex * 7L);
        return (int)(combined % int.MaxValue);
    }
    
    private static IPath GenerateLinearOrSinePath(int fishId, int seed, int startTick, FishDefinition fishType, SeededRandom rng, int spawnEdge, int lateralIndex, int trailingRank, int groupAnchorSeed, SharedGroupParameters sharedParams)
    {
        // Generate entry and exit points based on spawn edge using pre-computed base anchors
        var (start, end) = GenerateEdgeToEdgePointsFromSpawnEdge(rng, spawnEdge, lateralIndex, trailingRank, sharedParams);
        
        // Use pre-computed shared parameters for the group
        if (sharedParams.PathType == PathType.Sine)
        {
            return new SinePath(fishId, seed, startTick, fishType.BaseSpeed, start, end, sharedParams.BaseAnchorStart, sharedParams.BaseAnchorEnd, sharedParams.Amplitude, sharedParams.Frequency);
        }
        else if (sharedParams.PathType == PathType.Parabola)
        {
            // Parabola: start from edge, arc to opposite side, return to same edge area
            return GenerateParabolaPath(fishId, seed, startTick, fishType, rng, start, sharedParams);
        }
        else
        {
            return new LinearPath(fishId, seed, startTick, fishType.BaseSpeed, start, end);
        }
    }
    
    private static IPath GenerateLinearPath(int fishId, int seed, int startTick, FishDefinition fishType, SeededRandom rng, int spawnEdge, int lateralIndex, int trailingRank, int groupAnchorSeed, SharedGroupParameters sharedParams)
    {
        var (start, end) = GenerateEdgeToEdgePointsFromSpawnEdge(rng, spawnEdge, lateralIndex, trailingRank, sharedParams);
        return new LinearPath(fishId, seed, startTick, fishType.BaseSpeed, start, end);
    }
    
    private static IPath GenerateSinePath(int fishId, int seed, int startTick, FishDefinition fishType, SeededRandom rng, int spawnEdge, int lateralIndex, int trailingRank, int groupAnchorSeed, SharedGroupParameters sharedParams)
    {
        var (start, end) = GenerateEdgeToEdgePointsFromSpawnEdge(rng, spawnEdge, lateralIndex, trailingRank, sharedParams);
        
        // Use pre-computed shared parameters for bonus fish sine waves
        return new SinePath(fishId, seed, startTick, fishType.BaseSpeed, start, end, sharedParams.BaseAnchorStart, sharedParams.BaseAnchorEnd, sharedParams.BonusAmplitude, sharedParams.BonusFrequency);
    }
    
    /// <summary>
    /// Generate a parabola path that arcs across screen and returns to same edge area
    /// </summary>
    private static IPath GenerateParabolaPath(int fishId, int seed, int startTick, FishDefinition fishType, SeededRandom rng, float[] start, SharedGroupParameters sharedParams)
    {
        // Parabola: fish arcs out and returns to same edge region
        // End point is near start point but offset along the edge
        float[] end;
        
        // Determine offset based on start edge
        if (sharedParams.StartEdge == 0 || sharedParams.StartEdge == 1)
        {
            // Left or right edge: offset vertically along edge
            float verticalOffset = rng.NextFloat(-300f, 300f);
            end = new[] { start[0], Math.Clamp(start[1] + verticalOffset, 100f, CANVAS_HEIGHT - 100f) };
        }
        else
        {
            // Top or bottom edge: offset horizontally along edge
            float horizontalOffset = rng.NextFloat(-400f, 400f);
            end = new[] { Math.Clamp(start[0] + horizontalOffset, 100f, CANVAS_WIDTH - 100f), start[1] };
        }
        
        // Create control points for parabolic arc toward center of screen
        float centerX = CANVAS_WIDTH / 2f;
        float centerY = CANVAS_HEIGHT / 2f;
        
        float[] p1 = new[]
        {
            start[0] + (centerX - start[0]) * 0.4f + sharedParams.BezierP1OffsetX * 0.5f,
            start[1] + (centerY - start[1]) * 0.4f + sharedParams.BezierP1OffsetY * 0.5f
        };
        
        float[] p2 = new[]
        {
            end[0] + (centerX - end[0]) * 0.4f + sharedParams.BezierP2OffsetX * 0.5f,
            end[1] + (centerY - end[1]) * 0.4f + sharedParams.BezierP2OffsetY * 0.5f
        };
        
        return new BezierPath(fishId, seed, startTick, fishType.BaseSpeed, start, end, p1, p2);
    }
    
    /// <summary>
    /// Generate a sine wave path with specific start and end points (for Wave Rider bonus fish)
    /// Smoother and less bouncy with reduced amplitude and frequency
    /// </summary>
    public static IPath GenerateSinePathWithPoints(int fishId, int seed, int startTick, float speed, float[] start, float[] end)
    {
        // Reduced amplitude (20-35 instead of 40-80) for smoother motion
        float amplitude = 20f + ((seed % 16) * (35f - 20f) / 15f);
        // Reduced frequency (2-4 instead of 3-6) for less bouncy motion
        float frequency = 2f + ((seed % 3) * (4f - 2f) / 2f);
        return new SinePath(fishId, seed, startTick, speed, start, end, start, end, amplitude, frequency);
    }
    
    private static IPath GenerateBezierPath(int fishId, int seed, int startTick, FishDefinition fishType, SeededRandom rng, int spawnEdge, int lateralIndex, int trailingRank, int groupAnchorSeed, SharedGroupParameters sharedParams)
    {
        // Generate start and end points based on spawn edge using pre-computed base anchors
        var (start, end) = GenerateEdgeToEdgePointsFromSpawnEdge(rng, spawnEdge, lateralIndex, trailingRank, sharedParams);
        
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
    private static (float[] start, float[] end) GenerateEdgeToEdgePointsFromSpawnEdge(SeededRandom rng, int spawnEdge, int lateralIndex, int trailingRank, SharedGroupParameters sharedParams)
    {
        // If no spawn edge specified, use random edge
        if (spawnEdge < 0 || spawnEdge > 11)
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
        // FORMATION BEHAVIOR: Fish can be positioned both laterally (side-by-side) and longitudinally (trailing)
        // lateralIndex controls perpendicular offset for row formations
        // trailingRank controls parallel offset for line formations (all fish trail behind leader)
        float lateralOffset = lateralIndex * 80f;  // Lateral spacing for side-by-side formations
        float longitudinalOffset = -trailingRank * 120f;  // Trailing spacing - all fish trail behind leader
        
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
