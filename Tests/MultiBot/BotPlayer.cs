using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.DependencyInjection;
using System.Net.Http.Json;
using System.Text.Json;

namespace MultiBot;

public class BotPlayer
{
    private HubConnection? _connection;
    public string Name { get; }
    private readonly string _baseUrl;
    private string? _token;
    private readonly BotStatistics _stats = new();
    private readonly Random _rng = new();
    
    public BotPlayer(string name, string baseUrl)
    {
        Name = name;
        _baseUrl = baseUrl;
    }
    
    public async Task<bool> AuthenticateAsync()
    {
        try
        {
            using var httpClient = new HttpClient();
            httpClient.BaseAddress = new Uri(_baseUrl);
            
            var authResponse = await httpClient.PostAsJsonAsync("/api/auth/guest", new { name = Name });
            
            if (!authResponse.IsSuccessStatusCode)
            {
                Console.WriteLine($"[{Name}] ❌ Authentication failed");
                return false;
            }
            
            var authData = await authResponse.Content.ReadFromJsonAsync<JsonElement>();
            _token = authData.GetProperty("token").GetString();
            _stats.StartingCredits = authData.GetProperty("credits").GetInt32();
            _stats.CurrentCredits = _stats.StartingCredits;
            
            Console.WriteLine($"[{Name}] ✅ Authenticated with {_stats.StartingCredits} credits");
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[{Name}] ❌ Auth failed: {ex.Message}");
            return false;
        }
    }
    
    public async Task<bool> ConnectToHubAsync()
    {
        try
        {
            _connection = new HubConnectionBuilder()
                .WithUrl($"{_baseUrl}/gamehub", options =>
                {
                    options.AccessTokenProvider = () => Task.FromResult(_token);
                })
                .AddMessagePackProtocol()
                .WithAutomaticReconnect()
                .Build();
            
            // Register event handlers
            _connection.On<object>("StateDelta", OnStateDelta);
            
            await _connection.StartAsync();
            Console.WriteLine($"[{Name}] ✅ Connected to SignalR");
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[{Name}] ❌ SignalR connection failed: {ex.Message}");
            return false;
        }
    }
    
    public async Task<string?> JoinMatchAndGetIdAsync()
    {
        if (_connection == null)
        {
            Console.WriteLine($"[{Name}] ❌ Not connected to SignalR");
            return null;
        }
        
        try
        {
            // Use object type to avoid deserialization issues
            var result = await _connection.InvokeAsync<object>("JoinMatch", Name);
            
            // Serialize back to JSON to access properties safely
            var json = JsonSerializer.Serialize(result);
            var jsonDoc = JsonDocument.Parse(json);
            var root = jsonDoc.RootElement;
            
            if (root.TryGetProperty("success", out var successProp))
            {
                var success = successProp.GetBoolean();
                
                if (!success)
                {
                    Console.WriteLine($"[{Name}] ❌ Failed to create match");
                    return null;
                }
                
                if (root.TryGetProperty("matchId", out var matchIdProp))
                {
                    var matchId = matchIdProp.GetString();
                    var seat = root.TryGetProperty("playerSlot", out var seatProp) 
                        ? seatProp.GetInt32() : 0;
                    
                    Console.WriteLine($"[{Name}] ✅ Created match {matchId} at seat {seat}");
                    return matchId;
                }
            }
            
            Console.WriteLine($"[{Name}] ❌ Invalid response from JoinMatch");
            return null;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[{Name}] ❌ Failed to create match: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return null;
        }
    }
    
    public async Task<bool> JoinRoomAsync(string matchId, int seatIndex)
    {
        if (_connection == null)
        {
            Console.WriteLine($"[{Name}] ❌ Not connected to SignalR");
            return false;
        }
        
        try
        {
            // Use object type to avoid deserialization issues
            var result = await _connection.InvokeAsync<object>("JoinRoom", matchId, seatIndex);
            
            // Serialize back to JSON to access properties safely
            var json = JsonSerializer.Serialize(result);
            var jsonDoc = JsonDocument.Parse(json);
            var root = jsonDoc.RootElement;
            
            if (root.TryGetProperty("success", out var successProp))
            {
                var success = successProp.GetBoolean();
                
                if (!success)
                {
                    var message = root.TryGetProperty("message", out var msgProp) 
                        ? msgProp.GetString() : "Unknown error";
                    Console.WriteLine($"[{Name}] ❌ Failed to join match at seat {seatIndex}: {message}");
                    return false;
                }
                
                Console.WriteLine($"[{Name}] ✅ Joined match at seat {seatIndex}");
                return true;
            }
            
            Console.WriteLine($"[{Name}] ❌ Invalid response from JoinRoom");
            return false;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[{Name}] ❌ Failed to join match: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return false;
        }
    }
    
    public async Task FireShotsAsync(int shotCount, int betValue)
    {
        if (_connection == null) return;
        
        Console.WriteLine($"[{Name}] Starting to fire {shotCount} shots...");
        
        for (int i = 0; i < shotCount; i++)
        {
            await FireRandomShotAsync(betValue);
            _stats.ShotsFired++;
            _stats.TotalWagered += betValue;
            
            // Rate limiting (100ms between shots)
            await Task.Delay(110);
        }
        
        Console.WriteLine($"[{Name}] ✅ Completed {shotCount} shots");
    }
    
    private async Task FireRandomShotAsync(int betValue)
    {
        if (_connection == null) return;
        
        // Random direction
        var angle = _rng.NextDouble() * Math.PI * 2;
        var dirX = (float)Math.Cos(angle);
        var dirY = (float)Math.Sin(angle);
        
        // Random position (turret would be at specific positions, but we'll use center for testing)
        var x = 900f;
        var y = 450f;
        
        try
        {
            await _connection.InvokeAsync("Fire", x, y, dirX, dirY);
        }
        catch
        {
            // Ignore errors during firing
        }
    }
    
    private void OnStateDelta(object deltaObj)
    {
        // Track credit updates from state delta
        try
        {
            var json = JsonSerializer.Serialize(deltaObj);
            var delta = JsonDocument.Parse(json).RootElement;
            
            if (delta.TryGetProperty("Players", out var players))
            {
                foreach (var player in players.EnumerateArray())
                {
                    if (player.TryGetProperty("DisplayName", out var displayName))
                    {
                        if (displayName.GetString() == Name)
                        {
                            if (player.TryGetProperty("Credits", out var credits))
                            {
                                _stats.CurrentCredits = credits.GetInt32();
                            }
                        }
                    }
                }
            }
            
            // Track payout events
            if (delta.TryGetProperty("PayoutEvents", out var payoutEvents))
            {
                foreach (var payout in payoutEvents.EnumerateArray())
                {
                    // PayoutEvents contain kill info - we can track wins here
                    if (payout.TryGetProperty("WinAmount", out var winAmount))
                    {
                        _stats.TotalWon += winAmount.GetDecimal();
                    }
                }
            }
        }
        catch
        {
            // Ignore parsing errors
        }
    }
    
    public async Task DisconnectAsync()
    {
        if (_connection != null)
        {
            await _connection.StopAsync();
            await _connection.DisposeAsync();
        }
    }
    
    public BotStatistics GetStatistics() => _stats;
}

public class BotStatistics
{
    public int StartingCredits { get; set; }
    public int CurrentCredits { get; set; }
    public int ShotsFired { get; set; }
    public decimal TotalWagered { get; set; }
    public decimal TotalWon { get; set; }
    
    public decimal NetProfitLoss => TotalWon - TotalWagered;
    public double RTP => TotalWagered > 0 ? (double)(TotalWon / TotalWagered) * 100 : 0;
}
