namespace OceanKing.Server.Entities;

public class Player
{
    public string PlayerId { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public decimal Credits { get; set; } = 1000m; // Starting credits
    public int CannonLevel { get; set; } = 1;
    public int WeaponType { get; set; } = 0; // 0 = normal, 1 = lightning, 2 = bomb
    public int PlayerSlot { get; set; } // 0-7 for positioning
    public string ConnectionId { get; set; } = string.Empty;
    
    // Fire rate limiting
    public DateTime LastFireTime { get; set; } = DateTime.MinValue;
    public const double MIN_FIRE_INTERVAL_MS = 100; // Max 10 shots per second
    
    // Stats
    public int TotalKills { get; set; } = 0;
    public decimal TotalEarned { get; set; } = 0m;
    public decimal TotalSpent { get; set; } = 0m;

    public bool CanFire()
    {
        var timeSinceLastFire = (DateTime.UtcNow - LastFireTime).TotalMilliseconds;
        return timeSinceLastFire >= MIN_FIRE_INTERVAL_MS;
    }

    public decimal GetWeaponCost()
    {
        return WeaponType switch
        {
            1 => 50m, // Lightning chain - expensive
            2 => 100m, // Bomb - very expensive
            _ => 1m * CannonLevel // Normal shot scales with cannon level
        };
    }
}
