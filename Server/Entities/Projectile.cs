namespace OceanKing.Server.Entities;

public class Projectile
{
    public string ProjectileId { get; set; } = Guid.NewGuid().ToString();
    public int NumericId { get; set; }
    public string OwnerPlayerId { get; set; } = string.Empty;
    public int WeaponTypeId { get; set; }
    
    public float X { get; set; }
    public float Y { get; set; }
    public float DirectionX { get; set; }
    public float DirectionY { get; set; }
    public float Speed { get; set; } = 420f; // pixels per second (300f * 1.4)
    public float Damage { get; set; }
    public decimal BetValue { get; set; } // Shot value (10-200 credits)
    public string ClientNonce { get; set; } = string.Empty;
    
    public int TtlTicks { get; set; } = 900; // 30 seconds at 30 TPS (bullets bounce until hitting fish)
    public bool IsSpent { get; set; } = false;
    
    public int? TargetFishId { get; set; } = null;
    public bool IsHoming => TargetFishId.HasValue;
    
    private const float ARENA_WIDTH = 1800f;
    private const float ARENA_HEIGHT = 900f;
    private const float NORMAL_SPEED = 420f;
    private const float HOMING_SPEED = 320f;
    private const float HOMING_TURN_RATE = 3.0f; // radians per second

    public void UpdatePosition(float deltaTime, List<Fish>? activeFish = null)
    {
        // Apply homing logic if this is a homing projectile
        if (IsHoming && activeFish != null && TargetFishId.HasValue)
        {
            var targetFish = activeFish.FirstOrDefault(f => f.FishIdHash == TargetFishId.Value);
            
            if (targetFish != null)
            {
                // Calculate direction to target
                float dx = targetFish.X - X;
                float dy = targetFish.Y - Y;
                float distance = MathF.Sqrt(dx * dx + dy * dy);
                
                if (distance > 0)
                {
                    // Normalize target direction
                    float targetDirX = dx / distance;
                    float targetDirY = dy / distance;
                    
                    // Calculate current and target angles
                    float currentAngle = MathF.Atan2(DirectionY, DirectionX);
                    float targetAngle = MathF.Atan2(targetDirY, targetDirX);
                    
                    // Calculate shortest angle difference
                    float angleDiff = targetAngle - currentAngle;
                    while (angleDiff > MathF.PI) angleDiff -= 2f * MathF.PI;
                    while (angleDiff < -MathF.PI) angleDiff += 2f * MathF.PI;
                    
                    // Apply turn rate limit
                    float maxTurn = HOMING_TURN_RATE * deltaTime;
                    float actualTurn = Math.Clamp(angleDiff, -maxTurn, maxTurn);
                    
                    // Update direction
                    float newAngle = currentAngle + actualTurn;
                    DirectionX = MathF.Cos(newAngle);
                    DirectionY = MathF.Sin(newAngle);
                    
                    // Use homing speed
                    Speed = HOMING_SPEED;
                }
            }
        }
        else
        {
            // Normal projectiles use normal speed
            Speed = NORMAL_SPEED;
        }
        
        // Move projectile
        X += DirectionX * Speed * deltaTime;
        Y += DirectionY * Speed * deltaTime;
        TtlTicks--;
        
        // Bounce off screen edges
        if (X < 0)
        {
            X = 0;
            DirectionX = Math.Abs(DirectionX); // Bounce right
        }
        else if (X > ARENA_WIDTH)
        {
            X = ARENA_WIDTH;
            DirectionX = -Math.Abs(DirectionX); // Bounce left
        }
        
        if (Y < 0)
        {
            Y = 0;
            DirectionY = Math.Abs(DirectionY); // Bounce down
        }
        else if (Y > ARENA_HEIGHT)
        {
            Y = ARENA_HEIGHT;
            DirectionY = -Math.Abs(DirectionY); // Bounce up
        }
    }

    public bool ShouldRemove() => TtlTicks <= 0 || IsSpent;
}
