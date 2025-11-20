using OceanKing.Server.Systems.Paths;
using OceanKing.Server.Models;

namespace OceanKing.Server.Entities;

public class Fish
{
    public string FishId { get; set; } = Guid.NewGuid().ToString();
    public int FishIdHash { get; set; } // Numeric ID for client compatibility
    public int TypeId { get; set; } // 0=small, 1=medium, 2=large, 3=boss
    public decimal BaseValue { get; set; }
    public float DestructionOdds { get; set; } // Probability (0-1) that a bullet destroys this fish
    
    // Position and movement
    public float X { get; set; }
    public float Y { get; set; }
    public float HitboxRadius { get; set; }
    
    // Path-based movement system
    public IPath? Path { get; set; }
    public Models.PathData? CachedPathData { get; set; } // Cached to avoid per-tick allocation
    
    // Timing
    public long SpawnTick { get; set; }
    public long DespawnTick { get; set; }
    public float PathDurationVariance { get; set; } = 1.0f; // Multiplier for path duration variance (default 1.0 = no variance)
    
    // Special properties
    public bool IsExplosive { get; set; }
    public bool IsChainLightningEligible { get; set; } = true;
    
    // Group information for debugging
    public long GroupId { get; set; }
    public int TrailingRank { get; set; }

    public static Fish CreateFish(int typeId, long currentTick, int spawnEdge = -1, int lateralIndex = 0, int trailingRank = 0, long groupId = 0)
    {
        // Lookup fish definition from catalog
        var fishDef = FishCatalog.GetFish(typeId);
        if (fishDef == null)
        {
            throw new ArgumentException($"Invalid fish type ID: {typeId}");
        }
        
        // Generate stable fish ID hash for path generation
        var fishIdGuid = Guid.NewGuid().ToString();
        var fishIdHash = Math.Abs(fishIdGuid.GetHashCode());
        
        // Generate parametric path for this fish with spawn edge, lateral, and trailing information
        var path = PathGenerator.GeneratePathForFish(
            fishIdHash,
            fishDef,
            (int)currentTick,
            spawnEdge,
            lateralIndex,
            trailingRank,
            groupId
        );
        
        // Get initial position from path
        var startPos = path.GetPosition(0f);
        
        var fish = new Fish
        {
            FishId = fishIdGuid,
            FishIdHash = fishIdHash, // Numeric ID for client
            TypeId = typeId,
            X = startPos[0],
            Y = startPos[1],
            SpawnTick = currentTick,
            HitboxRadius = fishDef.HitboxRadius,
            Path = path, // Store the path for client synchronization
            GroupId = groupId, // Store group ID for debugging
            TrailingRank = trailingRank // Store trailing rank for variance calculation
        };
        
        // Set BaseValue (payout multiplier from catalog)
        fish.BaseValue = fishDef.PayoutMultiplier;
        
        // Set DestructionOdds (capture probability from catalog)
        fish.DestructionOdds = fishDef.CaptureProbability;
        
        // Calculate path duration variance for group fish
        // Apply variance: baseDuration * (0.9 + rank * 0.05) to stagger despawn times
        // This ensures trailing fish have slightly longer paths than leaders
        if (groupId > 0 && trailingRank > 0)
        {
            // Apply 10-15% variance based on trailing rank
            // Leading fish (rank 0): 1.0x duration
            // Second fish (rank 1): ~1.05x duration
            // Third fish (rank 2): ~1.10x duration, etc.
            fish.PathDurationVariance = 0.9f + (trailingRank * 0.05f);
            
            // Also add some random variance to prevent exact synchronization
            var random = new Random(fishIdHash);
            fish.PathDurationVariance += (float)(random.NextDouble() * 0.1f - 0.05f); // ±5% additional random variance
        }
        else
        {
            fish.PathDurationVariance = 1.0f; // No variance for single fish or group leaders
        }
        
        // Cache path data with variance AFTER calculating PathDurationVariance
        var pathData = path.GetPathData();
        pathData.Variance = fish.PathDurationVariance; // Set variance in PathData for client
        fish.CachedPathData = pathData; // Cache for performance
        
        // Set despawn time based on actual path duration with variance applied
        // This ensures fish are removed exactly when their path completes
        float adjustedDuration = pathData.Duration * fish.PathDurationVariance;
        fish.DespawnTick = currentTick + (long)(adjustedDuration * 30f); // Duration in seconds * 30 TPS
        
        return fish;
    }

    public void UpdatePosition(float deltaTime, long currentTick)
    {
        // PATH-BASED MOVEMENT SYSTEM
        if (Path != null && CachedPathData != null)
        {
            // Calculate time progress along the path
            float ticksSinceSpawn = currentTick - SpawnTick;
            
            // Handle fish that haven't spawned yet (staggered spawning)
            if (ticksSinceSpawn < 0)
            {
                // Keep fish at starting position until spawn time
                var startPos = Path.GetPosition(0f);
                X = startPos[0];
                Y = startPos[1];
                return;
            }
            
            // Apply path duration variance for staggered despawn times
            float pathDuration = CachedPathData.Duration * PathDurationVariance * 30f; // Convert seconds to ticks with variance
            
            // Normalize time (0.0 to 1.0)
            float t = pathDuration > 0 ? ticksSinceSpawn / pathDuration : 0f;
            
            // Handle looping paths
            if (CachedPathData.Loop && t > 1f)
            {
                t = t % 1f;
            }
            else if (t > 1f)
            {
                t = 1f; // Clamp to end of path
            }
            
            // Get position from path
            var pos = Path.GetPosition(t);
            X = pos[0];
            Y = pos[1];
        }
        else
        {
            // Error: Fish without a path should not exist
            Console.WriteLine($"[ERROR] Fish {FishId} has no path assigned!");
        }
    }
    
}
