using RTPBot;

Console.WriteLine(@"
╔═══════════════════════════════════════════════════════════════════════════╗
║                    Ocean King 3 - RTP Bot Testing Tool                    ║
╚═══════════════════════════════════════════════════════════════════════════╝
");

// Parse command line arguments
var shotCount = args.Length > 0 && int.TryParse(args[0], out var shots) ? shots : 1000;
var betValue = args.Length > 1 && int.TryParse(args[1], out var bet) ? bet : 10;
var baseUrl = args.Length > 2 ? args[2] : "http://localhost:8000";

Console.WriteLine($"Configuration:");
Console.WriteLine($"  Shot Count:  {shotCount:N0}");
Console.WriteLine($"  Bet Value:   ${betValue}");
Console.WriteLine($"  Server URL:  {baseUrl}");
Console.WriteLine();

// Create and run bot
var bot = new OceanKingBot($"RTPBot_{DateTime.Now:HHmmss}", baseUrl);

try
{
    // Connect to server
    if (!await bot.ConnectAsync())
    {
        Console.WriteLine("Failed to connect to server. Is it running?");
        return 1;
    }
    
    // Create solo game
    if (!await bot.CreateSoloGameAsync())
    {
        Console.WriteLine("Failed to create solo game.");
        return 1;
    }
    
    // Run test
    await bot.RunTestAsync(shotCount, betValue);
    
    // Cleanup
    await bot.DisconnectAsync();
    
    Console.WriteLine("✅ RTP test completed successfully!");
    return 0;
}
catch (Exception ex)
{
    Console.WriteLine($"\n❌ Test failed with exception:");
    Console.WriteLine(ex.Message);
    Console.WriteLine(ex.StackTrace);
    return 1;
}
