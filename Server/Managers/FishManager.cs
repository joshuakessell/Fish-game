using OceanKing.Server.Entities;

namespace OceanKing.Server.Managers;

public class FishManager
{
    private readonly Dictionary<string, Fish> _activeFish = new();
    private readonly int MIN_FISH_COUNT;
    private readonly int MAX_FISH_COUNT;
    private const int ARENA_WIDTH = 1800;
    private const int ARENA_HEIGHT = 900;
    
    // Unique group ID counter for fish formations
    private static long _groupIdCounter = 0;
    
    // Spawn rate control
    private long _lastSpawnTick = 0;
    private const int MIN_TICKS_BETWEEN_SPAWNS = 2;
    
    // Wave Rider bonus fish spawn control
    private long _lastWaveRiderSpawnTick = 0;
    private const int WAVE_RIDER_SPAWN_INTERVAL = 150;
    private bool _waveRiderSpawnFromLeft = true;
    
    public FishManager()
    {
        MIN_FISH_COUNT = Random.Shared.Next(20, 31);
        MAX_FISH_COUNT = Random.Shared.Next(MIN_FISH_COUNT + 5, 41);
        Console.WriteLine($"[FISH MANAGER] Session fish count range: {MIN_FISH_COUNT}-{MAX_FISH_COUNT}");
    }

    public void UpdateFish(float deltaTime, long currentTick)
    {
        var fishToRemove = new List<string>();

        foreach (var fish in _activeFish.Values)
        {
            fish.UpdatePosition(deltaTime, currentTick);

            // Remove fish that have completed their paths (non-looping)
            if (fish.CachedPathData != null && !fish.CachedPathData.Loop)
            {
                float ticksSinceSpawn = currentTick - fish.SpawnTick;
                float pathDuration = fish.CachedPathData.Duration * 30f; // Convert seconds to ticks
                float t = pathDuration > 0 ? ticksSinceSpawn / pathDuration : 0f;
                
                if (t >= 1.0f)
                {
                    fishToRemove.Add(fish.FishId);
                    continue; // Skip boundary check
                }
            }
            
            // Remove fish that have exceeded their despawn time (fallback for fish without CachedPathData)
            if (fish.DespawnTick > 0 && currentTick >= fish.DespawnTick)
            {
                fishToRemove.Add(fish.FishId);
                continue;
            }

            // Remove fish that go WAY out of bounds (give margin for off-screen spawning)
            const float BOUNDARY_MARGIN = 100f; // Allow fish to be slightly off-screen
            if (fish.X < -BOUNDARY_MARGIN || fish.X > ARENA_WIDTH + BOUNDARY_MARGIN ||
                fish.Y < -BOUNDARY_MARGIN || fish.Y > ARENA_HEIGHT + BOUNDARY_MARGIN)
            {
                fishToRemove.Add(fish.FishId);
            }
        }

        foreach (var fishId in fishToRemove)
        {
            _activeFish.Remove(fishId);
        }
    }

    public void SpawnFishIfNeeded(long currentTick, List<int>? eligibleBosses = null)
    {
        if (_activeFish.Count >= MAX_FISH_COUNT)
            return;
            
        // Regular spawning for normal fish (types 0-2, 6, 9, 12, 14)
        if (_activeFish.Count < MIN_FISH_COUNT)
        {
            while (_activeFish.Count < MIN_FISH_COUNT && _activeFish.Count < MAX_FISH_COUNT)
            {
                SpawnRandomFish(currentTick);
            }
            _lastSpawnTick = currentTick;
        }
        else
        {
            if (currentTick - _lastSpawnTick >= MIN_TICKS_BETWEEN_SPAWNS)
            {
                if (Random.Shared.Next(10) < 7)
                {
                    SpawnRandomFish(currentTick);
                    _lastSpawnTick = currentTick;
                }
            }
        }
        
        // Wave Rider bonus fish - spawns every 150 ticks (~5 seconds at 30 TPS)
        if (currentTick - _lastWaveRiderSpawnTick >= WAVE_RIDER_SPAWN_INTERVAL)
        {
            SpawnWaveRider(currentTick);
            _lastWaveRiderSpawnTick = currentTick;
        }
    }

    private void SpawnWaveRider(long currentTick)
    {
        var fishDef = Entities.FishCatalog.GetFish(21);
        if (fishDef == null) return;

        // Determine spawn edge based on current direction
        int spawnEdge = _waveRiderSpawnFromLeft ? 0 : 1; // 0 = left edge, 1 = right edge
        
        // Wave Rider gets its own unique group ID
        long groupId = Interlocked.Increment(ref _groupIdCounter);
        
        // Create Wave Rider fish using the standard CreateFish method
        // Wave Rider (typeId=21) is a bonus fish, so PathGenerator will handle it specially
        var fish = Fish.CreateFish(21, currentTick, spawnEdge, 0, groupId);
        
        _activeFish[fish.FishId] = fish;
        
        _waveRiderSpawnFromLeft = !_waveRiderSpawnFromLeft;
        
        Console.WriteLine($"[WAVE RIDER] Spawned from {(!_waveRiderSpawnFromLeft ? "left" : "right")} edge with sine wave pattern");
    }

    private void SpawnSingleFish(int typeId, long currentTick)
    {
        var fishDef = Entities.FishCatalog.GetFish(typeId);
        if (fishDef == null) return;

        // Select random spawn edge/direction (0-7)
        int spawnEdge = Random.Shared.Next(8);
        
        // Single fish gets its own unique group ID (no formation)
        long groupId = Interlocked.Increment(ref _groupIdCounter);
        
        // Create fish with spawn edge information for path generation
        var fish = Fish.CreateFish(typeId, currentTick, spawnEdge, 0, groupId);
        _activeFish[fish.FishId] = fish;
    }

    private void SpawnRandomFish(long currentTick)
    {
        var spawnableFish = new List<(int typeId, int weight)>();
        int totalWeight = 0;
        
        int[] validFishTypes = { 0, 1, 2, 6, 9, 12, 14 };
        
        foreach (int typeId in validFishTypes)
        {
            var fishDef = Entities.FishCatalog.GetFish(typeId);
            if (fishDef != null && fishDef.SpawnWeight > 0)
            {
                spawnableFish.Add((typeId, fishDef.SpawnWeight));
                totalWeight += fishDef.SpawnWeight;
            }
        }
        
        int randomValue = Random.Shared.Next(totalWeight);
        int cumulativeWeight = 0;
        int selectedTypeId = 0;
        
        foreach (var (typeId, weight) in spawnableFish)
        {
            cumulativeWeight += weight;
            if (randomValue < cumulativeWeight)
            {
                selectedTypeId = typeId;
                break;
            }
        }
        
        if (selectedTypeId == 0)
        {
            // Clownfish: spawn in rows of 3-5
            SpawnFishGroup(selectedTypeId, currentTick, 3, 5, FormationType.Row);
        }
        else if (selectedTypeId == 2)
        {
            // Butterflyfish: spawn in diamond formations of 4-8
            SpawnFishGroup(selectedTypeId, currentTick, 4, 8, FormationType.Diamond);
        }
        else if (selectedTypeId == 1)
        {
            // Neon Tetra: smaller groups of 2-4
            SpawnFishGroup(selectedTypeId, currentTick, 2, 4, FormationType.Row);
        }
        else
        {
            SpawnSingleFish(selectedTypeId, currentTick);
        }
    }

    private enum FormationType
    {
        Row,      // Linear row formation
        Diamond   // Diamond/geometric formation
    }

    private void SpawnFishGroup(int typeId, long currentTick, int minCount = -1, int maxCount = -1, FormationType formation = FormationType.Row)
    {
        int groupSize;
        if (minCount > 0 && maxCount > 0)
        {
            groupSize = Random.Shared.Next(minCount, maxCount + 1);
        }
        else
        {
            groupSize = 1;
        }
        
        // Generate unique group ID for this formation
        long groupId = Interlocked.Increment(ref _groupIdCounter);
        
        // Select a spawn edge for the entire group (0-7)
        int spawnEdge = Random.Shared.Next(8);
        
        // Spawn fish in formation
        for (int i = 0; i < groupSize; i++)
        {
            if (_activeFish.Count >= MAX_FISH_COUNT)
                break;
            
            // Calculate formation offset based on type
            int formationIndex = formation == FormationType.Diamond 
                ? GetDiamondFormationIndex(i, groupSize)
                : i;  // Row formation uses sequential indices
            
            // Create fish with spawn edge, formation index, and group ID for path generation
            var fish = Fish.CreateFish(typeId, currentTick, spawnEdge, formationIndex, groupId);
            
            _activeFish[fish.FishId] = fish;
        }
    }
    
    /// <summary>
    /// Calculate formation index for diamond patterns
    /// Maps linear index to diamond position offsets
    /// ALL indices must be unique to avoid overlapping fish
    /// </summary>
    private int GetDiamondFormationIndex(int linearIndex, int groupSize)
    {
        // Diamond patterns with UNIQUE offsets:
        // 4 fish:    top(0), left(-2), right(2), bottom(-1 or 1)
        // 6 fish:    center(0), upper-left(-3), upper-right(3), lower-left(-1), lower-right(1), far-left(-5)
        // 8 fish:    full diamond with staggered positions
        //
        // Visual example (8 fish):
        //       0
        //   -3     3
        // -5  -1  1  5
        //   -2     2
        
        // Map to unique offsets that create diamond spacing
        return linearIndex switch
        {
            0 => 0,      // Top center
            1 => -3,     // Upper left
            2 => 3,      // Upper right
            3 => -1,     // Mid-lower left
            4 => 1,      // Mid-lower right
            5 => -5,     // Far left
            6 => 5,      // Far right
            7 => -2,     // Lower left
            _ => linearIndex * 2  // Fallback with spacing
        };
    }
    
    private float GetSpeedForType(int typeId)
    {
        return typeId switch
        {
            0 => 100f + Random.Shared.NextSingle() * 20f,
            1 => 100f + Random.Shared.NextSingle() * 20f,
            2 => 100f + Random.Shared.NextSingle() * 20f,
            6 => 60f + Random.Shared.NextSingle() * 10f,
            9 => 60f + Random.Shared.NextSingle() * 10f,
            12 => 100f + Random.Shared.NextSingle() * 20f,
            14 => 81.25f + Random.Shared.NextSingle() * 15f,
            _ => 80f
        };
    }

    public Fish? GetFish(string fishId)
    {
        _activeFish.TryGetValue(fishId, out var fish);
        return fish;
    }

    public List<Fish> GetActiveFish()
    {
        return _activeFish.Values.ToList();
    }

    public void RemoveFish(string fishId)
    {
        _activeFish.Remove(fishId);
    }
}
