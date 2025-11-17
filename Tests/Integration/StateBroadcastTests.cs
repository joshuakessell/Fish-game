using Xunit;
using FluentAssertions;
using OceanKing.Server.Managers;
using MessagePack;

namespace Tests.Integration;

public class StateBroadcastTests
{
    [Fact]
    public void StateDelta_Serialization_ShouldPreserveData()
    {
        var delta = new StateDelta
        {
            Tick = 100,
            RoundNumber = 1,
            TimeRemainingTicks = 3000,
            IsRoundTransitioning = false,
            Players = new List<PlayerState>
            {
                new PlayerState
                {
                    PlayerId = "player1",
                    DisplayName = "Test Player",
                    Credits = 1500m,
                    CannonLevel = 1,
                    PlayerSlot = 0,
                    TotalKills = 5,
                    BetValue = 20
                }
            },
            Fish = new List<FishState>
            {
                new FishState
                {
                    id = 1,
                    type = 0,
                    x = 500,
                    y = 400,
                    path = null,
                    isNewSpawn = true
                }
            },
            Projectiles = new List<ProjectileState>
            {
                new ProjectileState
                {
                    id = 1,
                    x = 600,
                    y = 300,
                    directionX = 0,
                    directionY = -1,
                    ownerId = "player1",
                    clientNonce = "nonce1",
                    targetFishId = null
                }
            },
            PayoutEvents = new List<KillPayoutEvent>
            {
                new KillPayoutEvent
                {
                    FishId = 1,
                    Payout = 50,
                    PlayerSlot = 0
                }
            }
        };

        var serialized = MessagePackSerializer.Serialize(delta);
        var deserialized = MessagePackSerializer.Deserialize<StateDelta>(serialized);

        deserialized.Should().NotBeNull();
        deserialized.Tick.Should().Be(100);
        deserialized.Players.Should().HaveCount(1);
        deserialized.Fish.Should().HaveCount(1);
        deserialized.Projectiles.Should().HaveCount(1);
        deserialized.PayoutEvents.Should().HaveCount(1);
    }

    [Fact]
    public void PlayerState_Serialization_ShouldPreserveAllFields()
    {
        var playerState = new PlayerState
        {
            PlayerId = "player123",
            DisplayName = "John Doe",
            Credits = 2500.50m,
            CannonLevel = 3,
            PlayerSlot = 2,
            TotalKills = 42,
            BetValue = 50
        };

        var serialized = MessagePackSerializer.Serialize(playerState);
        var deserialized = MessagePackSerializer.Deserialize<PlayerState>(serialized);

        deserialized.PlayerId.Should().Be("player123");
        deserialized.DisplayName.Should().Be("John Doe");
        deserialized.Credits.Should().Be(2500.50m);
        deserialized.CannonLevel.Should().Be(3);
        deserialized.PlayerSlot.Should().Be(2);
        deserialized.TotalKills.Should().Be(42);
        deserialized.BetValue.Should().Be(50);
    }

    [Fact]
    public void FishState_Serialization_ShouldPreserveAllFields()
    {
        var fishState = new FishState
        {
            id = 42,
            type = 12,
            x = 750.5f,
            y = 450.25f,
            path = null,
            isNewSpawn = false
        };

        var serialized = MessagePackSerializer.Serialize(fishState);
        var deserialized = MessagePackSerializer.Deserialize<FishState>(serialized);

        deserialized.id.Should().Be(42);
        deserialized.type.Should().Be(12);
        deserialized.x.Should().Be(750.5f);
        deserialized.y.Should().Be(450.25f);
        deserialized.isNewSpawn.Should().BeFalse();
    }

    [Fact]
    public void ProjectileState_Serialization_ShouldPreserveAllFields()
    {
        var projectileState = new ProjectileState
        {
            id = 99,
            x = 800,
            y = 600,
            directionX = 0.707f,
            directionY = -0.707f,
            ownerId = "player456",
            clientNonce = "nonce-abc123",
            targetFishId = 15
        };

        var serialized = MessagePackSerializer.Serialize(projectileState);
        var deserialized = MessagePackSerializer.Deserialize<ProjectileState>(serialized);

        deserialized.id.Should().Be(99);
        deserialized.x.Should().Be(800);
        deserialized.y.Should().Be(600);
        deserialized.directionX.Should().BeApproximately(0.707f, 0.001f);
        deserialized.directionY.Should().BeApproximately(-0.707f, 0.001f);
        deserialized.ownerId.Should().Be("player456");
        deserialized.clientNonce.Should().Be("nonce-abc123");
        deserialized.targetFishId.Should().Be(15);
    }

    [Fact]
    public void KillPayoutEvent_Serialization_ShouldPreserveAllFields()
    {
        var payoutEvent = new KillPayoutEvent
        {
            FishId = 123,
            Payout = 500,
            PlayerSlot = 3
        };

        var serialized = MessagePackSerializer.Serialize(payoutEvent);
        var deserialized = MessagePackSerializer.Deserialize<KillPayoutEvent>(serialized);

        deserialized.FishId.Should().Be(123);
        deserialized.Payout.Should().Be(500);
        deserialized.PlayerSlot.Should().Be(3);
    }

    [Fact]
    public void StateDelta_EmptyCollections_ShouldSerializeCorrectly()
    {
        var delta = new StateDelta
        {
            Tick = 50,
            RoundNumber = 1,
            TimeRemainingTicks = 2000,
            IsRoundTransitioning = false,
            Players = new List<PlayerState>(),
            Fish = new List<FishState>(),
            Projectiles = new List<ProjectileState>(),
            PayoutEvents = new List<KillPayoutEvent>()
        };

        var serialized = MessagePackSerializer.Serialize(delta);
        var deserialized = MessagePackSerializer.Deserialize<StateDelta>(serialized);

        deserialized.Players.Should().BeEmpty();
        deserialized.Fish.Should().BeEmpty();
        deserialized.Projectiles.Should().BeEmpty();
        deserialized.PayoutEvents.Should().BeEmpty();
    }

    [Fact]
    public void StateDelta_MultipleEntities_ShouldPreserveOrder()
    {
        var delta = new StateDelta
        {
            Tick = 200,
            RoundNumber = 2,
            TimeRemainingTicks = 1500,
            IsRoundTransitioning = false,
            Players = new List<PlayerState>
            {
                new PlayerState { PlayerId = "p1", DisplayName = "Player 1", Credits = 1000m, CannonLevel = 1, PlayerSlot = 0, TotalKills = 0, BetValue = 10 },
                new PlayerState { PlayerId = "p2", DisplayName = "Player 2", Credits = 2000m, CannonLevel = 2, PlayerSlot = 1, TotalKills = 5, BetValue = 20 },
                new PlayerState { PlayerId = "p3", DisplayName = "Player 3", Credits = 3000m, CannonLevel = 3, PlayerSlot = 2, TotalKills = 10, BetValue = 30 }
            }
        };

        var serialized = MessagePackSerializer.Serialize(delta);
        var deserialized = MessagePackSerializer.Deserialize<StateDelta>(serialized);

        deserialized.Players.Should().HaveCount(3);
        deserialized.Players[0].PlayerId.Should().Be("p1");
        deserialized.Players[1].PlayerId.Should().Be("p2");
        deserialized.Players[2].PlayerId.Should().Be("p3");
    }

    [Fact]
    public void StateDelta_LargePayload_ShouldSerializeEfficiently()
    {
        var delta = new StateDelta
        {
            Tick = 1000,
            RoundNumber = 5,
            TimeRemainingTicks = 500,
            IsRoundTransitioning = false,
            Players = Enumerable.Range(0, 6).Select(i => new PlayerState
            {
                PlayerId = $"player{i}",
                DisplayName = $"Player {i}",
                Credits = 1000m + i * 500,
                CannonLevel = 1,
                PlayerSlot = i,
                TotalKills = i * 2,
                BetValue = 10 + i * 5
            }).ToList(),
            Fish = Enumerable.Range(0, 30).Select(i => new FishState
            {
                id = i,
                type = i % 8,
                x = i * 60f,
                y = i * 30f,
                path = null,
                isNewSpawn = false
            }).ToList(),
            Projectiles = Enumerable.Range(0, 20).Select(i => new ProjectileState
            {
                id = i,
                x = i * 90f,
                y = i * 45f,
                directionX = 0,
                directionY = -1,
                ownerId = $"player{i % 6}",
                clientNonce = $"nonce{i}",
                targetFishId = null
            }).ToList()
        };

        var serialized = MessagePackSerializer.Serialize(delta);
        var deserialized = MessagePackSerializer.Deserialize<StateDelta>(serialized);

        deserialized.Players.Should().HaveCount(6);
        deserialized.Fish.Should().HaveCount(30);
        deserialized.Projectiles.Should().HaveCount(20);

        serialized.Length.Should().BeLessThan(10000, "MessagePack should compress data efficiently");
    }

    [Fact]
    public void BossSequenceState_Serialization_ShouldPreserveAllFields()
    {
        var bossSequence = new BossSequenceState
        {
            SequenceId = "seq-123",
            BossTypeId = 3,
            EffectType = "SectorBlast",
            CurrentStep = 2
        };

        var serialized = MessagePackSerializer.Serialize(bossSequence);
        var deserialized = MessagePackSerializer.Deserialize<BossSequenceState>(serialized);

        deserialized.SequenceId.Should().Be("seq-123");
        deserialized.BossTypeId.Should().Be(3);
        deserialized.EffectType.Should().Be("SectorBlast");
        deserialized.CurrentStep.Should().Be(2);
    }

    [Fact]
    public void InteractionState_Serialization_ShouldPreserveAllFields()
    {
        var interactionState = new InteractionState
        {
            InteractionId = "int-456",
            PlayerId = "player1",
            InteractionType = "QTE_TEETH",
            InteractionData = new Dictionary<string, object>
            {
                ["required"] = 5,
                ["timeout"] = 3000
            }
        };

        var serialized = MessagePackSerializer.Serialize(interactionState);
        var deserialized = MessagePackSerializer.Deserialize<InteractionState>(serialized);

        deserialized.InteractionId.Should().Be("int-456");
        deserialized.PlayerId.Should().Be("player1");
        deserialized.InteractionType.Should().Be("QTE_TEETH");
        deserialized.InteractionData.Should().ContainKey("required");
    }

    [Fact]
    public void StateDelta_WithNullValues_ShouldHandleGracefully()
    {
        var delta = new StateDelta
        {
            Tick = 100,
            RoundNumber = 1,
            TimeRemainingTicks = 3000,
            IsRoundTransitioning = false,
            Projectiles = new List<ProjectileState>
            {
                new ProjectileState
                {
                    id = 1,
                    x = 100,
                    y = 200,
                    directionX = 0,
                    directionY = -1,
                    ownerId = "player1",
                    clientNonce = "",
                    targetFishId = null
                }
            }
        };

        var serialized = MessagePackSerializer.Serialize(delta);
        var deserialized = MessagePackSerializer.Deserialize<StateDelta>(serialized);

        deserialized.Projectiles[0].targetFishId.Should().BeNull();
        deserialized.Projectiles[0].clientNonce.Should().Be("");
    }
}
