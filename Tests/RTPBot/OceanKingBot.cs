using Microsoft.AspNetCore.SignalR.Client;
using System.Net.Http.Json;
using System.Text.Json;

namespace RTPBot;

public class OceanKingBot
{
    private HubConnection? _connection;
    private readonly string _botName;
    private readonly BotStatistics _stats;
    private readonly Random _rng;
    private readonly string _baseUrl;
    private string? _token;
    private bool _isRunning;
    
    public OceanKingBot(string botName, string baseUrl = "http://localhost:8080")
    {
        _botName = botName;
        _stats = new BotStatistics();
        _rng = new Random();
        _baseUrl = baseUrl;
    }
    
    public async Task<bool> ConnectAsync()
    {
        try
        {
            Console.WriteLine($"[{_botName}] Authenticating as guest...");
            
            // Authenticate as guest
            using var httpClient = new HttpClient();
            httpClient.BaseAddress = new Uri(_baseUrl);
            
            var authResponse = await httpClient.PostAsJsonAsync("/api/auth/guest", new { name = _botName });
            
            if (!authResponse.IsSuccessStatusCode)
            {
                Console.WriteLine($"[{_botName}] ❌ Authentication failed: {authResponse.StatusCode}");
                return false;
            }
            
            var authData = await authResponse.Content.ReadFromJsonAsync<JsonElement>();
            _token = authData.GetProperty("token").GetString();
            _stats.StartingCredits = authData.GetProperty("credits").GetInt32();
            _stats.CurrentCredits = _stats.StartingCredits;
            
            Console.WriteLine($"[{_botName}] ✅ Authenticated with {_stats.StartingCredits} credits");
            
            // Connect to SignalR hub
            Console.WriteLine($"[{_botName}] Connecting to SignalR hub...");
            
            _connection = new HubConnectionBuilder()
                .WithUrl($"{_baseUrl}/gamehub", options =>
                {
                    options.AccessTokenProvider = () => Task.FromResult(_token);
                })
                .AddMessagePackProtocol()
                .WithAutomaticReconnect()
                .Build();
            
            // Register event handlers
            _connection.On<object>("StateDelta", _ => { }); // Ignore state updates
            _connection.On<int, int, int, bool>("PayoutEvent", OnPayoutEvent);
            
            await _connection.StartAsync();
            Console.WriteLine($"[{_botName}] ✅ Connected to SignalR");
            
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[{_botName}] ❌ Connection failed: {ex.Message}");
            return false;
        }
    }
    
    public async Task<bool> JoinRoomAsync(string roomId = "solo_bot_test")
    {
        if (_connection == null)
        {
            Console.WriteLine($"[{_botName}] ❌ Not connected to SignalR");
            return false;
        }
        
        try
        {
            Console.WriteLine($"[{_botName}] Joining room '{roomId}'...");
            await _connection.InvokeAsync("JoinRoom", roomId, 1); // Seat 1
            Console.WriteLine($"[{_botName}] ✅ Joined room '{roomId}' at seat 1");
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[{_botName}] ❌ Failed to join room: {ex.Message}");
            return false;
        }
    }
    
    public async Task RunTestAsync(int shotCount, int betValue = 10)
    {
        if (_connection == null)
        {
            Console.WriteLine($"[{_botName}] ❌ Not connected");
            return;
        }
        
        _stats.StartTime = DateTime.Now;
        _isRunning = true;
        
        Console.WriteLine($"[{_botName}] Starting RTP test: {shotCount} shots at ${betValue} bet");
        Console.WriteLine($"[{_botName}] Progress: ", false);
        
        var progressInterval = Math.Max(1, shotCount / 20); // Show 20 progress updates
        
        for (int i = 0; i < shotCount && _isRunning; i++)
        {
            await FireRandomShotAsync(betValue);
            _stats.TotalShots++;
            
            if ((i + 1) % progressInterval == 0 || i == shotCount - 1)
            {
                var progress = (double)(i + 1) / shotCount * 100;
                Console.Write($"{progress:F0}% ");
            }
            
            // Small delay to avoid overwhelming server
            await Task.Delay(50);
        }
        
        Console.WriteLine("\n");
        _stats.EndTime = DateTime.Now;
        _stats.PrintSummary(_botName);
    }
    
    private async Task FireRandomShotAsync(int betValue)
    {
        if (_connection == null) return;
        
        try
        {
            // Fire at random coordinates within game bounds
            var x = _rng.Next(100, 1700);
            var y = _rng.Next(100, 800);
            var bulletId = Guid.NewGuid().ToString();
            
            _stats.TotalWagered += betValue;
            
            await _connection.InvokeAsync("Fire", x, y, bulletId);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"\n[{_botName}] ❌ Fire failed: {ex.Message}");
        }
    }
    
    private void OnPayoutEvent(int fishId, int amount, int fishType, bool isOwnKill)
    {
        if (!isOwnKill) return; // Only count our own kills
        
        _stats.TotalWon += amount;
        _stats.CurrentCredits += amount;
        
        _stats.FishKillCounts[fishType] = _stats.FishKillCounts.GetValueOrDefault(fishType, 0) + 1;
        _stats.FishPayouts[fishType] = _stats.FishPayouts.GetValueOrDefault(fishType, 0) + amount;
    }
    
    public void Stop()
    {
        _isRunning = false;
    }
    
    public async Task DisconnectAsync()
    {
        if (_connection != null)
        {
            await _connection.StopAsync();
            await _connection.DisposeAsync();
            Console.WriteLine($"[{_botName}] Disconnected");
        }
    }
}
