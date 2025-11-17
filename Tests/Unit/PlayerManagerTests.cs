using Xunit;
using FluentAssertions;
using OceanKing.Server.Managers;

namespace Tests.Unit;

public class PlayerManagerTests
{
    [Fact]
    public void AddPlayer_ShouldCreateNewPlayer()
    {
        var manager = new PlayerManager();

        var player = manager.AddPlayer("player1", "Test Player", "conn1");

        player.Should().NotBeNull();
        player!.PlayerId.Should().Be("player1");
        player.DisplayName.Should().Be("Test Player");
        player.ConnectionId.Should().Be("conn1");
        player.PlayerSlot.Should().Be(-1, "slot not assigned yet");
        player.HasSelectedSlot.Should().BeFalse();
        player.Credits.Should().Be(10000m, "default starting credits");
    }

    [Fact]
    public void AddPlayer_DuplicatePlayerId_ShouldReturnExisting()
    {
        var manager = new PlayerManager();

        var player1 = manager.AddPlayer("player1", "Player One", "conn1");
        var player2 = manager.AddPlayer("player1", "Player One Duplicate", "conn2");

        player1.Should().NotBeNull();
        player2.Should().NotBeNull();
        player1.Should().BeSameAs(player2, "duplicate playerId should return existing player");
        player2!.ConnectionId.Should().Be("conn1", "connection ID should remain from first add");
    }

    [Fact]
    public void AddPlayer_WhenFull_ShouldReturnNull()
    {
        var manager = new PlayerManager();

        for (int i = 0; i < 6; i++)
        {
            var player = manager.AddPlayer($"player{i}", $"Player {i}", $"conn{i}");
            player.Should().NotBeNull($"player {i} should be added");
        }

        var overflow = manager.AddPlayer("player7", "Player 7", "conn7");
        overflow.Should().BeNull("7th player exceeds capacity");
    }

    [Fact]
    public void GetPlayer_ExistingPlayer_ShouldReturn()
    {
        var manager = new PlayerManager();

        manager.AddPlayer("player1", "Test Player", "conn1");
        var retrieved = manager.GetPlayer("player1");

        retrieved.Should().NotBeNull();
        retrieved!.PlayerId.Should().Be("player1");
    }

    [Fact]
    public void GetPlayer_NonExistentPlayer_ShouldReturnNull()
    {
        var manager = new PlayerManager();

        var result = manager.GetPlayer("nonexistent");

        result.Should().BeNull();
    }

    [Fact]
    public void RemovePlayer_ShouldRemoveFromDictionary()
    {
        var manager = new PlayerManager();

        manager.AddPlayer("player1", "Test Player", "conn1");
        manager.RemovePlayer("player1");

        var retrieved = manager.GetPlayer("player1");
        retrieved.Should().BeNull("removed player should not be found");
    }

    [Fact]
    public void RemovePlayer_NonExistentPlayer_ShouldNotThrow()
    {
        var manager = new PlayerManager();

        Action action = () => manager.RemovePlayer("nonexistent");

        action.Should().NotThrow();
    }

    [Fact]
    public void GetPlayerCount_ShouldReturnCorrectCount()
    {
        var manager = new PlayerManager();

        manager.GetPlayerCount().Should().Be(0);

        manager.AddPlayer("player1", "Player 1", "conn1");
        manager.GetPlayerCount().Should().Be(1);

        manager.AddPlayer("player2", "Player 2", "conn2");
        manager.GetPlayerCount().Should().Be(2);

        manager.RemovePlayer("player1");
        manager.GetPlayerCount().Should().Be(1);
    }

    [Fact]
    public void GetAllPlayers_ShouldReturnAllActivePlayers()
    {
        var manager = new PlayerManager();

        manager.AddPlayer("player1", "Player 1", "conn1");
        manager.AddPlayer("player2", "Player 2", "conn2");

        var players = manager.GetAllPlayers();

        players.Should().HaveCount(2);
        players.Should().Contain(p => p.PlayerId == "player1");
        players.Should().Contain(p => p.PlayerId == "player2");
    }

    [Fact]
    public void GetAllPlayers_EmptyManager_ShouldReturnEmptyList()
    {
        var manager = new PlayerManager();

        var players = manager.GetAllPlayers();

        players.Should().NotBeNull();
        players.Should().BeEmpty();
    }

    [Fact]
    public void GetAvailableSlots_EmptyManager_ShouldReturnAllSlots()
    {
        var manager = new PlayerManager();

        var slots = manager.GetAvailableSlots();

        slots.Should().HaveCount(6);
        slots.Should().BeEquivalentTo(new[] { 0, 1, 2, 3, 4, 5 });
    }

    [Fact]
    public void GetAvailableSlots_WithOccupiedSlots_ShouldReturnOnlyAvailable()
    {
        var manager = new PlayerManager();

        var player1 = manager.AddPlayer("player1", "Player 1", "conn1");
        var player2 = manager.AddPlayer("player2", "Player 2", "conn2");
        
        manager.AssignPlayerSlot("player1", 0);
        manager.AssignPlayerSlot("player2", 3);

        var slots = manager.GetAvailableSlots();

        slots.Should().HaveCount(4);
        slots.Should().NotContain(0);
        slots.Should().NotContain(3);
        slots.Should().Contain(new[] { 1, 2, 4, 5 });
    }

    [Fact]
    public void AssignPlayerSlot_ValidSlot_ShouldReturnTrue()
    {
        var manager = new PlayerManager();

        manager.AddPlayer("player1", "Test Player", "conn1");
        var result = manager.AssignPlayerSlot("player1", 2);

        result.Should().BeTrue();

        var player = manager.GetPlayer("player1");
        player!.PlayerSlot.Should().Be(2);
        player.HasSelectedSlot.Should().BeTrue();
    }

    [Fact]
    public void AssignPlayerSlot_InvalidSlotNegative_ShouldReturnFalse()
    {
        var manager = new PlayerManager();

        manager.AddPlayer("player1", "Test Player", "conn1");
        var result = manager.AssignPlayerSlot("player1", -1);

        result.Should().BeFalse("negative slot index is invalid");
    }

    [Fact]
    public void AssignPlayerSlot_InvalidSlotTooHigh_ShouldReturnFalse()
    {
        var manager = new PlayerManager();

        manager.AddPlayer("player1", "Test Player", "conn1");
        var result = manager.AssignPlayerSlot("player1", 6);

        result.Should().BeFalse("slot index > 5 is invalid");
    }

    [Fact]
    public void AssignPlayerSlot_NonExistentPlayer_ShouldReturnFalse()
    {
        var manager = new PlayerManager();

        var result = manager.AssignPlayerSlot("nonexistent", 2);

        result.Should().BeFalse("cannot assign slot to non-existent player");
    }

    [Fact]
    public void AssignPlayerSlot_AlreadyOccupied_ShouldReturnFalse()
    {
        var manager = new PlayerManager();

        manager.AddPlayer("player1", "Player 1", "conn1");
        manager.AddPlayer("player2", "Player 2", "conn2");
        
        manager.AssignPlayerSlot("player1", 2);
        var result = manager.AssignPlayerSlot("player2", 2);

        result.Should().BeFalse("slot 2 is already occupied by player1");

        var player2 = manager.GetPlayer("player2");
        player2!.PlayerSlot.Should().Be(-1, "slot assignment should fail");
    }

    [Fact]
    public void AssignPlayerSlot_ReassignSamePlayer_ShouldSucceed()
    {
        var manager = new PlayerManager();

        manager.AddPlayer("player1", "Test Player", "conn1");
        manager.AssignPlayerSlot("player1", 2);
        
        var result = manager.AssignPlayerSlot("player1", 4);

        result.Should().BeTrue("player can move to different slot");

        var player = manager.GetPlayer("player1");
        player!.PlayerSlot.Should().Be(4);
        
        var availableSlots = manager.GetAvailableSlots();
        availableSlots.Should().Contain(2, "old slot 2 should be available again");
        availableSlots.Should().NotContain(4, "new slot 4 should be occupied");
    }

    [Fact]
    public void ThreadSafety_ConcurrentAddAndRemove_ShouldHandleCorrectly()
    {
        var manager = new PlayerManager();
        var tasks = new List<Task>();
        var successCount = 0;
        var lockObj = new object();

        for (int i = 0; i < 10; i++)
        {
            int index = i;
            tasks.Add(Task.Run(() =>
            {
                var player = manager.AddPlayer($"player{index}", $"Player {index}", $"conn{index}");
                if (player != null)
                {
                    lock (lockObj)
                    {
                        successCount++;
                    }
                }
            }));
        }

        Task.WaitAll(tasks.ToArray());

        successCount.Should().Be(6, "only 6 players should be added (capacity limit)");
        manager.GetPlayerCount().Should().Be(6);
    }

    [Fact]
    public void GetAvailableSlots_WithUnassignedPlayers_ShouldReturnAllSlots()
    {
        var manager = new PlayerManager();

        manager.AddPlayer("player1", "Player 1", "conn1");
        manager.AddPlayer("player2", "Player 2", "conn2");

        var slots = manager.GetAvailableSlots();

        slots.Should().HaveCount(6, "unassigned players (slot = -1) don't occupy slots");
    }

    [Fact]
    public void RemovePlayer_WithAssignedSlot_ShouldFreeSlot()
    {
        var manager = new PlayerManager();

        manager.AddPlayer("player1", "Player 1", "conn1");
        manager.AssignPlayerSlot("player1", 3);
        
        manager.RemovePlayer("player1");

        var slots = manager.GetAvailableSlots();
        slots.Should().Contain(3, "slot 3 should be freed after player removal");
        slots.Should().HaveCount(6, "all slots should be available");
    }
}
