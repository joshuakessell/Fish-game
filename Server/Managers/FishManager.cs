using OceanKing.Server.Entities;

namespace OceanKing.Server.Managers;

public class FishManager
{
    private readonly Dictionary<string, Fish> _activeFish = new();
    private const int TARGET_FISH_COUNT = 20;
    private const int ARENA_WIDTH = 1600;
    private const int ARENA_HEIGHT = 900;

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
        while (_activeFish.Count < TARGET_FISH_COUNT)
        {
            SpawnRandomFish(currentTick);
        }
    }

    private void SpawnRandomFish(long currentTick)
    {
        // Weighted spawn: more small fish, fewer bosses
        var rand = Random.Shared.Next(100);
        int typeId;
        if (rand < 50) typeId = 0; // 50% small
        else if (rand < 80) typeId = 1; // 30% medium
        else if (rand < 95) typeId = 2; // 15% large
        else typeId = 3; // 5% boss

        // Spawn from random edge
        float x, y;
        var side = Random.Shared.Next(4);
        switch (side)
        {
            case 0: // Left
                x = -50;
                y = Random.Shared.Next(ARENA_HEIGHT);
                break;
            case 1: // Right
                x = ARENA_WIDTH + 50;
                y = Random.Shared.Next(ARENA_HEIGHT);
                break;
            case 2: // Top
                x = Random.Shared.Next(ARENA_WIDTH);
                y = -50;
                break;
            default: // Bottom
                x = Random.Shared.Next(ARENA_WIDTH);
                y = ARENA_HEIGHT + 50;
                break;
        }

        var fish = Fish.CreateFish(typeId, x, y, currentTick);
        
        // Adjust velocity to swim toward center
        var centerX = ARENA_WIDTH / 2f;
        var centerY = ARENA_HEIGHT / 2f;
        var dx = centerX - x;
        var dy = centerY - y;
        var length = MathF.Sqrt(dx * dx + dy * dy);
        
        if (length > 0)
        {
            fish.VelocityX = (dx / length) * fish.VelocityX;
            fish.VelocityY = (dy / length) * MathF.Abs(fish.VelocityX) * 0.3f;
        }

        _activeFish[fish.FishId] = fish;
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
