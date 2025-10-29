namespace OceanKing.Server.Entities;

public class Projectile
{
    public string ProjectileId { get; set; } = Guid.NewGuid().ToString();
    public string OwnerPlayerId { get; set; } = string.Empty;
    public int WeaponTypeId { get; set; }
    
    public float X { get; set; }
    public float Y { get; set; }
    public float DirectionX { get; set; }
    public float DirectionY { get; set; }
    public float Speed { get; set; } = 300f; // pixels per second
    public float Damage { get; set; }
    
    public int TtlTicks { get; set; } = 90; // 3 seconds at 30 TPS
    public bool IsSpent { get; set; } = false;

    public void UpdatePosition(float deltaTime)
    {
        X += DirectionX * Speed * deltaTime;
        Y += DirectionY * Speed * deltaTime;
        TtlTicks--;
    }

    public bool ShouldRemove() => TtlTicks <= 0 || IsSpent;
}
