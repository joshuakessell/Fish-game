namespace MultiBot;

class Program
{
    static async Task Main(string[] args)
    {
        // Parse arguments: botCount shotsPerBot betValue [serverUrl]
        if (args.Length < 2)
        {
            Console.WriteLine("Usage: dotnet run <botCount> <shotsPerBot> [betValue] [serverUrl]");
            Console.WriteLine("  botCount:     Number of bots (1-6)");
            Console.WriteLine("  shotsPerBot:  Number of shots each bot fires");
            Console.WriteLine("  betValue:     Optional bet value per shot (default: 10)");
            Console.WriteLine("  serverUrl:    Optional server URL (default: http://localhost:8000)");
            Console.WriteLine("\nExample: dotnet run 4 50 10 http://localhost:8000");
            return;
        }
        
        var botCount = int.Parse(args[0]);
        var shotsPerBot = int.Parse(args[1]);
        var betValue = args.Length > 2 ? int.Parse(args[2]) : 10;
        var serverUrl = args.Length > 3 ? args[3] : "http://localhost:8000";
        
        var launcher = new MultiBotLauncher(serverUrl);
        
        if (!await launcher.SpawnBotsAsync(botCount))
        {
            Console.WriteLine("\n❌ Failed to spawn bots");
            return;
        }
        
        await launcher.RunTestAsync(shotsPerBot, betValue);
        
        Console.WriteLine("\nPress any key to disconnect bots and exit...");
        Console.ReadKey();
        
        await launcher.DisconnectAllAsync();
    }
}
