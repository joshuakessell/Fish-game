namespace OceanKing.Server.Entities;

public class Fish
{
    public string FishId { get; set; } = Guid.NewGuid().ToString();
    public int TypeId { get; set; } // 0=small, 1=medium, 2=large, 3=boss
    public float Hp { get; set; }
    public float MaxHp { get; set; }
    public decimal BaseValue { get; set; }
    
    // Position and movement
    public float X { get; set; }
    public float Y { get; set; }
    public float VelocityX { get; set; }
    public float VelocityY { get; set; }
    public float HitboxRadius { get; set; }
    
    // Timing
    public long SpawnTick { get; set; }
    public long DespawnTick { get; set; }
    public int MovementPatternId { get; set; }
    
    // Special properties
    public bool IsExplosive { get; set; }
    public bool IsChainLightningEligible { get; set; } = true;

    public static Fish CreateFish(int typeId, float x, float y, long currentTick)
    {
        var fish = new Fish
        {
            TypeId = typeId,
            X = x,
            Y = y,
            SpawnTick = currentTick,
            DespawnTick = currentTick + 600, // 20 seconds at 30 TPS
            MovementPatternId = Random.Shared.Next(0, 3)
        };

        // Configure based on type
        switch (typeId)
        {
            case 0: // Small fish
                fish.MaxHp = fish.Hp = 10f;
                fish.BaseValue = 5m;
                fish.HitboxRadius = 20f;
                fish.VelocityX = Random.Shared.NextSingle() * 2f + 1f;
                break;
            case 1: // Medium fish
                fish.MaxHp = fish.Hp = 30f;
                fish.BaseValue = 15m;
                fish.HitboxRadius = 30f;
                fish.VelocityX = Random.Shared.NextSingle() * 1.5f + 0.5f;
                break;
            case 2: // Large fish
                fish.MaxHp = fish.Hp = 100f;
                fish.BaseValue = 50m;
                fish.HitboxRadius = 50f;
                fish.VelocityX = Random.Shared.NextSingle() * 1f + 0.3f;
                break;
            case 3: // Boss fish
                fish.MaxHp = fish.Hp = 500f;
                fish.BaseValue = 500m;
                fish.HitboxRadius = 80f;
                fish.VelocityX = Random.Shared.NextSingle() * 0.5f + 0.2f;
                fish.IsExplosive = true;
                break;
        }

        // Random Y velocity for some variety
        fish.VelocityY = (Random.Shared.NextSingle() - 0.5f) * 0.5f;

        return fish;
    }

    public void UpdatePosition(float deltaTime, long currentTick)
    {
        X += VelocityX * deltaTime;
        Y += VelocityY * deltaTime;

        // Apply movement pattern based on ticks since spawn
        // At 30 TPS, each tick is ~0.033 seconds
        float timeSinceSpawn = (currentTick - SpawnTick) / 30f; // Convert ticks to seconds
        
        switch (MovementPatternId)
        {
            case 1: // Sine wave
                Y += MathF.Sin(timeSinceSpawn * 2f) * 0.5f;
                break;
            case 2: // Spiral
                float angle = timeSinceSpawn;
                X += MathF.Cos(angle) * 0.3f;
                Y += MathF.Sin(angle) * 0.3f;
                break;
            // case 0 is straight line (default)
        }
    }

    public bool IsDead() => Hp <= 0;
}
