using System.Collections.Concurrent;
using System.Diagnostics;
using Microsoft.AspNetCore.SignalR;
using OceanKing.Server.Entities;
using OceanKing.Server.Managers;
using OceanKing.Hubs;

namespace OceanKing.Server;

public class MatchInstance
{
    public string MatchId { get; private set; }
    private readonly MatchManager _matchManager;
    private readonly IHubContext<GameHub> _hubContext;
    
    // Entity managers
    private readonly PlayerManager _playerManager;
    private readonly FishManager _fishManager;
    private readonly ProjectileManager _projectileManager;
    private readonly CollisionResolver _collisionResolver;
    
    // Boss system managers
    private readonly RoundManager _roundManager;
    private readonly KillSequenceHandler _killSequenceHandler;
    private readonly InteractionManager _interactionManager;
    
    // Game loop
    private Thread? _gameLoopThread;
    private bool _isRunning;
    private long _currentTick = 0;
    private const int TARGET_TPS = 30; // 30 ticks per second
    private const double MS_PER_TICK = 1000.0 / TARGET_TPS;
    
    // Hot seat system
    private long _lastHotSeatRotation = 0;
    private const int HOT_SEAT_DURATION_TICKS = 900; // 30 seconds at 30 TPS
    private const int HOT_SEAT_ROTATION_INTERVAL = 300; // Check every 10 seconds
    
    // Input queue (thread-safe)
    private readonly ConcurrentQueue<GameCommand> _commandQueue = new();
    
    private DateTime _lastPlayerCheckTime = DateTime.UtcNow;
    private const double EMPTY_ROOM_TIMEOUT_SECONDS = 60;

    public MatchInstance(string matchId, MatchManager matchManager, IHubContext<GameHub> hubContext)
    {
        MatchId = matchId;
        _matchManager = matchManager;
        _hubContext = hubContext;
        
        _playerManager = new PlayerManager();
        _fishManager = new FishManager();
        _projectileManager = new ProjectileManager();
        _collisionResolver = new CollisionResolver(_playerManager);
        
        _roundManager = new RoundManager();
        _killSequenceHandler = new KillSequenceHandler(_fishManager);
        _interactionManager = new InteractionManager();
    }

    public bool CanJoin() => _playerManager.GetPlayerCount() < MatchManager.MAX_PLAYERS_PER_MATCH;

    public void Start()
    {
        if (_isRunning) return;
        
        _isRunning = true;
        _roundManager.Initialize(_currentTick);
        
        _gameLoopThread = new Thread(GameLoop)
        {
            IsBackground = true,
            Name = $"GameLoop-{MatchId}"
        };
        _gameLoopThread.Start();
        
        Console.WriteLine($"Match {MatchId} started - Target TPS: {TARGET_TPS}");
    }

    public void Stop()
    {
        _isRunning = false;
        _gameLoopThread?.Join(1000);
        Console.WriteLine($"Match {MatchId} stopped");
    }

    private void GameLoop()
    {
        var stopwatch = Stopwatch.StartNew();
        var nextTickTime = stopwatch.Elapsed.TotalMilliseconds;

        while (_isRunning)
        {
            var currentTime = stopwatch.Elapsed.TotalMilliseconds;
            
            if (currentTime >= nextTickTime)
            {
                float deltaTime = (float)(MS_PER_TICK / 1000.0); // Convert to seconds
                ExecuteTick(deltaTime);
                
                nextTickTime += MS_PER_TICK;
                _currentTick++;
                
                // Prevent spiral of death - if we're too far behind, reset
                if (currentTime - nextTickTime > MS_PER_TICK * 5)
                {
                    nextTickTime = currentTime;
                }
            }
            else
            {
                // Sleep for a small amount to prevent CPU spinning
                var sleepTime = (int)(nextTickTime - currentTime);
                if (sleepTime > 0)
                {
                    Thread.Sleep(Math.Min(sleepTime, 1));
                }
            }
        }
    }

    private void ExecuteTick(float deltaTime)
    {
        // Step 1: Process all pending commands
        while (_commandQueue.TryDequeue(out var command))
        {
            ProcessCommand(command);
        }

        // Step 2: Update fish positions and remove despawned fish
        _fishManager.UpdateFish(deltaTime, _currentTick);

        // Step 3: Update projectiles
        _projectileManager.UpdateProjectiles(deltaTime);

        // Step 4: Collision detection
        var kills = _collisionResolver.ResolveCollisions(
            _projectileManager.GetActiveProjectiles(),
            _fishManager.GetActiveFish(),
            _killSequenceHandler,
            _interactionManager,
            _currentTick
        );

        // Step 5: Process non-boss kills and payouts
        foreach (var kill in kills)
        {
            ProcessKill(kill);
        }

        // Step 6: Process boss kill sequences
        var bossResults = _killSequenceHandler.ProcessSequences(_currentTick);
        foreach (var result in bossResults)
        {
            ProcessBossKillResult(result);
        }

        // Step 7: Check for interaction timeouts
        var timedOutInteractions = _interactionManager.CheckTimeouts(_currentTick);
        foreach (var interaction in timedOutInteractions)
        {
            _killSequenceHandler.ApplyInteractionResult(interaction.SequenceId, 0.7m);
        }

        // Step 8: Update round manager (checks fish count AFTER all removals)
        _roundManager.Update(_currentTick, _fishManager.GetActiveFish().Count);

        // Step 9: Spawn new fish continuously - no suppression
        var eligibleBosses = _roundManager.GetEligibleBosses();
        _fishManager.SpawnFishIfNeeded(_currentTick, eligibleBosses);
        
        // Step 10: Manage hot seats (random luck boosts for excitement)
        ManageHotSeats(_currentTick);

        // Step 11: Check for empty room timeout
        CheckEmptyRoomTimeout();

        // Step 12: Broadcast state delta
        BroadcastState();
    }

    private void ProcessCommand(GameCommand command)
    {
        switch (command.Type)
        {
            case CommandType.Fire:
                HandleFireCommand(command);
                break;
            case CommandType.SetBetValue:
                HandleSetBetValue(command);
                break;
        }
    }

    private void HandleFireCommand(GameCommand command)
    {
        var player = _playerManager.GetPlayer(command.PlayerId);
        if (player == null) return;

        // Validate fire rate
        if (!player.CanFire()) return;

        // Validate credits
        var cost = player.BetValue;
        if (player.Credits < cost) return;

        // Deduct credits immediately (authoritative)
        player.Credits -= cost;
        player.TotalSpent += cost;
        player.LastFireTime = DateTime.UtcNow;

        // Create projectile
        var projectile = new Projectile
        {
            OwnerPlayerId = player.PlayerId,
            WeaponTypeId = 0,
            X = command.X,
            Y = command.Y,
            DirectionX = command.DirectionX,
            DirectionY = command.DirectionY,
            Damage = 10f * player.CannonLevel
        };

        _projectileManager.AddProjectile(projectile);
    }

    private void HandleSetBetValue(GameCommand command)
    {
        var player = _playerManager.GetPlayer(command.PlayerId);
        if (player == null) return;

        // Clamp bet value between 10 and 200
        player.BetValue = Math.Clamp(command.BetValue, 10, 200);
    }

    private void ProcessKill(KillEvent kill)
    {
        var fish = _fishManager.GetFish(kill.FishId);
        var projectile = _projectileManager.GetProjectile(kill.ProjectileId);
        
        if (fish == null || projectile == null) return;

        var player = _playerManager.GetPlayer(projectile.OwnerPlayerId);
        if (player == null) return;

        // Simple death for non-boss fish (types 0-8): just award credits
        var multipliers = new[] { 1m, 2m, 3m, 5m, 10m, 20m };
        var weights = new[] { 70, 15, 8, 5, 1.5f, 0.5f };
        var totalWeight = weights.Sum();
        var randomValue = Random.Shared.NextSingle() * totalWeight;
        
        decimal multiplier = 1m;
        float cumulativeWeight = 0f;
        for (int i = 0; i < weights.Length; i++)
        {
            cumulativeWeight += weights[i];
            if (randomValue < cumulativeWeight)
            {
                multiplier = multipliers[i];
                break;
            }
        }

        var payout = fish.BaseValue * multiplier;
        player.Credits += payout;
        player.TotalEarned += payout;
        player.TotalKills++;

        _fishManager.RemoveFish(kill.FishId);

        Console.WriteLine($"Player {player.DisplayName} killed fish {fish.TypeId} for {payout} credits (x{multiplier})");
    }

    private void ProcessBossKillResult(BossKillResult result)
    {
        var player = _playerManager.GetPlayer(result.KillerPlayerId);
        if (player == null) return;

        if (result.TotalPayout > 0)
        {
            player.Credits += result.TotalPayout;
            player.TotalEarned += result.TotalPayout;
            
            Console.WriteLine($"Boss kill sequence payout: {player.DisplayName} earned {result.TotalPayout} credits from boss effect");
        }
    }

    public void HandleInteractionSubmission(string playerId, string interactionId, Dictionary<string, object> submissionData)
    {
        var result = _interactionManager.ProcessInteractionSubmission(interactionId, submissionData);
        if (result != null)
        {
            _killSequenceHandler.ApplyInteractionResult(result.SequenceId, result.PerformanceModifier);
        }
    }

    private void ManageHotSeats(long currentTick)
    {
        // Check if it's time to rotate hot seats
        if (currentTick - _lastHotSeatRotation < HOT_SEAT_ROTATION_INTERVAL)
            return;
            
        _lastHotSeatRotation = currentTick;
        
        var players = _playerManager.GetAllPlayers();
        if (players.Count == 0) return;
        
        // Find current hot seat player (max 1 at a time to maintain 95% RTP)
        var currentHotSeat = players.FirstOrDefault(p => p.IsHotSeat);
        
        // Check if current hot seat has expired
        if (currentHotSeat != null && currentTick >= currentHotSeat.HotSeatExpiryTick)
        {
            currentHotSeat.IsHotSeat = false;
            currentHotSeat.LuckMultiplier = 1.0f;
            Console.WriteLine($"Hot seat expired for {currentHotSeat.DisplayName}");
            currentHotSeat = null;
        }
        
        // If no active hot seat, heavily rotate to random players for excitement
        // Note: LuckMultiplier stays at 1.0 to maintain exactly 95% RTP
        // The hot seat is purely visual/psychological - creates excitement without breaking RTP balance
        if (currentHotSeat == null && Random.Shared.Next(100) < 70) // 70% chance - frequent rotation for excitement
        {
            var eligiblePlayers = players.Where(p => !p.IsHotSeat).ToList();
            if (eligiblePlayers.Count > 0)
            {
                var luckyPlayer = eligiblePlayers[Random.Shared.Next(eligiblePlayers.Count)];
                luckyPlayer.IsHotSeat = true;
                luckyPlayer.LuckMultiplier = 1.0f; // No actual odds boost - maintains 95% RTP exactly
                luckyPlayer.HotSeatExpiryTick = currentTick + HOT_SEAT_DURATION_TICKS;
                Console.WriteLine($"🔥 HOT SEAT activated for {luckyPlayer.DisplayName} for 30 seconds!");
            }
        }
    }
    
    private void CheckEmptyRoomTimeout()
    {
        if (_playerManager.GetPlayerCount() == 0)
        {
            var timeSinceLastCheck = (DateTime.UtcNow - _lastPlayerCheckTime).TotalSeconds;
            if (timeSinceLastCheck > EMPTY_ROOM_TIMEOUT_SECONDS)
            {
                Console.WriteLine($"Match {MatchId} empty for {EMPTY_ROOM_TIMEOUT_SECONDS}s - shutting down");
                _matchManager.RemoveMatch(MatchId);
            }
        }
        else
        {
            _lastPlayerCheckTime = DateTime.UtcNow;
        }
    }

    private void BroadcastState()
    {
        var roundState = _roundManager.GetRoundState();
        var activeSequences = _killSequenceHandler.GetActiveSequences();
        
        var delta = new StateDelta
        {
            TickId = _currentTick,
            RoundNumber = roundState.RoundNumber,
            TimeRemainingTicks = _roundManager.GetTimeRemainingTicks(_currentTick),
            IsRoundTransitioning = false,
            Players = _playerManager.GetAllPlayers().Select(p => new PlayerState
            {
                PlayerId = p.PlayerId,
                DisplayName = p.DisplayName,
                Credits = p.Credits,
                CannonLevel = p.CannonLevel,
                PlayerSlot = p.PlayerSlot,
                TotalKills = p.TotalKills
            }).ToList(),
            Fish = _fishManager.GetActiveFish().Select(f => new FishState
            {
                FishId = f.FishId,
                TypeId = f.TypeId,
                X = f.X,
                Y = f.Y
            }).ToList(),
            Projectiles = _projectileManager.GetActiveProjectiles().Select(p => new ProjectileState
            {
                ProjectileId = p.ProjectileId,
                X = p.X,
                Y = p.Y,
                DirectionX = p.DirectionX,
                DirectionY = p.DirectionY
            }).ToList(),
            ActiveBossSequences = activeSequences.Select(s => new BossSequenceState
            {
                SequenceId = s.SequenceId,
                BossTypeId = s.BossTypeId,
                EffectType = s.EffectType.ToString(),
                CurrentStep = s.CurrentStep
            }).ToList()
        };

        foreach (var player in _playerManager.GetAllPlayers())
        {
            var pendingInteraction = _interactionManager.GetPendingInteraction(player.PlayerId);
            if (pendingInteraction != null)
            {
                delta.PendingInteractions.Add(new InteractionState
                {
                    InteractionId = pendingInteraction.InteractionId,
                    PlayerId = pendingInteraction.PlayerId,
                    InteractionType = pendingInteraction.InteractionType,
                    InteractionData = pendingInteraction.InteractionData
                });
            }
        }

        _ = _hubContext.Clients.Group(MatchId).SendAsync("StateDelta", delta);
    }

    public void EnqueueCommand(GameCommand command)
    {
        _commandQueue.Enqueue(command);
    }

    public Player? AddPlayer(string playerId, string displayName, string connectionId)
    {
        return _playerManager.AddPlayer(playerId, displayName, connectionId);
    }

    public void RemovePlayer(string playerId)
    {
        _playerManager.RemovePlayer(playerId);
    }

    public Player? GetPlayer(string playerId)
    {
        return _playerManager.GetPlayer(playerId);
    }
}

// Command and state classes
public class GameCommand
{
    public CommandType Type { get; set; }
    public string PlayerId { get; set; } = string.Empty;
    public float X { get; set; }
    public float Y { get; set; }
    public float DirectionX { get; set; }
    public float DirectionY { get; set; }
    public int BetValue { get; set; }
}

public enum CommandType
{
    Fire,
    SetBetValue
}

public class StateDelta
{
    public long TickId { get; set; }
    public int RoundNumber { get; set; }
    public long TimeRemainingTicks { get; set; }
    public bool IsRoundTransitioning { get; set; }
    public List<PlayerState> Players { get; set; } = new();
    public List<FishState> Fish { get; set; } = new();
    public List<ProjectileState> Projectiles { get; set; } = new();
    public List<BossSequenceState> ActiveBossSequences { get; set; } = new();
    public List<InteractionState> PendingInteractions { get; set; } = new();
}

public class BossSequenceState
{
    public string SequenceId { get; set; } = string.Empty;
    public int BossTypeId { get; set; }
    public string EffectType { get; set; } = string.Empty;
    public int CurrentStep { get; set; }
}

public class InteractionState
{
    public string InteractionId { get; set; } = string.Empty;
    public string PlayerId { get; set; } = string.Empty;
    public string InteractionType { get; set; } = string.Empty;
    public Dictionary<string, object> InteractionData { get; set; } = new();
}

public class PlayerState
{
    public string PlayerId { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public decimal Credits { get; set; }
    public int CannonLevel { get; set; }
    public int PlayerSlot { get; set; }
    public int TotalKills { get; set; }
}

public class FishState
{
    public string FishId { get; set; } = string.Empty;
    public int TypeId { get; set; }
    public float X { get; set; }
    public float Y { get; set; }
}

public class ProjectileState
{
    public string ProjectileId { get; set; } = string.Empty;
    public float X { get; set; }
    public float Y { get; set; }
    public float DirectionX { get; set; }
    public float DirectionY { get; set; }
}

public class KillEvent
{
    public string FishId { get; set; } = string.Empty;
    public string ProjectileId { get; set; } = string.Empty;
}
