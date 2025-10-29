namespace OceanKing.Server.Entities;

public class Fish
{
    public string FishId { get; set; } = Guid.NewGuid().ToString();
    public int TypeId { get; set; } // 0=small, 1=medium, 2=large, 3=boss
    public decimal BaseValue { get; set; }
    public float DestructionOdds { get; set; } // Probability (0-1) that a bullet destroys this fish
    
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

    public static Fish CreateFish(int typeId, float x, float y, long currentTick, bool movingRight = true)
    {
        var fish = new Fish
        {
            TypeId = typeId,
            X = x,
            Y = y,
            SpawnTick = currentTick,
            MovementPatternId = Random.Shared.Next(0, 3)
        };

        // Direction multiplier (1 for right, -1 for left)
        float direction = movingRight ? 1f : -1f;
        
        // Configure based on type with proper crossing speeds and destruction odds
        // Screen is 1600px wide, velocities in pixels/second
        // Destruction odds: higher value = easier to destroy = lower payout
        switch (typeId)
        {
            case 0: // Small fish - crosses in ~15 seconds, 8% chance per bullet
                fish.BaseValue = 5m;
                fish.DestructionOdds = 0.08f; // 8% chance per hit
                fish.HitboxRadius = 20f;
                fish.VelocityX = direction * (100f + Random.Shared.NextSingle() * 20f); // 100-120 px/s
                fish.DespawnTick = currentTick + 600; // 20 seconds max lifetime
                break;
                
            case 1: // Medium fish - crosses in ~25 seconds, 3% chance per bullet
                fish.BaseValue = 15m;
                fish.DestructionOdds = 0.03f; // 3% chance per hit
                fish.HitboxRadius = 30f;
                fish.VelocityX = direction * (60f + Random.Shared.NextSingle() * 10f); // 60-70 px/s
                fish.DespawnTick = currentTick + 900; // 30 seconds max lifetime
                break;
                
            case 2: // Large fish - crosses in ~35 seconds, 1% chance per bullet
                fish.BaseValue = 50m;
                fish.DestructionOdds = 0.01f; // 1% chance per hit
                fish.HitboxRadius = 50f;
                fish.VelocityX = direction * (45f + Random.Shared.NextSingle() * 10f); // 45-55 px/s
                fish.DespawnTick = currentTick + 1200; // 40 seconds max lifetime
                break;
                
            case 3: // Boss fish - crosses in ~50 seconds, 0.3% chance per bullet
                fish.BaseValue = 500m;
                fish.DestructionOdds = 0.003f; // 0.3% chance per hit
                fish.HitboxRadius = 80f;
                fish.VelocityX = direction * (30f + Random.Shared.NextSingle() * 8f); // 30-38 px/s
                fish.DespawnTick = currentTick + 1800; // 60 seconds max lifetime
                fish.IsExplosive = true;
                break;
        }

        // Add some vertical variation for movement patterns
        fish.VelocityY = (Random.Shared.NextSingle() - 0.5f) * 15f; // Gentle vertical drift

        return fish;
    }

    public void UpdatePosition(float deltaTime, long currentTick)
    {
        X += VelocityX * deltaTime;
        Y += VelocityY * deltaTime;

        // Apply movement pattern based on time since spawn
        float timeSinceSpawn = (currentTick - SpawnTick) / 30f; // Convert ticks to seconds
        
        switch (MovementPatternId)
        {
            case 1: // Sine wave (gentle undulation)
                Y += MathF.Sin(timeSinceSpawn * 1.5f) * 2.5f;
                break;
                
            case 2: // Circular motion (more dramatic for larger fish)
                if (TypeId >= 2) // Only large and boss fish
                {
                    float angle = timeSinceSpawn * 0.8f;
                    float radius = 15f;
                    Y += MathF.Sin(angle) * radius * 0.15f;
                }
                else // Subtle wave for smaller fish
                {
                    Y += MathF.Sin(timeSinceSpawn * 2f) * 1.5f;
                }
                break;
                
            // case 0 is straight line (default)
        }
        
        // Gentle vertical bounds - keep fish mostly on screen
        if (Y < 50) VelocityY = MathF.Abs(VelocityY);
        if (Y > 850) VelocityY = -MathF.Abs(VelocityY);
    }
}
