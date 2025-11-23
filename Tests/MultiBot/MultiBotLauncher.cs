using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.DependencyInjection;
using System.Net.Http.Json;
using System.Text.Json;

namespace MultiBot;

public class MultiBotLauncher
{
    private readonly List<BotPlayer> _bots = new();
    private readonly string _baseUrl;
    private string? _matchId;
    private readonly Random _rng = new();
    
    public MultiBotLauncher(string baseUrl = "http://localhost:8000")
    {
        _baseUrl = baseUrl;
    }
    
    public async Task<bool> SpawnBotsAsync(int botCount)
    {
        if (botCount < 1 || botCount > 6)
        {
            Console.WriteLine($"❌ Bot count must be between 1 and 6 (requested: {botCount})");
            return false;
        }
        
        Console.WriteLine($"\n╔═══════════════════════════════════════════════════════════════════════════╗");
        Console.WriteLine($"║           Ocean King 3 - Multi-Bot Spectator Testing Tool                ║");
        Console.WriteLine($"╚═══════════════════════════════════════════════════════════════════════════╝\n");
        Console.WriteLine($"Spawning {botCount} bots...\n");
        
        // Step 1: Authenticate all bots
        for (int i = 0; i < botCount; i++)
        {
            var botName = $"Bot{i + 1}";
            var bot = new BotPlayer(botName, _baseUrl);
            
            if (!await bot.AuthenticateAsync())
            {
                Console.WriteLine($"❌ Failed to authenticate {botName}");
                return false;
            }
            
            _bots.Add(bot);
        }
        
        // Step 2 & 3: Connect first bot and create match, then have others join
        // Connect first bot
        if (!await _bots[0].ConnectToHubAsync())
        {
            Console.WriteLine($"❌ Failed to connect {_bots[0].Name} to SignalR");
            return false;
        }
        
        // First bot creates the match by joining
        _matchId = await _bots[0].JoinMatchAndGetIdAsync();
        if (_matchId == null)
        {
            Console.WriteLine("❌ Failed to create match");
            return false;
        }
        
        Console.WriteLine($"\n✅ Match created: {_matchId}\n");
        
        // Connect and join remaining bots
        for (int i = 1; i < _bots.Count; i++)
        {
            if (!await _bots[i].ConnectToHubAsync())
            {
                Console.WriteLine($"❌ Failed to connect {_bots[i].Name} to SignalR");
                return false;
            }
            
            // Join the same match at different seats
            if (!await _bots[i].JoinRoomAsync(_matchId, i))
            {
                Console.WriteLine($"❌ Failed to join {_bots[i].Name} to match");
                return false;
            }
        }
        
        Console.WriteLine($"\n✅ All {botCount} bots connected and ready!\n");
        return true;
    }
    
    public async Task RunTestAsync(int shotsPerBot, int betValue = 10)
    {
        Console.WriteLine($"Starting multi-bot test:");
        Console.WriteLine($"  Bots:        {_bots.Count}");
        Console.WriteLine($"  Shots/Bot:   {shotsPerBot}");
        Console.WriteLine($"  Bet Value:   ${betValue}");
        Console.WriteLine($"  Total Shots: {_bots.Count * shotsPerBot}\n");
        
        // Fire all bots simultaneously
        var tasks = _bots.Select(bot => bot.FireShotsAsync(shotsPerBot, betValue)).ToArray();
        await Task.WhenAll(tasks);
        
        Console.WriteLine("\n✅ All bots completed their shots!");
        
        // Print summary
        PrintSummary();
    }
    
    private void PrintSummary()
    {
        Console.WriteLine("\n" + new string('=', 80));
        Console.WriteLine("MULTI-BOT TEST SUMMARY");
        Console.WriteLine(new string('=', 80));
        
        foreach (var bot in _bots)
        {
            var stats = bot.GetStatistics();
            Console.WriteLine($"\n{bot.Name}:");
            Console.WriteLine($"  Shots Fired:  {stats.ShotsFired}");
            Console.WriteLine($"  Total Wagered: ${stats.TotalWagered:F2}");
            Console.WriteLine($"  Total Won:     ${stats.TotalWon:F2}");
            Console.WriteLine($"  Net P/L:       ${stats.NetProfitLoss:F2}");
            Console.WriteLine($"  RTP:           {stats.RTP:F2}%");
            Console.WriteLine($"  Credits:       ${stats.StartingCredits} → ${stats.CurrentCredits}");
        }
        
        // Overall stats
        var totalWagered = _bots.Sum(b => b.GetStatistics().TotalWagered);
        var totalWon = _bots.Sum(b => b.GetStatistics().TotalWon);
        var overallRTP = totalWagered > 0 ? (totalWon / totalWagered) * 100 : 0;
        
        Console.WriteLine($"\n{new string('-', 80)}");
        Console.WriteLine($"OVERALL:");
        Console.WriteLine($"  Total Wagered: ${totalWagered:F2}");
        Console.WriteLine($"  Total Won:     ${totalWon:F2}");
        Console.WriteLine($"  Overall RTP:   {overallRTP:F2}%");
        Console.WriteLine(new string('=', 80) + "\n");
    }
    
    public async Task DisconnectAllAsync()
    {
        foreach (var bot in _bots)
        {
            await bot.DisconnectAsync();
        }
    }
    
    
    public List<BotPlayer> GetBots() => _bots;
    public string? GetMatchId() => _matchId;
}
