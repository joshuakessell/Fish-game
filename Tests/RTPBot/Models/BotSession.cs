namespace RTPBot.Models;

public class BotSession
{
    public string BotId { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public int StartingCredits { get; set; }
    public int CurrentCredits { get; set; }
    public List<ShotRecord> Shots { get; set; } = new();
    
    public int TotalWagered => Shots.Sum(s => s.BetAmount);
    public int TotalPaidOut => Shots.Sum(s => s.PayoutReceived ?? 0);
    public double CurrentRTP => TotalWagered > 0 ? (double)TotalPaidOut / TotalWagered : 0;
    public int TotalShots => Shots.Count;
    public int HitCount => Shots.Count(s => s.PayoutReceived.HasValue && s.PayoutReceived > 0);
    public double HitRate => TotalShots > 0 ? (double)HitCount / TotalShots : 0;
}
