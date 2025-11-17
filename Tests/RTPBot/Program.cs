using Microsoft.Extensions.Configuration;
using RTPBot;

Console.WriteLine("╔═══════════════════════════════════════════════════╗");
Console.WriteLine("║      Ocean King RTP Bot - Testing Framework      ║");
Console.WriteLine("╚═══════════════════════════════════════════════════╝");
Console.WriteLine();

var configuration = new ConfigurationBuilder()
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("appsettings.json", optional: true, reloadOnChange: false)
    .Build();

var config = configuration.GetSection("BotConfig").Get<BotConfig>() ?? new BotConfig();

Console.WriteLine("📋 Configuration:");
Console.WriteLine($"   Server URL:      {config.ServerUrl}");
Console.WriteLine($"   Room ID:         {config.RoomId}");
Console.WriteLine($"   Seat Number:     {config.SeatNumber}");
Console.WriteLine($"   Bet Amount:      {config.BetAmount} credits");
Console.WriteLine($"   Shots/Minute:    {config.ShotsPerMinute}");
Console.WriteLine($"   Duration:        {config.DurationMinutes} minutes");
Console.WriteLine($"   Bot Name:        {config.BotName}");
Console.WriteLine();

await using var bot = new RTPBotClient(config);

Console.WriteLine("🔐 Step 1/4: Authenticating...");
if (!await bot.AuthenticateAsync())
{
    Console.WriteLine("❌ Authentication failed. Exiting.");
    return 1;
}

Console.WriteLine("🔌 Step 2/4: Connecting to SignalR...");
if (!await bot.ConnectAsync())
{
    Console.WriteLine("❌ Connection failed. Exiting.");
    return 1;
}

Console.WriteLine("🚪 Step 3/4: Joining room...");
if (!await bot.JoinRoomAsync())
{
    Console.WriteLine("❌ Failed to join room. Exiting.");
    return 1;
}

Console.WriteLine("💰 Step 4/4: Setting bet value...");
await bot.SetBetValueAsync();

await Task.Delay(1000);

Console.WriteLine();
Console.WriteLine("╔═══════════════════════════════════════════════════╗");
Console.WriteLine("║              Bot Session Started                  ║");
Console.WriteLine("╚═══════════════════════════════════════════════════╝");
Console.WriteLine();

var totalShots = config.ShotsPerMinute * config.DurationMinutes;
var delayBetweenShots = (60 * 1000) / config.ShotsPerMinute;
var startTime = DateTime.UtcNow;
var endTime = startTime.AddMinutes(config.DurationMinutes);

Console.WriteLine($"🎯 Target: {totalShots} shots over {config.DurationMinutes} minutes");
Console.WriteLine($"⏱️  Shot interval: {delayBetweenShots}ms ({config.ShotsPerMinute} shots/min)");
Console.WriteLine($"🏁 End time: {endTime:HH:mm:ss} UTC");
Console.WriteLine();

var statsUpdateInterval = TimeSpan.FromSeconds(5);
var lastStatsUpdate = DateTime.UtcNow;
var shotsFired = 0;

var cts = new CancellationTokenSource();
Console.CancelKeyPress += (sender, e) =>
{
    e.Cancel = true;
    Console.WriteLine("\n⚠️  Ctrl+C detected. Shutting down gracefully...");
    cts.Cancel();
};

try
{
    while (DateTime.UtcNow < endTime && !cts.Token.IsCancellationRequested)
    {
        await bot.FireShotAsync();
        shotsFired++;

        if (DateTime.UtcNow - lastStatsUpdate >= statsUpdateInterval)
        {
            DisplayStats(bot, shotsFired, totalShots, startTime, endTime);
            lastStatsUpdate = DateTime.UtcNow;
        }

        await Task.Delay(delayBetweenShots, cts.Token);
    }
}
catch (OperationCanceledException)
{
    Console.WriteLine("Operation cancelled by user.");
}
catch (Exception ex)
{
    Console.WriteLine($"❌ Error during bot execution: {ex.Message}");
}

Console.WriteLine();
Console.WriteLine("╔═══════════════════════════════════════════════════╗");
Console.WriteLine("║              Bot Session Completed                ║");
Console.WriteLine("╚═══════════════════════════════════════════════════╝");
Console.WriteLine();

DisplayFinalStats(bot, shotsFired);

Console.WriteLine();
Console.WriteLine("💾 Saving session data...");
await bot.SaveSessionAsync();

Console.WriteLine();
Console.WriteLine("✅ Bot execution completed successfully!");
Console.WriteLine("Press any key to exit...");
Console.ReadKey();

return 0;

void DisplayStats(RTPBotClient bot, int shotsFired, int totalShots, DateTime startTime, DateTime endTime)
{
    var snapshot = bot.GetSessionSnapshot();
    var elapsed = DateTime.UtcNow - startTime;
    var remaining = endTime - DateTime.UtcNow;
    var progress = totalShots > 0 ? (double)shotsFired / totalShots * 100 : 0;

    Console.WriteLine($"📊 [{DateTime.UtcNow:HH:mm:ss}] Progress: {shotsFired}/{totalShots} shots ({progress:F1}%) | " +
                      $"Elapsed: {elapsed.TotalMinutes:F1}m | Remaining: {remaining.TotalMinutes:F1}m");
    Console.WriteLine($"   💵 Credits: {snapshot.CurrentCredits} (started with {snapshot.StartingCredits}) | " +
                      $"RTP: {snapshot.CurrentRTP:P2} | Hit Rate: {snapshot.HitRate:P1}");
    Console.WriteLine($"   📈 Total Wagered: {snapshot.TotalWagered} | Total Won: {snapshot.TotalPaidOut} | " +
                      $"Net: {snapshot.CurrentCredits - snapshot.StartingCredits:+#;-#;0}");
}

void DisplayFinalStats(RTPBotClient bot, int shotsFired)
{
    var snapshot = bot.GetSessionSnapshot();
    
    Console.WriteLine("📊 Final Statistics:");
    Console.WriteLine($"   Total Shots Fired:  {shotsFired}");
    Console.WriteLine($"   Hits:               {snapshot.HitCount} ({snapshot.HitRate:P1})");
    Console.WriteLine($"   Misses:             {shotsFired - snapshot.HitCount}");
    Console.WriteLine();
    Console.WriteLine($"   Starting Credits:   {snapshot.StartingCredits}");
    Console.WriteLine($"   Ending Credits:     {snapshot.CurrentCredits}");
    Console.WriteLine($"   Net Change:         {snapshot.CurrentCredits - snapshot.StartingCredits:+#;-#;0}");
    Console.WriteLine();
    Console.WriteLine($"   Total Wagered:      {snapshot.TotalWagered}");
    Console.WriteLine($"   Total Paid Out:     {snapshot.TotalPaidOut}");
    Console.WriteLine($"   RTP (Return to Player): {snapshot.CurrentRTP:P2}");
    Console.WriteLine();
    
    if (snapshot.EndTime.HasValue && snapshot.StartTime != default)
    {
        var duration = snapshot.EndTime.Value - snapshot.StartTime;
        Console.WriteLine($"   Session Duration:   {duration.TotalMinutes:F2} minutes");
        
        if (duration.TotalMinutes > 0)
        {
            var shotsPerMinute = shotsFired / duration.TotalMinutes;
            Console.WriteLine($"   Actual Fire Rate:   {shotsPerMinute:F1} shots/minute");
        }
    }
}
