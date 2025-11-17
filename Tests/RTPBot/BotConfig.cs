namespace RTPBot;

public class BotConfig
{
    public string ServerUrl { get; set; } = "http://localhost:8080";
    public string RoomId { get; set; } = "match_1";
    public int SeatNumber { get; set; } = 1;
    public int BetAmount { get; set; } = 10;
    public int ShotsPerMinute { get; set; } = 60;
    public int DurationMinutes { get; set; } = 5;
    public string BotName { get; set; } = "RTPBot";
}
