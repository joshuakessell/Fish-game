namespace RTPBot;

public class BotStatistics
{
    public int TotalShots { get; set; }
    public decimal TotalWagered { get; set; }
    public decimal TotalWon { get; set; }
    public Dictionary<int, int> FishKillCounts { get; set; } = new();
    public Dictionary<int, decimal> FishPayouts { get; set; } = new();
    public int StartingCredits { get; set; }
    public int CurrentCredits { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    
    public decimal CalculateRTP()
    {
        if (TotalWagered == 0) return 0;
        return (TotalWon / TotalWagered) * 100;
    }
    
    public TimeSpan GetDuration()
    {
        if (EndTime == null) return DateTime.Now - StartTime;
        return EndTime.Value - StartTime;
    }
    
    public void PrintSummary(string botName)
    {
        Console.WriteLine("\n" + new string('=', 80));
        Console.WriteLine($"RTP BOT TEST RESULTS - {botName}");
        Console.WriteLine(new string('=', 80));
        Console.WriteLine($"Duration:        {GetDuration():mm\\:ss}");
        Console.WriteLine($"Total Shots:     {TotalShots:N0}");
        Console.WriteLine($"Total Wagered:   ${TotalWagered:N2}");
        Console.WriteLine($"Total Won:       ${TotalWon:N2}");
        Console.WriteLine($"Net P/L:         ${(TotalWon - TotalWagered):N2}");
        Console.WriteLine($"RTP:             {CalculateRTP():F2}%");
        Console.WriteLine($"Starting Credits: {StartingCredits}");
        Console.WriteLine($"Current Credits:  {CurrentCredits}");
        Console.WriteLine(new string('-', 80));
        
        if (FishKillCounts.Any())
        {
            Console.WriteLine("\nFish Kill Statistics:");
            foreach (var (fishType, kills) in FishKillCounts.OrderBy(x => x.Key))
            {
                var avgPayout = kills > 0 ? FishPayouts.GetValueOrDefault(fishType, 0) / kills : 0;
                Console.WriteLine($"  Type {fishType:D2}: {kills,4} kills | Avg Payout: ${avgPayout:F2}");
            }
        }
        
        Console.WriteLine(new string('=', 80) + "\n");
    }
}
