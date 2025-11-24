using OceanKing.Server.Entities;

namespace OceanKing.Server.Managers;

public class FishManager
{
    private readonly Dictionary<int, Fish> _activeFish = new();
    private const int MIN_FISH_COUNT = 5;   // Reduced for testing
    private const int MAX_FISH_COUNT = 15;  // Limited to 15 fish max
    private const int ARENA_WIDTH = 1800;
    private const int ARENA_HEIGHT = 900; // Billiards table proportions (2:1)
    
    // Spawn rate control
    private long _lastSpawnTick = 0;
    private const int MIN_TICKS_BETWEEN_SPAWNS = 5; // Spawn every ~0.16 seconds
    
    // Boss and Special fish spawn control - spawn only every 8 seconds
    private long _lastBossSpawnTick = 0;
    private long _lastSpecialSpawnTick = 0;
    private const int MIN_TICKS_BETWEEN_BOSS_SPAWNS = 240; // 8 seconds at 30 TPS
    private const int MIN_TICKS_BETWEEN_SPECIAL_SPAWNS = 180; // 6 seconds at 30 TPS
    
    // Limit rare fish
    private const int MAX_LARGE_FISH = 3;
    private const int MAX_BOSS_FISH = 1;

    public void UpdateFish(float deltaTime, long currentTick)
    {
        var fishToRemove = new List<int>();

        foreach (var fish in _activeFish.Values)
        {
            fish.UpdatePosition(deltaTime, currentTick);

            // Remove fish when they're far outside the buffer zone (-100 to +100 pixels)
            // This allows off-screen spawning (-10/1810, -10/910), fish group formations, and smooth exits
            const int BUFFER = 100;
            if (fish.X < -BUFFER || fish.X > ARENA_WIDTH + BUFFER ||
                fish.Y < -BUFFER || fish.Y > ARENA_HEIGHT + BUFFER)
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
        // DEBUG MODE: Only spawn small fish (types 0-2), max 15 fish
        // Disabled special items and boss fish for testing
        
        // Regular spawning for normal fish (respect MAX_FISH_COUNT cap)
        if (_activeFish.Count < MIN_FISH_COUNT)
        {
            int spawned = 0;
            while (_activeFish.Count < MIN_FISH_COUNT && _activeFish.Count < MAX_FISH_COUNT)
            {
                SpawnRandomFish(currentTick);
                spawned++;
                if (spawned > 100) break; // Safety limit to prevent infinite loop
            }
            _lastSpawnTick = currentTick;
        }
        else if (_activeFish.Count < MAX_FISH_COUNT)
        {
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

    private void SpawnSingleFish(int typeId, long currentTick)
    {
        // Enforce MAX_FISH_COUNT cap centrally to prevent violations from any code path
        if (_activeFish.Count >= MAX_FISH_COUNT)
            return;
            
        var fishDef = Entities.FishCatalog.GetFish(typeId);
        if (fishDef == null) return;

        // Choose spawn direction (8 possibilities for varied movement)
        // Fish spawn OFF-SCREEN at X: -10/1810, Y: -10/910 for smooth edge-to-edge movement
        int spawnDirection = Random.Shared.Next(8);
        float x, y, velocityX, velocityY;
        
        switch (spawnDirection)
        {
            case 0: // Left to right (horizontal)
                x = -10;
                y = Random.Shared.Next(100, ARENA_HEIGHT - 100);
                velocityX = fishDef.BaseSpeed;
                velocityY = 0;
                break;
            case 1: // Right to left (horizontal)
                x = ARENA_WIDTH + 10;
                y = Random.Shared.Next(100, ARENA_HEIGHT - 100);
                velocityX = -fishDef.BaseSpeed;
                velocityY = 0;
                break;
            case 2: // Top to bottom (vertical)
                x = Random.Shared.Next(100, ARENA_WIDTH - 100);
                y = -10;
                velocityX = 0;
                velocityY = fishDef.BaseSpeed;
                break;
            case 3: // Bottom to top (vertical)
                x = Random.Shared.Next(100, ARENA_WIDTH - 100);
                y = ARENA_HEIGHT + 10;
                velocityX = 0;
                velocityY = -fishDef.BaseSpeed;
                break;
            case 4: // Top-left to bottom-right (diagonal)
                x = -10;
                y = -10;
                velocityX = fishDef.BaseSpeed * 0.707f;
                velocityY = fishDef.BaseSpeed * 0.707f;
                break;
            case 5: // Top-right to bottom-left (diagonal)
                x = ARENA_WIDTH + 10;
                y = -10;
                velocityX = -fishDef.BaseSpeed * 0.707f;
                velocityY = fishDef.BaseSpeed * 0.707f;
                break;
            case 6: // Bottom-left to top-right (diagonal)
                x = -10;
                y = ARENA_HEIGHT + 10;
                velocityX = fishDef.BaseSpeed * 0.707f;
                velocityY = -fishDef.BaseSpeed * 0.707f;
                break;
            default: // Bottom-right to top-left (diagonal)
                x = ARENA_WIDTH + 10;
                y = ARENA_HEIGHT + 10;
                velocityX = -fishDef.BaseSpeed * 0.707f;
                velocityY = -fishDef.BaseSpeed * 0.707f;
                break;
        }

        var fish = Fish.CreateFish(typeId, x, y, currentTick, velocityX, velocityY);
        _activeFish[fish.FishId] = fish;
        Console.WriteLine($"[FISH_SPAWNED] ID={fish.FishId}, Type={typeId}, Pos=({x:F0}, {y:F0}), Total={_activeFish.Count}");
    }

    private void SpawnRandomFish(long currentTick)
    {
        // DEBUG MODE: Only spawn 3 small fish types (0-2)
        // Type 0: Small fish #1, Type 1: Small fish #2, Type 2: Small fish #3
        
        // Randomly pick one of the 3 small fish types
        int selectedTypeId = Random.Shared.Next(0, 3);
        
        // Spawn in groups of 3-6
        SpawnFishGroup(selectedTypeId, currentTick, 3, 6);
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
        // Fish spawn OFF-SCREEN at X: -10/1810, Y: -10/910 for smooth edge-to-edge movement
        int spawnDirection = Random.Shared.Next(8);
        float baseX, baseY, velocityX, velocityY;
        
        switch (spawnDirection)
        {
            case 0: // Left to right (horizontal)
                baseX = -10;
                baseY = Random.Shared.Next(100, ARENA_HEIGHT - 100);
                velocityX = GetSpeedForType(typeId);
                velocityY = (Random.Shared.NextSingle() - 0.5f) * 20f;
                break;
                
            case 1: // Right to left (horizontal)
                baseX = ARENA_WIDTH + 10;
                baseY = Random.Shared.Next(100, ARENA_HEIGHT - 100);
                velocityX = -GetSpeedForType(typeId);
                velocityY = (Random.Shared.NextSingle() - 0.5f) * 20f;
                break;
                
            case 2: // Top to bottom (vertical)
                baseX = Random.Shared.Next(100, ARENA_WIDTH - 100);
                baseY = -10;
                velocityX = (Random.Shared.NextSingle() - 0.5f) * 30f;
                velocityY = GetSpeedForType(typeId) * 0.7f;
                break;
                
            case 3: // Bottom to top (vertical)
                baseX = Random.Shared.Next(100, ARENA_WIDTH - 100);
                baseY = ARENA_HEIGHT + 10;
                velocityX = (Random.Shared.NextSingle() - 0.5f) * 30f;
                velocityY = -GetSpeedForType(typeId) * 0.7f;
                break;
                
            case 4: // Top-left to bottom-right (diagonal)
                baseX = -10;
                baseY = -10;
                velocityX = GetSpeedForType(typeId) * 0.8f;
                velocityY = GetSpeedForType(typeId) * 0.6f;
                break;
                
            case 5: // Top-right to bottom-left (diagonal)
                baseX = ARENA_WIDTH + 10;
                baseY = -10;
                velocityX = -GetSpeedForType(typeId) * 0.8f;
                velocityY = GetSpeedForType(typeId) * 0.6f;
                break;
                
            case 6: // Complex path: top to center then to bottom-right corner
                baseX = Random.Shared.Next(200, ARENA_WIDTH - 200);
                baseY = -10;
                velocityX = GetSpeedForType(typeId) * 0.4f;
                velocityY = GetSpeedForType(typeId) * 0.8f;
                break;
                
            case 7: // Complex path: left to center then to top-right corner
                baseX = -10;
                baseY = Random.Shared.Next(200, ARENA_HEIGHT - 200);
                velocityX = GetSpeedForType(typeId) * 0.9f;
                velocityY = -GetSpeedForType(typeId) * 0.3f;
                break;
                
            default:
                baseX = -10;
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

    public Fish? GetFish(int fishId)
    {
        _activeFish.TryGetValue(fishId, out var fish);
        return fish;
    }

    public List<Fish> GetActiveFish()
    {
        return _activeFish.Values.ToList();
    }

    public void RemoveFish(int fishId)
    {
        _activeFish.Remove(fishId);
    }
}
