using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.AspNetCore.SignalR.Protocol;
using RTPBot.Models;
using System.Text;
using System.Text.Json;

namespace RTPBot;

public class RTPBotClient : IAsyncDisposable
{
    private readonly BotConfig _config;
    private readonly BotSession _session;
    private readonly HttpClient _httpClient;
    private HubConnection? _hubConnection;
    private string? _jwtToken;
    private int _playerSlot;
    private readonly Random _random = new();
    private readonly object _telemetryLock = new();
    
    private List<FishPosition> _currentFish = new();
    private readonly object _fishLock = new();
    
    private class FishPosition
    {
        public int FishId { get; set; }
        public int TypeId { get; set; }
        public float X { get; set; }
        public float Y { get; set; }
    }

    public BotSession Session => _session;
    public bool IsConnected => _hubConnection?.State == HubConnectionState.Connected;

    public RTPBotClient(BotConfig config)
    {
        _config = config;
        _httpClient = new HttpClient { BaseAddress = new Uri(_config.ServerUrl) };
        
        _session = new BotSession
        {
            BotId = Guid.NewGuid().ToString(),
            StartTime = DateTime.UtcNow
        };
    }

    public async Task<bool> AuthenticateAsync()
    {
        try
        {
            var requestBody = new { Name = _config.BotName };
            var content = new StringContent(
                JsonSerializer.Serialize(requestBody),
                Encoding.UTF8,
                "application/json"
            );

            var response = await _httpClient.PostAsync("/api/auth/guest", content);
            
            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine($"❌ Guest login failed: {response.StatusCode}");
                return false;
            }

            var responseJson = await response.Content.ReadAsStringAsync();
            var authData = JsonSerializer.Deserialize<JsonElement>(responseJson);
            
            _jwtToken = authData.GetProperty("token").GetString();
            _session.StartingCredits = authData.GetProperty("credits").GetInt32();
            _session.CurrentCredits = _session.StartingCredits;

            Console.WriteLine($"✅ Authenticated as '{_config.BotName}' with {_session.StartingCredits} credits");
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Authentication error: {ex.Message}");
            return false;
        }
    }

    public async Task<bool> ConnectAsync()
    {
        if (string.IsNullOrEmpty(_jwtToken))
        {
            Console.WriteLine("❌ Cannot connect: not authenticated");
            return false;
        }

        try
        {
            _hubConnection = new HubConnectionBuilder()
                .WithUrl($"{_config.ServerUrl}/gamehub", options =>
                {
                    options.AccessTokenProvider = () => Task.FromResult(_jwtToken);
                })
                .WithAutomaticReconnect()
                .Build();

            SetupSignalRHandlers();

            await _hubConnection.StartAsync();
            Console.WriteLine("✅ Connected to SignalR GameHub");
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Connection error: {ex.Message}");
            return false;
        }
    }

    public async Task<bool> JoinRoomAsync()
    {
        if (_hubConnection == null || !IsConnected)
        {
            Console.WriteLine("❌ Cannot join room: not connected");
            return false;
        }

        try
        {
            var result = await _hubConnection.InvokeAsync<JsonElement>(
                "JoinRoom",
                _config.RoomId,
                _config.SeatNumber
            );

            if (!result.TryGetProperty("success", out var successProp) || !successProp.GetBoolean())
            {
                var message = result.TryGetProperty("message", out var msgProp) 
                    ? msgProp.GetString() 
                    : "Unknown error";
                Console.WriteLine($"❌ Failed to join room: {message}");
                return false;
            }

            _playerSlot = result.GetProperty("playerSlot").GetInt32();
            Console.WriteLine($"✅ Joined room '{_config.RoomId}' at seat {_playerSlot}");
            
            await Task.Delay(1000);
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Join room error: {ex.Message}");
            return false;
        }
    }

    public async Task SetBetValueAsync()
    {
        if (_hubConnection == null || !IsConnected)
        {
            return;
        }

        try
        {
            await _hubConnection.InvokeAsync("SetBetValue", _config.BetAmount);
            Console.WriteLine($"💰 Bet value set to {_config.BetAmount}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ SetBetValue error: {ex.Message}");
        }
    }

    public async Task FireShotAsync()
    {
        if (_hubConnection == null || !IsConnected)
        {
            return;
        }

        var (x, y, targetFishId) = SelectTarget();
        var nonce = Guid.NewGuid().ToString();

        try
        {
            var dirX = 0f;
            var dirY = -1f;

            await _hubConnection.InvokeAsync("Fire", x, y, dirX, dirY, "", targetFishId);

            lock (_telemetryLock)
            {
                var shot = new ShotRecord
                {
                    Timestamp = DateTime.UtcNow,
                    BetAmount = _config.BetAmount,
                    TargetX = x,
                    TargetY = y,
                    FishTypeKilled = null,
                    PayoutReceived = null,
                    Nonce = nonce,
                    TargetFishId = targetFishId
                };
                _session.Shots.Add(shot);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Fire error: {ex.Message}");
        }
    }

    private (float x, float y, int? fishId) SelectTarget()
    {
        lock (_fishLock)
        {
            if (_currentFish.Count > 0)
            {
                var fish = _currentFish[_random.Next(_currentFish.Count)];
                return (fish.X, fish.Y, fish.FishId);
            }
        }

        var randomX = _random.Next(100, 1700);
        var randomY = _random.Next(100, 800);
        return (randomX, randomY, null);
    }

    private void SetupSignalRHandlers()
    {
        if (_hubConnection == null) return;

        _hubConnection.On<object[]>("StateDelta", (stateDelta) =>
        {
            try
            {
                if (stateDelta.Length < 10)
                {
                    return;
                }

                if (stateDelta[5] is object[] fishArray && fishArray.Length > 0)
                {
                    var newFishList = new List<FishPosition>();
                    
                    foreach (var fishObj in fishArray)
                    {
                        if (fishObj is object[] fishData && fishData.Length >= 5)
                        {
                            var fishId = Convert.ToInt32(fishData[0]);
                            var typeId = Convert.ToInt32(fishData[1]);
                            var x = Convert.ToSingle(fishData[2]);
                            var y = Convert.ToSingle(fishData[3]);
                            
                            newFishList.Add(new FishPosition
                            {
                                FishId = fishId,
                                TypeId = typeId,
                                X = x,
                                Y = y
                            });
                        }
                    }

                    lock (_fishLock)
                    {
                        _currentFish = newFishList;
                    }
                }

                if (stateDelta[9] is object[] payoutEvents && payoutEvents.Length > 0)
                {
                    foreach (var eventObj in payoutEvents)
                    {
                        if (eventObj is object[] eventData && eventData.Length >= 3)
                        {
                            var fishId = Convert.ToInt32(eventData[0]);
                            var payout = Convert.ToInt32(eventData[1]);
                            var playerSlot = Convert.ToInt32(eventData[2]);

                            if (playerSlot == _playerSlot)
                            {
                                RecordPayout(fishId, payout);
                            }
                        }
                    }
                }

                if (stateDelta[4] is object[] players && players.Length > 0)
                {
                    foreach (var playerObj in players)
                    {
                        if (playerObj is System.Collections.IDictionary playerDict)
                        {
                            if (playerDict.Contains("PlayerSlot") && 
                                Convert.ToInt32(playerDict["PlayerSlot"]!) == _playerSlot)
                            {
                                if (playerDict.Contains("Credits"))
                                {
                                    var newCredits = Convert.ToInt32(playerDict["Credits"]!);
                                    lock (_telemetryLock)
                                    {
                                        _session.CurrentCredits = newCredits;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ StateDelta processing error: {ex.Message}");
            }
        });

        _hubConnection.Closed += async (error) =>
        {
            Console.WriteLine($"❌ Connection closed: {error?.Message ?? "No error"}");
        };

        _hubConnection.Reconnecting += async (error) =>
        {
            Console.WriteLine($"🔄 Reconnecting: {error?.Message ?? "No error"}");
        };

        _hubConnection.Reconnected += async (connectionId) =>
        {
            Console.WriteLine($"✅ Reconnected with connection ID: {connectionId}");
            try
            {
                Console.WriteLine($"🔄 Re-joining room {_config.RoomId} at seat {_config.SeatNumber}...");
                var result = await _hubConnection.InvokeAsync<JsonElement>(
                    "JoinRoom",
                    _config.RoomId,
                    _config.SeatNumber
                );

                if (result.TryGetProperty("success", out var successProp) && successProp.GetBoolean())
                {
                    _playerSlot = result.GetProperty("playerSlot").GetInt32();
                    Console.WriteLine($"✅ Re-joined room '{_config.RoomId}' at seat {_playerSlot}");
                    
                    await Task.Delay(500);
                    
                    await _hubConnection.InvokeAsync("SetBetValue", _config.BetAmount);
                    Console.WriteLine($"💰 Re-set bet value to {_config.BetAmount}");
                    Console.WriteLine($"✅ Reconnect workflow completed successfully");
                }
                else
                {
                    var message = result.TryGetProperty("message", out var msgProp) 
                        ? msgProp.GetString() 
                        : "Unknown error";
                    Console.WriteLine($"❌ Failed to re-join room after reconnect: {message}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Failed to re-join after reconnect: {ex.Message}");
            }
        };
    }

    private void RecordPayout(int fishId, int payout)
    {
        lock (_telemetryLock)
        {
            var unmatchedShots = _session.Shots
                .Where(s => !s.PayoutReceived.HasValue)
                .OrderByDescending(s => s.Timestamp)
                .Take(20)
                .ToList();

            ShotRecord? matchedShot = null;

            matchedShot = unmatchedShots
                .Where(s => s.TargetFishId.HasValue && s.TargetFishId.Value == fishId)
                .OrderByDescending(s => s.Timestamp)
                .FirstOrDefault();

            if (matchedShot == null)
            {
                var now = DateTime.UtcNow;
                matchedShot = unmatchedShots
                    .Where(s => (now - s.Timestamp).TotalSeconds < 5)
                    .OrderByDescending(s => s.Timestamp)
                    .FirstOrDefault();
                
                if (matchedShot != null && unmatchedShots.Count > 1)
                {
                    Console.WriteLine($"⚠️ Ambiguous payout match for fishId {fishId} - using timestamp proximity");
                }
            }

            if (matchedShot != null)
            {
                matchedShot.PayoutReceived = payout;
                matchedShot.FishTypeKilled = fishId;
                Console.WriteLine($"💰 Payout received: {payout} credits (fishId: {fishId})");
            }
            else
            {
                Console.WriteLine($"⚠️ Could not match payout {payout} for fishId {fishId} - no recent unmatched shots");
            }
        }
    }

    public SessionSnapshot GetSessionSnapshot()
    {
        lock (_telemetryLock)
        {
            var shotsCopy = _session.Shots.ToList();
            var currentCredits = _session.CurrentCredits;
            var startingCredits = _session.StartingCredits;
            
            var totalWagered = shotsCopy.Sum(s => s.BetAmount);
            var totalPaidOut = shotsCopy.Sum(s => s.PayoutReceived ?? 0);
            var totalShots = shotsCopy.Count;
            var hitCount = shotsCopy.Count(s => s.PayoutReceived.HasValue && s.PayoutReceived > 0);
            var currentRTP = totalWagered > 0 ? (double)totalPaidOut / totalWagered : 0;
            var hitRate = totalShots > 0 ? (double)hitCount / totalShots : 0;

            return new SessionSnapshot
            {
                CurrentCredits = currentCredits,
                StartingCredits = startingCredits,
                TotalWagered = totalWagered,
                TotalPaidOut = totalPaidOut,
                TotalShots = totalShots,
                HitCount = hitCount,
                CurrentRTP = currentRTP,
                HitRate = hitRate,
                StartTime = _session.StartTime,
                EndTime = _session.EndTime
            };
        }
    }

    public async Task DisconnectAsync()
    {
        if (_hubConnection != null)
        {
            await _hubConnection.StopAsync();
            await _hubConnection.DisposeAsync();
            _hubConnection = null;
            Console.WriteLine("🔌 Disconnected from SignalR");
        }
    }

    public async Task SaveSessionAsync(string? filePath = null)
    {
        _session.EndTime = DateTime.UtcNow;
        
        filePath ??= $"session-{DateTime.UtcNow:yyyyMMdd-HHmmss}.json";
        
        var json = JsonSerializer.Serialize(_session, new JsonSerializerOptions
        {
            WriteIndented = true
        });

        await File.WriteAllTextAsync(filePath, json);
        Console.WriteLine($"💾 Session saved to: {filePath}");
    }

    public async ValueTask DisposeAsync()
    {
        await DisconnectAsync();
        _httpClient.Dispose();
    }
}

public class SessionSnapshot
{
    public int CurrentCredits { get; set; }
    public int StartingCredits { get; set; }
    public int TotalWagered { get; set; }
    public int TotalPaidOut { get; set; }
    public int TotalShots { get; set; }
    public int HitCount { get; set; }
    public double CurrentRTP { get; set; }
    public double HitRate { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
}
