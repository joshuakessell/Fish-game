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

    private long _lastUltraRareBossSpawnTick = 0;
    private const int MIN_TICKS_BETWEEN_ULTRA_RARE = 5400; // 3 minutes at 30 TPS

    public void SpawnFishIfNeeded(long currentTick, List<int>? eligibleBosses = null)
    {
        eligibleBosses ??= new List<int>();

        if (_activeFish.Count >= MAX_FISH_COUNT)
            return;
        
        if (currentTick - _lastUltraRareBossSpawnTick >= MIN_TICKS_BETWEEN_ULTRA_RARE && 
            eligibleBosses.Count > 0)
        {
            var ultraRareBosses = eligibleBosses.Where(id => id >= 9).ToList();
            if (ultraRareBosses.Count > 0 && Random.Shared.Next(100) < 3)
            {
                var bossTypeId = ultraRareBosses[Random.Shared.Next(ultraRareBosses.Count)];
                SpawnBoss(bossTypeId, currentTick);
                _lastUltraRareBossSpawnTick = currentTick;
                return;
            }
        }
            
        if (_activeFish.Count < MIN_FISH_COUNT)
        {
            while (_activeFish.Count < MIN_FISH_COUNT)
            {
                SpawnRandomFish(currentTick, eligibleBosses);
            }
            _lastSpawnTick = currentTick;
        }
        else
        {
            if (currentTick - _lastSpawnTick >= MIN_TICKS_BETWEEN_SPAWNS)
            {
                if (Random.Shared.Next(10) < 4)
                {
                    SpawnRandomFish(currentTick, eligibleBosses);
                    _lastSpawnTick = currentTick;
                }
            }
        }
    }

    private void SpawnBoss(int bossTypeId, long currentTick)
    {
        var bossDef = Entities.BossCatalog.GetBoss(bossTypeId);
        if (bossDef == null) return;

        var spawnDirection = Random.Shared.Next(4);
        float x, y, velocityX, velocityY;
        
        switch (spawnDirection)
        {
            case 0:
                x = -bossDef.HitboxRadius;
                y = ARENA_HEIGHT / 2;
                velocityX = bossDef.BaseSpeed;
                velocityY = 0;
                break;
            case 1:
                x = ARENA_WIDTH + bossDef.HitboxRadius;
                y = ARENA_HEIGHT / 2;
                velocityX = -bossDef.BaseSpeed;
                velocityY = 0;
                break;
            case 2:
                x = ARENA_WIDTH / 2;
                y = -bossDef.HitboxRadius;
                velocityX = 0;
                velocityY = bossDef.BaseSpeed;
                break;
            default:
                x = ARENA_WIDTH / 2;
                y = ARENA_HEIGHT + bossDef.HitboxRadius;
                velocityX = 0;
                velocityY = -bossDef.BaseSpeed;
                break;
        }

        var fish = Fish.CreateFish(bossTypeId, x, y, currentTick, velocityX, velocityY, bossDef.MovementPatternId);
        _activeFish[fish.FishId] = fish;
        
        Console.WriteLine($"Ultra-rare boss spawned: {bossDef.Name} (type {bossTypeId})");
    }

    private void SpawnRandomFish(long currentTick, List<int>? eligibleBosses = null)
    {
        eligibleBosses ??= new List<int>();
        
        int largeFishCount = _activeFish.Values.Count(f => f.TypeId == 2);
        int bossFishCount = _activeFish.Values.Count(f => f.TypeId >= 2 && f.TypeId <= 6);
        int specialFishCount = _activeFish.Values.Count(f => f.TypeId >= 4 && f.TypeId <= 8);
        int extendedFishCount = _activeFish.Values.Count(f => f.TypeId >= 20 && f.TypeId <= 27);
        
        // Weighted spawn with limits on rare fish (now includes types 0-8 and 20-27)
        var rand = Random.Shared.Next(1000);
        int typeId;
        
        if (rand < 500) // 50% small fish (type 0)
        {
            typeId = 0;
            // Spawn small fish in groups with patterns
            SpawnFishGroup(typeId, currentTick);
            return;
        }
        else if (rand < 700) // 20% medium fish (type 1)
        {
            typeId = 1;
            // Medium fish spawn in pairs sometimes
            if (Random.Shared.Next(10) < 4) // 40% chance of pair
            {
                SpawnFishGroup(typeId, currentTick, 2, 2);
                return;
            }
        }
        else if (rand < 800) // 10% special creatures (types 4-8)
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
        else if (rand < 880) // 8% extended fish types 20-23 (lower value extended fish)
        {
            if (extendedFishCount >= 3) // Limit extended fish on screen
            {
                typeId = 1; // Spawn medium instead
            }
            else
            {
                typeId = Random.Shared.Next(20, 24); // 20-23
            }
        }
        else if (rand < 930) // 5% extended fish types 24-25 (medium value extended fish)
        {
            if (extendedFishCount >= 3)
            {
                typeId = 2; // Spawn large instead
            }
            else
            {
                typeId = Random.Shared.Next(24, 26); // 24-25
            }
        }
        else if (rand < 960) // 3% extended fish types 26-27 (high value extended fish)
        {
            if (extendedFishCount >= 2)
            {
                typeId = 2; // Spawn large instead
            }
            else
            {
                typeId = Random.Shared.Next(26, 28); // 26-27
            }
        }
        else if (rand < 980) // 2% large fish (type 2)
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
        else // 2% boss fish (type 3)
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
            20 => 42f + Random.Shared.NextSingle() * 7f,   // Lantern Fish: moderate
            21 => 38f + Random.Shared.NextSingle() * 6f,   // Sea Turtle: slow graceful
            22 => 52f + Random.Shared.NextSingle() * 9f,   // Saw Shark: moderate-fast
            23 => 48f + Random.Shared.NextSingle() * 8f,   // Devilfish: moderate
            24 => 40f + Random.Shared.NextSingle() * 8f,   // Jumbo Fish: slow-moderate
            25 => 58f + Random.Shared.NextSingle() * 10f,  // Shark: fast
            26 => 50f + Random.Shared.NextSingle() * 8f,   // Killer Whale: moderate
            27 => 35f + Random.Shared.NextSingle() * 7f,   // Golden Dragon: slow
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
