using OceanKing.Server.Entities;

namespace OceanKing.Server.Managers;

public class FishManager
{
    private readonly Dictionary<string, Fish> _activeFish = new();
    private const int MIN_FISH_COUNT = 18;
    private const int MAX_FISH_COUNT = 24;
    private const int ARENA_WIDTH = 1800;
    private const int ARENA_HEIGHT = 900;
    
    // Spawn rate control
    private long _lastSpawnTick = 0;
    private const int MIN_TICKS_BETWEEN_SPAWNS = 2;
    
    // Wave Rider bonus fish spawn control
    private long _lastWaveRiderSpawnTick = 0;
    private const int WAVE_RIDER_SPAWN_INTERVAL = 150;
    private bool _waveRiderSpawnFromLeft = true;

    public void UpdateFish(float deltaTime, long currentTick)
    {
        var fishToRemove = new List<string>();

        foreach (var fish in _activeFish.Values)
        {
            fish.UpdatePosition(deltaTime, currentTick);

            if (fish.X < 0 || fish.X > ARENA_WIDTH ||
                fish.Y < 0 || fish.Y > ARENA_HEIGHT)
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
        
        // Create Wave Rider fish using the standard CreateFish method
        // Wave Rider (typeId=21) is a bonus fish, so PathGenerator will handle it specially
        var fish = Fish.CreateFish(21, currentTick, spawnEdge);
        
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
        
        // Create fish with spawn edge information for path generation
        var fish = Fish.CreateFish(typeId, currentTick, spawnEdge);
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
        
        if (selectedTypeId <= 2)
        {
            SpawnFishGroup(selectedTypeId, currentTick, 3, 6);
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
            groupSize = Random.Shared.Next(minCount, maxCount + 1);
        }
        else if (typeId == 0)
        {
            groupSize = Random.Shared.Next(3, 6);
        }
        else if (typeId == 1)
        {
            groupSize = 1;
        }
        else
        {
            groupSize = 1;
        }
        
        // Select a spawn edge for the entire group (0-7)
        int spawnEdge = Random.Shared.Next(8);
        
        // Spawn fish in the group with the same edge but different group indices for variation
        for (int i = 0; i < groupSize; i++)
        {
            if (_activeFish.Count >= MAX_FISH_COUNT)
                break;
            
            // Create fish with spawn edge and group index for path variation
            var fish = Fish.CreateFish(typeId, currentTick, spawnEdge, i);
            
            _activeFish[fish.FishId] = fish;
        }
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
