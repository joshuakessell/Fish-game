using OceanKing.Server.Entities;

namespace OceanKing.Server.Managers;

public class FishManager
{
    private readonly Dictionary<string, Fish> _activeFish = new();
    private readonly Dictionary<int, int> _fishCountByType = new(); // Track count per fish type
    private readonly int MIN_FISH_COUNT;
    private readonly int MAX_FISH_COUNT;
    private readonly Random _random;
    private const int ARENA_WIDTH = 1800;
    private const int ARENA_HEIGHT = 900;
    private const int MAX_PER_TYPE_NON_SMALL_FISH = 3; // Max 3 of each non-small fish type
    
    // Unique group ID counter for fish formations
    private static long _groupIdCounter = 0;
    
    // Spawn rate control
    private long _lastSpawnTick = 0;
    private const int MIN_TICKS_BETWEEN_SPAWNS = 2;
    
    // Wave Rider bonus fish spawn control
    private long _lastWaveRiderSpawnTick = 0;
    private const int WAVE_RIDER_SPAWN_INTERVAL = 150;
    private bool _waveRiderSpawnFromLeft = true;
    
    public FishManager(Random? random = null)
    {
        _random = random ?? Random.Shared;
        MIN_FISH_COUNT = _random.Next(20, 31);
        MAX_FISH_COUNT = 30;
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
            if (_activeFish.TryGetValue(fishId, out var fish))
            {
                // Update type count when removing fish
                if (_fishCountByType.ContainsKey(fish.TypeId))
                {
                    _fishCountByType[fish.TypeId]--;
                    if (_fishCountByType[fish.TypeId] <= 0)
                    {
                        _fishCountByType.Remove(fish.TypeId);
                    }
                }
                _activeFish.Remove(fishId);
            }
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
                if (_random.Next(10) < 7)
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
        var fish = Fish.CreateFish(21, currentTick, spawnEdge, 0, 0, groupId);
        
        _activeFish[fish.FishId] = fish;
        
        // Update type count
        _fishCountByType[21] = _fishCountByType.GetValueOrDefault(21, 0) + 1;
        
        _waveRiderSpawnFromLeft = !_waveRiderSpawnFromLeft;
        
        Console.WriteLine($"[WAVE RIDER] Spawned from {(!_waveRiderSpawnFromLeft ? "left" : "right")} edge with sine wave pattern");
    }

    private void SpawnSingleFish(int typeId, long currentTick)
    {
        var fishDef = Entities.FishCatalog.GetFish(typeId);
        if (fishDef == null) return;

        // Check per-type limit for non-small fish (types > 2, excluding Wave Rider which spawns separately)
        if (typeId > 2 && typeId != 21)
        {
            int currentCount = _fishCountByType.GetValueOrDefault(typeId, 0);
            if (currentCount >= MAX_PER_TYPE_NON_SMALL_FISH)
            {
                return; // Skip spawning if limit reached
            }
        }

        // Select random spawn edge/direction (0-11: edges, corners, and center regions)
        int spawnEdge = _random.Next(12);
        
        // Single fish gets its own unique group ID (no formation)
        long groupId = Interlocked.Increment(ref _groupIdCounter);
        
        // Create fish with spawn edge information for path generation
        var fish = Fish.CreateFish(typeId, currentTick, spawnEdge, 0, 0, groupId);
        _activeFish[fish.FishId] = fish;
        
        // Update type count
        _fishCountByType[typeId] = _fishCountByType.GetValueOrDefault(typeId, 0) + 1;
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
        
        int randomValue = _random.Next(totalWeight);
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
        
        if (selectedTypeId == 0 || selectedTypeId == 1 || selectedTypeId == 2)
        {
            // All small fish (Clownfish, Neon Tetra, Butterflyfish): spawn in lines of 2-6 fish
            SpawnFishGroup(selectedTypeId, currentTick, 2, 6);
        }
        else
        {
            SpawnSingleFish(selectedTypeId, currentTick);
        }
    }

    private void SpawnFishGroup(int typeId, long currentTick, int minCount = -1, int maxCount = -1)
    {
        int groupSize;
        if (minCount > 0 && maxCount > 0)
        {
            groupSize = _random.Next(minCount, maxCount + 1);
        }
        else
        {
            groupSize = 1;
        }
        
        // Generate unique group ID for this formation
        long groupId = Interlocked.Increment(ref _groupIdCounter);
        
        // Select a spawn edge for the entire group (0-11: edges, corners, and center regions)
        int spawnEdge = _random.Next(12);
        
        // Spawn fish in follow-the-leader line formation with time-based staggering
        for (int i = 0; i < groupSize; i++)
        {
            if (_activeFish.Count >= MAX_FISH_COUNT)
                break;
            
            // All fish in a line have lateralIndex=0 (no side-to-side offset)
            // trailingRank determines the sequential position in the line
            int lateralIndex = 0;  // No lateral offset for line formations
            int trailingRank = i;  // Sequential rank ensures all fish trail behind leader
            
            // Stagger spawn times: each fish spawns 15 ticks (~0.5 seconds) after the previous one
            // This creates true follow-the-leader movement where fish appear one after another
            long spawnTick = currentTick + (i * 15);
            
            // Create fish with future spawn tick, lateral index, and trailing rank
            var fish = Fish.CreateFish(typeId, spawnTick, spawnEdge, lateralIndex, trailingRank, groupId);
            
            _activeFish[fish.FishId] = fish;
            
            // Update type count for small fish groups
            _fishCountByType[typeId] = _fishCountByType.GetValueOrDefault(typeId, 0) + 1;
        }
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
