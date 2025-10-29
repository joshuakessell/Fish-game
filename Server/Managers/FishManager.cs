using OceanKing.Server.Entities;

namespace OceanKing.Server.Managers;

public class FishManager
{
    private readonly Dictionary<string, Fish> _activeFish = new();
    private const int MIN_FISH_COUNT = 30;
    private const int MAX_FISH_COUNT = 50;
    private const int ARENA_WIDTH = 1600;
    private const int ARENA_HEIGHT = 900;
    
    // Spawn rate control
    private long _lastSpawnTick = 0;
    private const int MIN_TICKS_BETWEEN_SPAWNS = 5; // Spawn every ~0.16 seconds
    
    // Limit rare fish
    private const int MAX_LARGE_FISH = 3;
    private const int MAX_BOSS_FISH = 1;

    public void UpdateFish(float deltaTime, long currentTick)
    {
        var fishToRemove = new List<string>();

        foreach (var fish in _activeFish.Values)
        {
            fish.UpdatePosition(deltaTime, currentTick);

            // Remove fish that went off screen or expired
            if (fish.X < -100 || fish.X > ARENA_WIDTH + 100 ||
                fish.Y < -100 || fish.Y > ARENA_HEIGHT + 100 ||
                fish.DespawnTick <= currentTick)
            {
                fishToRemove.Add(fish.FishId);
            }
        }

        foreach (var fishId in fishToRemove)
        {
            _activeFish.Remove(fishId);
        }
    }

    public void SpawnFishIfNeeded(long currentTick)
    {
        // Maintain 30-50 fish on screen
        if (_activeFish.Count >= MAX_FISH_COUNT)
            return;
            
        // Aggressively spawn when below minimum to maintain constant action
        if (_activeFish.Count < MIN_FISH_COUNT)
        {
            // Keep spawning until we hit minimum (no throttle)
            while (_activeFish.Count < MIN_FISH_COUNT)
            {
                SpawnRandomFish(currentTick);
            }
            _lastSpawnTick = currentTick;
        }
        else
        {
            // Normal spawn rate - throttled to prevent overwhelming
            if (currentTick - _lastSpawnTick >= MIN_TICKS_BETWEEN_SPAWNS)
            {
                if (Random.Shared.Next(10) < 4) // 40% chance
                {
                    SpawnRandomFish(currentTick);
                    _lastSpawnTick = currentTick;
                }
            }
        }
    }

    private void SpawnRandomFish(long currentTick)
    {
        // Count current rare fish
        int largeFishCount = _activeFish.Values.Count(f => f.TypeId == 2);
        int bossFishCount = _activeFish.Values.Count(f => f.TypeId == 3);
        
        // Weighted spawn with limits on rare fish
        var rand = Random.Shared.Next(100);
        int typeId;
        
        if (rand < 65) // 65% small fish
        {
            typeId = 0;
            // Spawn small fish in groups
            SpawnFishGroup(typeId, currentTick);
            return;
        }
        else if (rand < 90) // 25% medium fish
        {
            typeId = 1;
            // Medium fish spawn in pairs sometimes
            if (Random.Shared.Next(10) < 4) // 40% chance of pair
            {
                SpawnFishGroup(typeId, currentTick, 2, 2);
                return;
            }
        }
        else if (rand < 97) // 7% large fish
        {
            if (largeFishCount >= MAX_LARGE_FISH)
            {
                typeId = 1; // Spawn medium instead
            }
            else
            {
                typeId = 2;
            }
        }
        else // 3% boss fish
        {
            if (bossFishCount >= MAX_BOSS_FISH)
            {
                typeId = 2; // Spawn large instead
            }
            else
            {
                typeId = 3;
            }
        }
        
        // Spawn single fish
        SpawnFishGroup(typeId, currentTick, 1, 1);
    }

    private void SpawnFishGroup(int typeId, long currentTick, int minCount = -1, int maxCount = -1)
    {
        // Determine group size based on fish type
        int groupSize;
        if (minCount > 0 && maxCount > 0)
        {
            groupSize = Random.Shared.Next(minCount, maxCount + 1);
        }
        else if (typeId == 0) // Small fish in groups of 4-7
        {
            groupSize = Random.Shared.Next(4, 8);
        }
        else if (typeId == 1) // Medium fish usually solo, sometimes pairs
        {
            groupSize = 1;
        }
        else // Large and boss always solo
        {
            groupSize = 1;
        }
        
        // Choose spawn side (left or right for horizontal swimming)
        bool fromLeft = Random.Shared.Next(2) == 0;
        float baseX = fromLeft ? -50 : ARENA_WIDTH + 50;
        
        // Direction: if spawning from left, move right; if from right, move left
        bool movingRight = fromLeft;
        
        // Choose a lane (Y position) with some variation
        float baseLaneY = Random.Shared.Next(100, ARENA_HEIGHT - 100);
        
        // Formation offset for groups
        float spacing = typeId == 0 ? 40f : 60f;
        
        for (int i = 0; i < groupSize; i++)
        {
            // Don't exceed maximum fish count
            if (_activeFish.Count >= MAX_FISH_COUNT)
                break;
                
            // Vary position slightly for natural formation
            float offsetX = (i % 2) * spacing - spacing / 2;
            float offsetY = (i / 2) * spacing;
            
            float spawnX = baseX;
            float spawnY = baseLaneY + offsetY + Random.Shared.NextSingle() * 20 - 10;
            
            // Keep within bounds
            spawnY = Math.Clamp(spawnY, 50, ARENA_HEIGHT - 50);
            
            var fish = Fish.CreateFish(typeId, spawnX, spawnY, currentTick, movingRight);
            _activeFish[fish.FishId] = fish;
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
