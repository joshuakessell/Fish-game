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

            // Wait 200ms for payout (payouts arrive almost instantly, this is just a safety buffer)
            var payoutReceived = await _payoutSignal.WaitAsync(TimeSpan.FromMilliseconds(200));
            
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
            List<FishPosition> targetFish;
            
            if (_config.BossTargetingOnly)
            {
                targetFish = _currentFish.Where(f => f.TypeId >= 2).ToList();
                
                if (targetFish.Count == 0)
                {
                    return (_random.Next(100, 1700), _random.Next(100, 800), null);
                }
            }
            else
            {
                targetFish = _currentFish;
            }
            
            var fish = targetFish[_random.Next(targetFish.Count)];
            return (fish.X, fish.Y, fish.FishId);
        }

        return (_random.Next(100, 1700), _random.Next(100, 800), null);
    }

    private void SetupSignalRHandlers()
    {
        if (_hubConnection == null) return;

        _hubConnection.On<StateDelta>("StateDelta", (stateDelta) =>
        {
            foreach (var payoutEvent in stateDelta.PayoutEvents)
            {
                Console.WriteLine($"💰 Payout received: FishId={payoutEvent.FishId}, Payout={payoutEvent.Payout}, PlayerSlot={payoutEvent.PlayerSlot}");
                
                if (payoutEvent.PlayerSlot == _playerSlot && _pendingShot != null)
                {
                    _pendingShot.PayoutReceived = payoutEvent.Payout;
                    _pendingShot.FishTypeKilled = payoutEvent.FishId;
                    
                    Console.WriteLine($"✅ Matched payout to pending shot: {payoutEvent.Payout} credits for fish {payoutEvent.FishId}");
                    
                    if (_payoutSignal.CurrentCount == 0)
                    {
                        _payoutSignal.Release();
                    }
                }
            }

            _currentFish = stateDelta.Fish.Select(f => new FishPosition
            {
                FishId = f.id,
                TypeId = f.type,
                X = f.x,
                Y = f.y
            }).ToList();

            var myPlayer = stateDelta.Players.FirstOrDefault(p => p.PlayerSlot == _playerSlot);
            if (myPlayer != null)
            {
                _session.CurrentCredits = (int)myPlayer.Credits;
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
