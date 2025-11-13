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

        // Generate stable fish ID hash for path generation
        var fishIdGuid = Guid.NewGuid().ToString();
        var fishIdHash = Math.Abs(fishIdGuid.GetHashCode());
        
        // Determine start and end points based on spawn direction
        float[] start, end;
        float y = Random.Shared.Next(200, ARENA_HEIGHT - 200);
        
        if (_waveRiderSpawnFromLeft)
        {
            // Spawn from left edge, exit on right edge
            start = new[] { 0f, (float)y };
            end = new[] { (float)ARENA_WIDTH, (float)Random.Shared.Next(200, ARENA_HEIGHT - 200) };
        }
        else
        {
            // Spawn from right edge, exit on left edge
            start = new[] { (float)ARENA_WIDTH, (float)y };
            end = new[] { 0f, (float)Random.Shared.Next(200, ARENA_HEIGHT - 200) };
        }
        
        _waveRiderSpawnFromLeft = !_waveRiderSpawnFromLeft;
        
        // Generate sine wave path with specific start/end points
        var path = Systems.Paths.PathGenerator.GenerateSinePathWithPoints(
            fishIdHash,
            fishIdHash,
            (int)currentTick,
            fishDef.BaseSpeed,
            start,
            end
        );
        
        // Get initial position from path
        var startPos = path.GetPosition(0f);
        
        // Cache path data to avoid per-tick allocations
        var pathData = path.GetPathData();
        
        // Create the Wave Rider fish with sine wave path
        var fish = new Fish
        {
            FishId = fishIdGuid,
            FishIdHash = fishIdHash,
            TypeId = 21,
            X = startPos[0],
            Y = startPos[1],
            SpawnTick = currentTick,
            DespawnTick = currentTick + 1800, // 60 seconds
            HitboxRadius = fishDef.HitboxRadius,
            BaseValue = fishDef.PayoutMultiplier,
            DestructionOdds = fishDef.CaptureProbability,
            Path = path,
            CachedPathData = pathData
        };
        
        _activeFish[fish.FishId] = fish;
        
        Console.WriteLine($"[WAVE RIDER] Spawned from {(_waveRiderSpawnFromLeft ? "right" : "left")} side with sine wave pattern");
    }

    private void SpawnSingleFish(int typeId, long currentTick)
    {
        var fishDef = Entities.FishCatalog.GetFish(typeId);
        if (fishDef == null) return;

        int spawnDirection = Random.Shared.Next(8);
        float x, y, velocityX, velocityY;
        
        switch (spawnDirection)
        {
            case 0:
                x = 0;
                y = Random.Shared.Next(100, ARENA_HEIGHT - 100);
                velocityX = fishDef.BaseSpeed;
                velocityY = 0;
                break;
            case 1:
                x = ARENA_WIDTH;
                y = Random.Shared.Next(100, ARENA_HEIGHT - 100);
                velocityX = -fishDef.BaseSpeed;
                velocityY = 0;
                break;
            case 2:
                x = Random.Shared.Next(100, ARENA_WIDTH - 100);
                y = 0;
                velocityX = 0;
                velocityY = fishDef.BaseSpeed;
                break;
            case 3:
                x = Random.Shared.Next(100, ARENA_WIDTH - 100);
                y = ARENA_HEIGHT;
                velocityX = 0;
                velocityY = -fishDef.BaseSpeed;
                break;
            case 4:
                x = 0;
                y = 0;
                velocityX = fishDef.BaseSpeed * 0.707f;
                velocityY = fishDef.BaseSpeed * 0.707f;
                break;
            case 5:
                x = ARENA_WIDTH;
                y = 0;
                velocityX = -fishDef.BaseSpeed * 0.707f;
                velocityY = fishDef.BaseSpeed * 0.707f;
                break;
            case 6:
                x = 0;
                y = ARENA_HEIGHT;
                velocityX = fishDef.BaseSpeed * 0.707f;
                velocityY = -fishDef.BaseSpeed * 0.707f;
                break;
            default:
                x = ARENA_WIDTH;
                y = ARENA_HEIGHT;
                velocityX = -fishDef.BaseSpeed * 0.707f;
                velocityY = -fishDef.BaseSpeed * 0.707f;
                break;
        }

        var fish = Fish.CreateFish(typeId, x, y, currentTick, velocityX, velocityY);
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
        
        int spawnDirection = Random.Shared.Next(8);
        float baseX, baseY, velocityX, velocityY;
        
        switch (spawnDirection)
        {
            case 0:
                baseX = 0;
                baseY = Random.Shared.Next(100, ARENA_HEIGHT - 100);
                velocityX = GetSpeedForType(typeId);
                velocityY = (Random.Shared.NextSingle() - 0.5f) * 20f;
                break;
                
            case 1:
                baseX = ARENA_WIDTH;
                baseY = Random.Shared.Next(100, ARENA_HEIGHT - 100);
                velocityX = -GetSpeedForType(typeId);
                velocityY = (Random.Shared.NextSingle() - 0.5f) * 20f;
                break;
                
            case 2:
                baseX = Random.Shared.Next(100, ARENA_WIDTH - 100);
                baseY = 0;
                velocityX = (Random.Shared.NextSingle() - 0.5f) * 30f;
                velocityY = GetSpeedForType(typeId) * 0.7f;
                break;
                
            case 3:
                baseX = Random.Shared.Next(100, ARENA_WIDTH - 100);
                baseY = ARENA_HEIGHT;
                velocityX = (Random.Shared.NextSingle() - 0.5f) * 30f;
                velocityY = -GetSpeedForType(typeId) * 0.7f;
                break;
                
            case 4:
                baseX = 0;
                baseY = 0;
                velocityX = GetSpeedForType(typeId) * 0.8f;
                velocityY = GetSpeedForType(typeId) * 0.6f;
                break;
                
            case 5:
                baseX = ARENA_WIDTH;
                baseY = 0;
                velocityX = -GetSpeedForType(typeId) * 0.8f;
                velocityY = GetSpeedForType(typeId) * 0.6f;
                break;
                
            case 6:
                baseX = Random.Shared.Next(200, ARENA_WIDTH - 200);
                baseY = 0;
                velocityX = GetSpeedForType(typeId) * 0.4f;
                velocityY = GetSpeedForType(typeId) * 0.8f;
                break;
                
            case 7:
                baseX = 0;
                baseY = Random.Shared.Next(200, ARENA_HEIGHT - 200);
                velocityX = GetSpeedForType(typeId) * 0.9f;
                velocityY = -GetSpeedForType(typeId) * 0.3f;
                break;
                
            default:
                baseX = 0;
                baseY = ARENA_HEIGHT / 2;
                velocityX = GetSpeedForType(typeId);
                velocityY = 0;
                break;
        }
        
        float spacing = typeId == 0 ? 40f : 60f;
        
        for (int i = 0; i < groupSize; i++)
        {
            if (_activeFish.Count >= MAX_FISH_COUNT)
                break;
                
            float offsetX = (i % 3) * spacing - spacing;
            float offsetY = (i / 3) * spacing;
            
            offsetX += Random.Shared.NextSingle() * 20 - 10;
            offsetY += Random.Shared.NextSingle() * 20 - 10;
            
            float spawnX = baseX + offsetX;
            float spawnY = baseY + offsetY;
            
            var fish = Fish.CreateFish(typeId, spawnX, spawnY, currentTick, velocityX, velocityY);
            
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
