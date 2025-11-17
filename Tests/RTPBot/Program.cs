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
Console.WriteLine($"   Total Shots:     {config.TotalShots:N0}");
Console.WriteLine($"   Bot Name:        {config.BotName}");
Console.WriteLine($"   Boss Targeting:  {(config.BossTargetingOnly ? "ENABLED (TypeId >= 2)" : "Disabled (Random)")}");
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

var totalShots = config.TotalShots;
Console.WriteLine($"🎯 Target: {totalShots:N0} shots");
Console.WriteLine($"📊 Displaying stats every 100 shots");
Console.WriteLine();

var cts = new CancellationTokenSource();
Console.CancelKeyPress += (sender, e) =>
{
    e.Cancel = true;
    Console.WriteLine("\n⚠️  Ctrl+C detected. Shutting down gracefully...");
    cts.Cancel();
};

var shotsFired = 0;

try
{
    for (int i = 1; i <= totalShots; i++)
    {
        if (cts.Token.IsCancellationRequested)
        {
            break;
        }

        await bot.FireShotAndWaitForPayoutAsync();
        shotsFired++;

        if (shotsFired % 100 == 0)
        {
            var session = bot.Session;
            var rtpPercent = session.CurrentRTP * 100;
            Console.WriteLine($"Shot {shotsFired,6}/{totalShots:N0} | RTP: {rtpPercent,5:F1}% | Hits: {session.HitCount,5} | Credits: {session.CurrentCredits,10:N0}");
        }
    }
}
catch (OperationCanceledException)
{
    Console.WriteLine("Operation cancelled by user.");
}
catch (Exception ex)
{
    Console.WriteLine($"❌ Error during bot execution: {ex.Message}");
    Console.WriteLine($"Stack trace: {ex.StackTrace}");
}

Console.WriteLine();
Console.WriteLine("╔═══════════════════════════════════════════════════╗");
Console.WriteLine("║           RTP Validation Complete                 ║");
Console.WriteLine("╚═══════════════════════════════════════════════════╝");
Console.WriteLine();

var finalSession = bot.Session;
var targetRtp = 0.97;
var rtpDiff = Math.Abs((finalSession.CurrentRTP - targetRtp) * 100);
var withinTarget = rtpDiff <= 0.5;

Console.WriteLine($"Total Shots:        {shotsFired:N0}");
Console.WriteLine($"Total Wagered:      {finalSession.TotalWagered:N0} credits");
Console.WriteLine($"Total Payout:       {finalSession.TotalPaidOut:N0} credits");
Console.WriteLine($"Final RTP:          {finalSession.CurrentRTP:P2}");
Console.WriteLine($"Hit Rate:           {finalSession.HitRate:P2}");
Console.WriteLine($"Target RTP:         {targetRtp:P1} {(withinTarget ? "✓" : "✗")} (within ±0.5%)");
Console.WriteLine();
Console.WriteLine($"Starting Credits:   {finalSession.StartingCredits:N0}");
Console.WriteLine($"Ending Credits:     {finalSession.CurrentCredits:N0}");
Console.WriteLine($"Net Change:         {finalSession.CurrentCredits - finalSession.StartingCredits:+#,0;-#,0;0}");
Console.WriteLine();

Console.WriteLine("💾 Saving session data...");
await bot.SaveSessionAsync();

Console.WriteLine();
Console.WriteLine("✅ Bot execution completed successfully!");

return 0;
