namespace RTPBot.Models;

public class ShotRecord
{
    public DateTime Timestamp { get; set; }
    public int BetAmount { get; set; }
    public double TargetX { get; set; }
    public double TargetY { get; set; }
    public int? PayoutReceived { get; set; }
    public int? FishTypeKilled { get; set; }
    public string Nonce { get; set; } = string.Empty;
    public int? TargetFishId { get; set; }
}
