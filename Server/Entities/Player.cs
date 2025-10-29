namespace OceanKing.Server.Entities;

public class Player
{
    public string PlayerId { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public decimal Credits { get; set; } = 1000m; // Starting credits
    public int CannonLevel { get; set; } = 1;
    public int BetValue { get; set; } = 10; // Bet value per shot (min 10, max 200)
    public int PlayerSlot { get; set; } // 0-7 for positioning
    public string ConnectionId { get; set; } = string.Empty;
    
    // Fire rate limiting
    public DateTime LastFireTime { get; set; } = DateTime.MinValue;
    public const double MIN_FIRE_INTERVAL_MS = 100; // Max 10 shots per second
    
    // Stats
    public int TotalKills { get; set; } = 0;
    public decimal TotalEarned { get; set; } = 0m;
    public decimal TotalSpent { get; set; } = 0m;
    
    // Hot seat system - temporary luck boost
    public bool IsHotSeat { get; set; } = false;
    public long HotSeatExpiryTick { get; set; } = 0;
    public float LuckMultiplier { get; set; } = 1.0f; // 1.0 = normal, 1.3 = 30% better odds

    public bool CanFire()
    {
        var timeSinceLastFire = (DateTime.UtcNow - LastFireTime).TotalMilliseconds;
        return timeSinceLastFire >= MIN_FIRE_INTERVAL_MS;
    }
}
