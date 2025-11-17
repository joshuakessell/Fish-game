using Xunit;
using FluentAssertions;
using Moq;
using OceanKing.Server.Managers;
using OceanKing.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace Tests.Integration;

public class MatchInstanceTests : IDisposable
{
    private readonly List<MatchInstance> _matchInstances = new();
    private readonly List<object> _capturedBroadcasts = new();
    private int _stateDeltaBroadcastCount = 0;
    private TaskCompletionSource<bool>? _stateDeltaCompletion;

    private MatchInstance CreateMatchInstance(bool isSolo = false, int? randomSeed = null)
    {
        var mockHubContext = new Mock<IHubContext<GameHub>>();
        var mockClientProxy = new Mock<IClientProxy>();
        
        mockClientProxy
            .Setup(x => x.SendCoreAsync(It.IsAny<string>(), It.IsAny<object?[]>(), It.IsAny<CancellationToken>()))
            .Callback<string, object?[], CancellationToken>((method, args, token) =>
            {
                _capturedBroadcasts.Add(new { Method = method, Args = args });
                
                if (method == "StateDelta")
                {
                    _stateDeltaBroadcastCount++;
                    _stateDeltaCompletion?.TrySetResult(true);
                }
            })
            .Returns(Task.CompletedTask);
        
        mockHubContext.Setup(x => x.Clients.Group(It.IsAny<string>()))
            .Returns(mockClientProxy.Object);
        
        var matchManager = new MatchManager(mockHubContext.Object);
        var random = randomSeed.HasValue ? new Random(randomSeed.Value) : null;
        var match = new MatchInstance("test-match", matchManager, mockHubContext.Object, isSolo, random);
        
        _matchInstances.Add(match);
        return match;
    }

    public void Dispose()
    {
        foreach (var match in _matchInstances)
        {
            match.Stop();
        }
    }

    [Fact]
    public void Constructor_ShouldInitializeMatchInstance()
    {
        var match = CreateMatchInstance();

        match.Should().NotBeNull();
        match.MatchId.Should().Be("test-match");
    }

    [Fact]
    public void IsSolo_ReturnsTrueForSoloMatch()
    {
        var soloMatch = CreateMatchInstance(isSolo: true);
        var multiMatch = CreateMatchInstance(isSolo: false);

        soloMatch.IsSolo().Should().BeTrue();
        multiMatch.IsSolo().Should().BeFalse();
    }

    [Fact]
    public void CanJoin_SoloMatch_ShouldReturnFalse()
    {
        var match = CreateMatchInstance(isSolo: true);

        match.CanJoin().Should().BeFalse("solo matches should not allow joining");
    }

    [Fact]
    public void CanJoin_EmptyMatch_ShouldReturnTrue()
    {
        var match = CreateMatchInstance(isSolo: false);

        match.CanJoin().Should().BeTrue("empty matches should allow joining");
    }

    [Fact]
    public void AddPlayer_ShouldAddPlayerToMatch()
    {
        var match = CreateMatchInstance();

        var player = match.AddPlayer("player1", "Test Player", "conn1");

        player.Should().NotBeNull();
        player!.PlayerId.Should().Be("player1");
        player.DisplayName.Should().Be("Test Player");
    }

    [Fact]
    public void AddPlayer_WithSeatIndex_ShouldAssignSeat()
    {
        var match = CreateMatchInstance();

        var player = match.AddPlayer("player1", "Test Player", "conn1", seatIndex: 2);

        player.Should().NotBeNull();
        player!.PlayerSlot.Should().Be(2);
    }

    [Fact]
    public void AddPlayer_DuplicateSeat_ShouldReturnNull()
    {
        var match = CreateMatchInstance();

        var player1 = match.AddPlayer("player1", "Player 1", "conn1", seatIndex: 2);
        var player2 = match.AddPlayer("player2", "Player 2", "conn2", seatIndex: 2);

        player1.Should().NotBeNull();
        player2.Should().BeNull("duplicate seat should be rejected");
    }

    [Fact]
    public void RemovePlayer_ShouldRemovePlayerFromMatch()
    {
        var match = CreateMatchInstance();

        match.AddPlayer("player1", "Test Player", "conn1");
        match.RemovePlayer("player1");

        var player = match.GetPlayer("player1");
        player.Should().BeNull("player should be removed");
    }

    [Fact]
    public void GetPlayerCount_ShouldReturnCorrectCount()
    {
        var match = CreateMatchInstance();

        match.GetPlayerCount().Should().Be(0);

        match.AddPlayer("player1", "Player 1", "conn1");
        match.GetPlayerCount().Should().Be(1);

        match.AddPlayer("player2", "Player 2", "conn2");
        match.GetPlayerCount().Should().Be(2);

        match.RemovePlayer("player1");
        match.GetPlayerCount().Should().Be(1);
    }

    [Fact]
    public void GetAvailableSlots_ShouldReturnUnoccupiedSlots()
    {
        var match = CreateMatchInstance();

        match.AddPlayer("player1", "Player 1", "conn1", seatIndex: 0);
        match.AddPlayer("player2", "Player 2", "conn2", seatIndex: 2);

        var availableSlots = match.GetAvailableSlots();

        availableSlots.Should().NotContain(0);
        availableSlots.Should().NotContain(2);
        availableSlots.Should().Contain(new[] { 1, 3, 4, 5 });
    }

    [Fact]
    public void AssignPlayerSlot_ValidSlot_ShouldReturnTrue()
    {
        var match = CreateMatchInstance();

        match.AddPlayer("player1", "Test Player", "conn1");
        var result = match.AssignPlayerSlot("player1", 3);

        result.Should().BeTrue();

        var player = match.GetPlayer("player1");
        player!.PlayerSlot.Should().Be(3);
    }

    [Fact]
    public void AssignPlayerSlot_OccupiedSlot_ShouldReturnFalse()
    {
        var match = CreateMatchInstance();

        match.AddPlayer("player1", "Player 1", "conn1", seatIndex: 2);
        match.AddPlayer("player2", "Player 2", "conn2");

        var result = match.AssignPlayerSlot("player2", 2);

        result.Should().BeFalse("occupied slot should be rejected");
    }

    [Fact]
    public async Task EnqueueCommand_ShouldProcessFireCommand()
    {
        _capturedBroadcasts.Clear();
        _stateDeltaBroadcastCount = 0;
        var match = CreateMatchInstance(randomSeed: 42);
        match.Start();
        
        await Task.Delay(100);

        var player = match.AddPlayer("player1", "Test Player", "conn1", seatIndex: 0);
        player!.Credits = 1000m;
        player.BetValue = 10;

        var initialCredits = player.Credits;
        
        _stateDeltaCompletion = new TaskCompletionSource<bool>();

        var command = new GameCommand
        {
            Type = CommandType.Fire,
            PlayerId = "player1",
            X = 900,
            Y = 450,
            DirectionX = 0,
            DirectionY = -1,
            BetValue = 10,
            ClientNonce = "test-nonce"
        };

        match.EnqueueCommand(command);

        await _stateDeltaCompletion.Task.WaitAsync(TimeSpan.FromSeconds(2));

        var updatedPlayer = match.GetPlayer("player1");
        updatedPlayer.Should().NotBeNull();
        updatedPlayer!.Credits.Should().Be(initialCredits - 10, "firing with bet value 10 should deduct exactly 10 credits");
        
        _capturedBroadcasts.Should().NotBeEmpty("state updates should be broadcast to clients");
        
        var stateBroadcasts = _capturedBroadcasts
            .Where(b => 
            {
                var broadcastType = b.GetType();
                var methodProp = broadcastType.GetProperty("Method");
                return methodProp?.GetValue(b)?.ToString() == "StateDelta";
            })
            .ToList();
        
        stateBroadcasts.Should().NotBeEmpty("StateDelta should be broadcast");
    }

    [Fact]
    public async Task EnqueueCommand_SetBetValue_ShouldUpdatePlayerBet()
    {
        _capturedBroadcasts.Clear();
        _stateDeltaBroadcastCount = 0;
        var match = CreateMatchInstance(randomSeed: 42);
        match.Start();
        
        await Task.Delay(100);

        var player = match.AddPlayer("player1", "Test Player", "conn1", seatIndex: 0);
        player!.BetValue.Should().Be(10, "default bet value should be 10");
        
        _stateDeltaCompletion = new TaskCompletionSource<bool>();

        var command = new GameCommand
        {
            Type = CommandType.SetBetValue,
            PlayerId = "player1",
            BetValue = 50
        };

        match.EnqueueCommand(command);

        await _stateDeltaCompletion.Task.WaitAsync(TimeSpan.FromSeconds(2));

        var updatedPlayer = match.GetPlayer("player1");
        updatedPlayer!.BetValue.Should().Be(50, "bet value should be updated to exactly 50");
        
        _capturedBroadcasts.Should().NotBeEmpty("state updates should be broadcast");
    }

    [Fact]
    public async Task Start_ShouldInitializeGameLoop()
    {
        _stateDeltaCompletion = new TaskCompletionSource<bool>();
        var match = CreateMatchInstance();

        match.Start();

        await _stateDeltaCompletion.Task.WaitAsync(TimeSpan.FromSeconds(1));

        match.Stop();
    }

    [Fact]
    public async Task Stop_ShouldTerminateGameLoop()
    {
        _stateDeltaCompletion = new TaskCompletionSource<bool>();
        var match = CreateMatchInstance();

        match.Start();
        await _stateDeltaCompletion.Task.WaitAsync(TimeSpan.FromSeconds(1));
        match.Stop();

        await Task.Delay(50);
    }

    [Fact]
    public async Task GameLoop_MultiPlayer_ShouldHandleMultiplePlayers()
    {
        _stateDeltaCompletion = new TaskCompletionSource<bool>();
        var match = CreateMatchInstance();
        match.Start();

        match.AddPlayer("player1", "Player 1", "conn1", seatIndex: 0);
        match.AddPlayer("player2", "Player 2", "conn2", seatIndex: 1);
        match.AddPlayer("player3", "Player 3", "conn3", seatIndex: 2);

        await _stateDeltaCompletion.Task.WaitAsync(TimeSpan.FromSeconds(1));

        match.GetPlayerCount().Should().Be(3);

        match.Stop();
    }

    [Fact]
    public async Task GameLoop_ShouldSpawnFish()
    {
        _capturedBroadcasts.Clear();
        _stateDeltaCompletion = new TaskCompletionSource<bool>();
        var match = CreateMatchInstance(randomSeed: 123);
        match.Start();

        await _stateDeltaCompletion.Task.WaitAsync(TimeSpan.FromSeconds(2));

        match.Stop();
        
        var stateBroadcasts = _capturedBroadcasts
            .Where(b => 
            {
                var broadcastType = b.GetType();
                var methodProp = broadcastType.GetProperty("Method");
                return methodProp?.GetValue(b)?.ToString() == "StateDelta";
            })
            .ToList();
        
        stateBroadcasts.Should().NotBeEmpty("game loop should broadcast StateDelta updates containing fish spawns");
    }

    [Fact]
    public void GetAllPlayers_ShouldReturnAllActivePlayers()
    {
        var match = CreateMatchInstance();

        match.AddPlayer("player1", "Player 1", "conn1");
        match.AddPlayer("player2", "Player 2", "conn2");

        var players = match.GetAllPlayers();

        players.Should().HaveCount(2);
        players.Should().Contain(p => p.PlayerId == "player1");
        players.Should().Contain(p => p.PlayerId == "player2");
    }

    [Fact]
    public void HandleInteractionSubmission_ShouldProcessValidSubmission()
    {
        var match = CreateMatchInstance();

        var player = match.AddPlayer("player1", "Test Player", "conn1");

        var submissionData = new Dictionary<string, object>
        {
            ["choice"] = "option1"
        };

        match.HandleInteractionSubmission("player1", "interaction1", submissionData);
    }

    [Fact]
    public void CanJoin_FullMatch_ShouldReturnFalse()
    {
        var match = CreateMatchInstance();

        for (int i = 0; i < 6; i++)
        {
            match.AddPlayer($"player{i}", $"Player {i}", $"conn{i}", seatIndex: i);
        }

        match.CanJoin().Should().BeFalse("full match should not allow joining");
    }

    [Fact]
    public async Task Fire_InsufficientCredits_ShouldRejectCommand()
    {
        _capturedBroadcasts.Clear();
        var match = CreateMatchInstance(randomSeed: 42);
        match.Start();
        
        await Task.Delay(100);

        var player = match.AddPlayer("player1", "Test Player", "conn1", seatIndex: 0);
        player!.Credits = 5m;
        player.BetValue = 10;

        var command = new GameCommand
        {
            Type = CommandType.Fire,
            PlayerId = "player1",
            X = 900,
            Y = 450,
            DirectionX = 0,
            DirectionY = -1,
            BetValue = 10
        };

        match.EnqueueCommand(command);
        await Task.Delay(200);

        var updatedPlayer = match.GetPlayer("player1");
        updatedPlayer!.Credits.Should().Be(5m, "fire should be rejected when credits < bet");
    }

    [Fact]
    public async Task Fire_BetValueChanges_ShouldMatchCurrentBet()
    {
        _capturedBroadcasts.Clear();
        var match = CreateMatchInstance(randomSeed: 42);
        match.Start();
        
        await Task.Delay(100);

        var player = match.AddPlayer("player1", "Test Player", "conn1", seatIndex: 0);
        player!.Credits = 1000m;
        player.BetValue = 50;

        var command = new GameCommand
        {
            Type = CommandType.Fire,
            PlayerId = "player1",
            X = 900,
            Y = 450,
            DirectionX = 0,
            DirectionY = -1,
            BetValue = 50
        };

        match.EnqueueCommand(command);
        await Task.Delay(200);

        var updatedPlayer = match.GetPlayer("player1");
        updatedPlayer!.Credits.Should().Be(950m, "50 bet value should deduct 50 credits");
    }

    [Fact]
    public async Task Fire_MultipleConcurrentFires_ShouldProcessAll()
    {
        _capturedBroadcasts.Clear();
        var match = CreateMatchInstance(randomSeed: 42);
        match.Start();
        
        await Task.Delay(100);

        var player = match.AddPlayer("player1", "Test Player", "conn1", seatIndex: 0);
        player!.Credits = 1000m;
        player.BetValue = 10;

        var initialCredits = player.Credits;

        for (int i = 0; i < 5; i++)
        {
            match.EnqueueCommand(new GameCommand
            {
                Type = CommandType.Fire,
                PlayerId = "player1",
                X = 900,
                Y = 450,
                DirectionX = 0,
                DirectionY = -1,
                BetValue = 10,
                ClientNonce = $"nonce-{i}"
            });
        }

        await Task.Delay(300);

        var updatedPlayer = match.GetPlayer("player1");
        updatedPlayer!.Credits.Should().BeLessThan(initialCredits, "multiple fires should deduct credits");
    }

    [Fact]
    public async Task SetBetValue_ClampsBetween10And200()
    {
        _capturedBroadcasts.Clear();
        _stateDeltaBroadcastCount = 0;
        var match = CreateMatchInstance(randomSeed: 42);
        match.Start();
        
        await Task.Delay(100);

        var player = match.AddPlayer("player1", "Test Player", "conn1", seatIndex: 0);
        
        _stateDeltaCompletion = new TaskCompletionSource<bool>();

        match.EnqueueCommand(new GameCommand
        {
            Type = CommandType.SetBetValue,
            PlayerId = "player1",
            BetValue = 500
        });

        await _stateDeltaCompletion.Task.WaitAsync(TimeSpan.FromSeconds(2));

        var updatedPlayer = match.GetPlayer("player1");
        updatedPlayer!.BetValue.Should().Be(200, "bet value should be clamped to max 200");
    }

    [Fact]
    public async Task SetBetValue_ClampsMinimumBet()
    {
        _capturedBroadcasts.Clear();
        _stateDeltaBroadcastCount = 0;
        var match = CreateMatchInstance(randomSeed: 42);
        match.Start();
        
        await Task.Delay(100);

        var player = match.AddPlayer("player1", "Test Player", "conn1", seatIndex: 0);
        
        _stateDeltaCompletion = new TaskCompletionSource<bool>();

        match.EnqueueCommand(new GameCommand
        {
            Type = CommandType.SetBetValue,
            PlayerId = "player1",
            BetValue = 1
        });

        await _stateDeltaCompletion.Task.WaitAsync(TimeSpan.FromSeconds(2));

        var updatedPlayer = match.GetPlayer("player1");
        updatedPlayer!.BetValue.Should().Be(10, "bet value should be clamped to min 10");
    }

    [Fact]
    public async Task Fire_OutOfBounds_ShouldRejectCommand()
    {
        _capturedBroadcasts.Clear();
        var match = CreateMatchInstance(randomSeed: 42);
        match.Start();
        
        await Task.Delay(100);

        var player = match.AddPlayer("player1", "Test Player", "conn1", seatIndex: 0);
        player!.Credits = 1000m;
        var initialCredits = player.Credits;

        match.EnqueueCommand(new GameCommand
        {
            Type = CommandType.Fire,
            PlayerId = "player1",
            X = -100,
            Y = 450,
            DirectionX = 0,
            DirectionY = -1,
            BetValue = 10
        });

        await Task.Delay(200);

        var updatedPlayer = match.GetPlayer("player1");
        updatedPlayer!.Credits.Should().Be(initialCredits, "out of bounds fire should be rejected");
    }

    [Fact]
    public async Task Fire_NonExistentPlayer_ShouldNotCrash()
    {
        _capturedBroadcasts.Clear();
        var match = CreateMatchInstance(randomSeed: 42);
        match.Start();
        
        await Task.Delay(100);

        match.EnqueueCommand(new GameCommand
        {
            Type = CommandType.Fire,
            PlayerId = "nonexistent",
            X = 900,
            Y = 450,
            DirectionX = 0,
            DirectionY = -1,
            BetValue = 10
        });

        await Task.Delay(200);
    }

    [Fact]
    public async Task SetBetValue_NonExistentPlayer_ShouldNotCrash()
    {
        _capturedBroadcasts.Clear();
        var match = CreateMatchInstance(randomSeed: 42);
        match.Start();
        
        await Task.Delay(100);

        match.EnqueueCommand(new GameCommand
        {
            Type = CommandType.SetBetValue,
            PlayerId = "nonexistent",
            BetValue = 50
        });

        await Task.Delay(200);
    }

    [Fact]
    public void HandleInteractionSubmission_NonExistentPlayer_ShouldNotCrash()
    {
        var match = CreateMatchInstance();

        var submissionData = new Dictionary<string, object>
        {
            ["choice"] = "option1"
        };

        match.HandleInteractionSubmission("nonexistent", "interaction1", submissionData);
    }
}
