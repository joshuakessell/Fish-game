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
    
    // Special properties
    public bool IsExplosive { get; set; }
    public bool IsChainLightningEligible { get; set; } = true;

    public static Fish CreateFish(int typeId, long currentTick, int spawnEdge = -1, int groupIndex = 0)
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
        
        // Generate parametric path for this fish with spawn edge information
        var path = PathGenerator.GeneratePathForFish(
            fishIdHash,
            fishDef,
            (int)currentTick,
            spawnEdge,
            groupIndex
        );
        
        // Get initial position from path
        var startPos = path.GetPosition(0f);
        
        // Cache path data to avoid per-tick allocations
        var pathData = path.GetPathData();
        
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
            CachedPathData = pathData // Cache for performance
        };
        
        // Set BaseValue (payout multiplier from catalog)
        fish.BaseValue = fishDef.PayoutMultiplier;
        
        // Set DestructionOdds (capture probability from catalog)
        fish.DestructionOdds = fishDef.CaptureProbability;
        
        // Set despawn time based on category
        switch (fishDef.Category)
        {
            case FishCategory.SmallFish:
                fish.DespawnTick = currentTick + 600; // 20 seconds
                break;
            case FishCategory.MediumFish:
                fish.DespawnTick = currentTick + 900; // 30 seconds
                break;
            case FishCategory.LargeFish:
                fish.DespawnTick = currentTick + 1200; // 40 seconds
                break;
            case FishCategory.BonusFish:
                fish.DespawnTick = currentTick + 1800; // 60 seconds
                break;
        }
        
        return fish;
    }

    public void UpdatePosition(float deltaTime, long currentTick)
    {
        // PATH-BASED MOVEMENT SYSTEM
        if (Path != null && CachedPathData != null)
        {
            // Calculate time progress along the path
            float ticksSinceSpawn = currentTick - SpawnTick;
            float pathDuration = CachedPathData.Duration * 30f; // Convert seconds to ticks
            
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
