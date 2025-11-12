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
    
    public int TtlTicks { get; set; } = 900; // 30 seconds at 30 TPS (bullets bounce until hitting fish)
    public bool IsSpent { get; set; } = false;
    
    private const float ARENA_WIDTH = 1800f;
    private const float ARENA_HEIGHT = 900f;

    public void UpdatePosition(float deltaTime)
    {
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
