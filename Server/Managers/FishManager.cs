using OceanKing.Server.Entities;

namespace OceanKing.Server.Managers;

public class FishManager
{
    private readonly Dictionary<string, Fish> _activeFish = new();
    private const int MIN_FISH_COUNT = 30;
    private const int MAX_FISH_COUNT = 50;
    private const int ARENA_WIDTH = 1600;
    private const int ARENA_HEIGHT = 800; // Billiards table proportions (2:1)
    
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

            // Remove fish that went off screen or expired (with larger buffer for natural exit)
            if (fish.X < -200 || fish.X > ARENA_WIDTH + 200 ||
                fish.Y < -200 || fish.Y > ARENA_HEIGHT + 200 ||
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
        int specialFishCount = _activeFish.Values.Count(f => f.TypeId >= 4 && f.TypeId <= 8);
        
        // Weighted spawn with limits on rare fish
        var rand = Random.Shared.Next(100);
        int typeId;
        
        if (rand < 55) // 55% small fish
        {
            typeId = 0;
            // Spawn small fish in groups with patterns
            SpawnFishGroup(typeId, currentTick);
            return;
        }
        else if (rand < 75) // 20% medium fish
        {
            typeId = 1;
            // Medium fish spawn in pairs sometimes
            if (Random.Shared.Next(10) < 4) // 40% chance of pair
            {
                SpawnFishGroup(typeId, currentTick, 2, 2);
                return;
            }
        }
        else if (rand < 85) // 10% special creatures (types 4-8)
        {
            if (specialFishCount >= 4) // Limit special fish on screen
            {
                typeId = 1; // Spawn medium instead
            }
            else
            {
                // Choose a random special creature type
                typeId = Random.Shared.Next(4, 9); // 4-8
            }
        }
        else if (rand < 95) // 10% large fish
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
        else // 5% boss fish
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
        else if (typeId == 0) // Small fish in groups of 3-5
        {
            groupSize = Random.Shared.Next(3, 6);
        }
        else if (typeId == 1) // Medium fish usually solo, sometimes pairs
        {
            groupSize = 1;
        }
        else // Large and boss always solo
        {
            groupSize = 1;
        }
        
        // Choose spawn direction (8 possibilities for varied movement)
        int spawnDirection = Random.Shared.Next(8);
        float baseX, baseY, velocityX, velocityY;
        
        switch (spawnDirection)
        {
            case 0: // Left to right (horizontal)
                baseX = -50;
                baseY = Random.Shared.Next(100, ARENA_HEIGHT - 100);
                velocityX = GetSpeedForType(typeId);
                velocityY = (Random.Shared.NextSingle() - 0.5f) * 20f;
                break;
                
            case 1: // Right to left (horizontal)
                baseX = ARENA_WIDTH + 50;
                baseY = Random.Shared.Next(100, ARENA_HEIGHT - 100);
                velocityX = -GetSpeedForType(typeId);
                velocityY = (Random.Shared.NextSingle() - 0.5f) * 20f;
                break;
                
            case 2: // Top to bottom (vertical)
                baseX = Random.Shared.Next(100, ARENA_WIDTH - 100);
                baseY = -50;
                velocityX = (Random.Shared.NextSingle() - 0.5f) * 30f;
                velocityY = GetSpeedForType(typeId) * 0.7f;
                break;
                
            case 3: // Bottom to top (vertical)
                baseX = Random.Shared.Next(100, ARENA_WIDTH - 100);
                baseY = ARENA_HEIGHT + 50;
                velocityX = (Random.Shared.NextSingle() - 0.5f) * 30f;
                velocityY = -GetSpeedForType(typeId) * 0.7f;
                break;
                
            case 4: // Top-left to bottom-right (diagonal)
                baseX = -50;
                baseY = -50;
                velocityX = GetSpeedForType(typeId) * 0.8f;
                velocityY = GetSpeedForType(typeId) * 0.6f;
                break;
                
            case 5: // Top-right to bottom-left (diagonal)
                baseX = ARENA_WIDTH + 50;
                baseY = -50;
                velocityX = -GetSpeedForType(typeId) * 0.8f;
                velocityY = GetSpeedForType(typeId) * 0.6f;
                break;
                
            case 6: // Complex path: top to center then to bottom-right corner
                baseX = Random.Shared.Next(200, ARENA_WIDTH - 200);
                baseY = -50;
                velocityX = GetSpeedForType(typeId) * 0.4f;
                velocityY = GetSpeedForType(typeId) * 0.8f;
                break;
                
            case 7: // Complex path: left to center then to top-right corner
                baseX = -50;
                baseY = Random.Shared.Next(200, ARENA_HEIGHT - 200);
                velocityX = GetSpeedForType(typeId) * 0.9f;
                velocityY = -GetSpeedForType(typeId) * 0.3f;
                break;
                
            default:
                baseX = -50;
                baseY = ARENA_HEIGHT / 2;
                velocityX = GetSpeedForType(typeId);
                velocityY = 0;
                break;
        }
        
        // Choose group pattern for small fish groups
        int groupPattern = 0; // 0=none
        if (groupSize >= 3 && typeId == 0)
        {
            groupPattern = Random.Shared.Next(1, 4); // 1=blooming, 2=symmetrical, 3=circle
        }
        
        // Choose movement pattern variation
        int movementPattern = Random.Shared.Next(0, 4);
        
        // Formation offset for groups
        float spacing = typeId == 0 ? 40f : 60f;
        string groupId = Guid.NewGuid().ToString();
        
        for (int i = 0; i < groupSize; i++)
        {
            // Don't exceed maximum fish count
            if (_activeFish.Count >= MAX_FISH_COUNT)
                break;
                
            // Vary position slightly for natural formation
            float offsetX = (i % 3) * spacing - spacing;
            float offsetY = (i / 3) * spacing;
            
            // Add some randomness
            offsetX += Random.Shared.NextSingle() * 20 - 10;
            offsetY += Random.Shared.NextSingle() * 20 - 10;
            
            float spawnX = baseX + offsetX;
            float spawnY = baseY + offsetY;
            
            var fish = Fish.CreateFish(typeId, spawnX, spawnY, currentTick, velocityX, velocityY, movementPattern);
            
            // Set group information for synchronized patterns
            if (groupSize > 1)
            {
                fish.GroupId = groupId;
                fish.GroupIndex = i;
                fish.GroupSize = groupSize;
                fish.GroupPattern = groupPattern;
            }
            
            _activeFish[fish.FishId] = fish;
        }
    }
    
    private float GetSpeedForType(int typeId)
    {
        return typeId switch
        {
            0 => 100f + Random.Shared.NextSingle() * 20f,  // Small: fast
            1 => 60f + Random.Shared.NextSingle() * 10f,   // Medium: moderate
            2 => 45f + Random.Shared.NextSingle() * 10f,   // Large: slow
            3 => 30f + Random.Shared.NextSingle() * 8f,    // Boss: very slow
            4 => 35f + Random.Shared.NextSingle() * 5f,    // Sea Turtle: slow graceful
            5 => 50f + Random.Shared.NextSingle() * 8f,    // Manta Ray: moderate glide
            6 => 25f + Random.Shared.NextSingle() * 5f,    // Jellyfish: very slow drift
            7 => 55f + Random.Shared.NextSingle() * 10f,   // Hammerhead: moderate hunting
            8 => 40f + Random.Shared.NextSingle() * 8f,    // Nautilus: slow spiral
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
