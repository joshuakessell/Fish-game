using Microsoft.AspNetCore.SignalR.Client;
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
    
    private List<FishPosition> _currentFish = new();
    private ShotRecord? _pendingShot = null;
    private readonly SemaphoreSlim _payoutSignal = new(0, 1);
    
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

    public async Task<ShotRecord> FireShotAndWaitForPayoutAsync()
    {
        if (_hubConnection == null || !IsConnected)
        {
            throw new InvalidOperationException("Not connected");
        }

        var (x, y, targetFishId) = SelectTarget();
        var nonce = Guid.NewGuid().ToString();

        var shot = new ShotRecord
        {
            Timestamp = DateTime.UtcNow,
            BetAmount = _config.BetAmount,
            TargetX = x,
            TargetY = y,
            Nonce = nonce,
            TargetFishId = targetFishId
        };

        _pendingShot = shot;

        try
        {
            var dirX = 0f;
            var dirY = -1f;

            await _hubConnection.InvokeAsync("Fire", x, y, dirX, dirY, nonce, targetFishId);

            var payoutReceived = await _payoutSignal.WaitAsync(TimeSpan.FromSeconds(2));
            
            if (!payoutReceived)
            {
                shot.PayoutReceived = null;
                shot.FishTypeKilled = null;
            }

            _session.Shots.Add(shot);
            _pendingShot = null;
            
            return shot;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Fire error: {ex.Message}");
            _pendingShot = null;
            throw;
        }
    }

    private (float x, float y, int? fishId) SelectTarget()
    {
        if (_currentFish.Count > 0)
        {
            var fish = _currentFish[_random.Next(_currentFish.Count)];
            return (fish.X, fish.Y, fish.FishId);
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

                    _currentFish = newFishList;
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

                            if (playerSlot == _playerSlot && _pendingShot != null)
                            {
                                _pendingShot.PayoutReceived = payout;
                                _pendingShot.FishTypeKilled = fishId;
                                
                                if (_payoutSignal.CurrentCount == 0)
                                {
                                    _payoutSignal.Release();
                                }
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
                                    _session.CurrentCredits = Convert.ToInt32(playerDict["Credits"]!);
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
            Console.WriteLine("Bot will exit. Please restart if you want to continue.");
        };
    }

    public async Task SaveSessionAsync()
    {
        _session.EndTime = DateTime.UtcNow;
        
        var fileName = $"session-{_session.StartTime:yyyyMMdd-HHmmss}.json";
        var json = JsonSerializer.Serialize(_session, new JsonSerializerOptions 
        { 
            WriteIndented = true 
        });
        
        await File.WriteAllTextAsync(fileName, json);
        Console.WriteLine($"✅ Session saved to: {fileName}");
    }

    public async ValueTask DisposeAsync()
    {
        if (_hubConnection != null)
        {
            await _hubConnection.DisposeAsync();
        }
        
        _httpClient.Dispose();
        _payoutSignal.Dispose();
    }
}
