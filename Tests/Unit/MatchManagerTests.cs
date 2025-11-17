using Xunit;
using FluentAssertions;
using Moq;
using OceanKing.Server.Managers;
using OceanKing.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace Tests.Unit;

public class MatchManagerTests : IDisposable
{
    private readonly List<MatchManager> _matchManagers = new();

    private MatchManager CreateMatchManager()
    {
        var mockHubContext = new Mock<IHubContext<GameHub>>();
        mockHubContext.Setup(x => x.Clients.Group(It.IsAny<string>()))
            .Returns(Mock.Of<IClientProxy>());
        
        var manager = new MatchManager(mockHubContext.Object);
        _matchManagers.Add(manager);
        return manager;
    }

    public void Dispose()
    {
        foreach (var manager in _matchManagers)
        {
            manager.ShutdownAll();
        }
    }

    [Fact]
    public void CreateMatchWithId_ShouldCreateMatch()
    {
        var manager = CreateMatchManager();

        var match = manager.CreateMatchWithId("test_match");

        match.Should().NotBeNull();
        match!.MatchId.Should().Be("test_match");
    }

    [Fact]
    public void CreateMatchWithId_DuplicateId_ShouldReturnExisting()
    {
        var manager = CreateMatchManager();

        var first = manager.CreateMatchWithId("test_match");
        var duplicate = manager.CreateMatchWithId("test_match");

        duplicate.Should().BeSameAs(first, "duplicate match ID should return existing match");
    }

    [Fact]
    public void GetMatch_ExistingMatch_ShouldReturn()
    {
        var manager = CreateMatchManager();

        manager.CreateMatchWithId("test_match");
        var retrieved = manager.GetMatch("test_match");

        retrieved.Should().NotBeNull();
        retrieved!.MatchId.Should().Be("test_match");
    }

    [Fact]
    public void GetMatch_NonExistent_ShouldReturnNull()
    {
        var manager = CreateMatchManager();

        var result = manager.GetMatch("nonexistent");

        result.Should().BeNull();
    }

    [Fact]
    public void RemoveMatch_ExistingMatch_ShouldRemove()
    {
        var manager = CreateMatchManager();

        manager.CreateMatchWithId("test_match");
        manager.RemoveMatch("test_match");

        var retrieved = manager.GetMatch("test_match");
        retrieved.Should().BeNull("removed match should not be found");
    }

    [Fact]
    public void RemoveMatch_NonExistent_ShouldNotThrow()
    {
        var manager = CreateMatchManager();

        Action action = () => manager.RemoveMatch("nonexistent");

        action.Should().NotThrow();
    }

    [Fact]
    public void CreateEmptyMatch_ShouldAutoGenerateId()
    {
        var manager = CreateMatchManager();

        var match = manager.CreateEmptyMatch();

        match.Should().NotBeNull();
        match!.MatchId.Should().NotBeNullOrEmpty();
        match.MatchId.Should().StartWith("match_");
    }

    [Fact]
    public void CreateEmptyMatch_MultipleTimes_ShouldCreateUniqueMatches()
    {
        var manager = CreateMatchManager();

        var match1 = manager.CreateEmptyMatch();
        var match2 = manager.CreateEmptyMatch();

        match1!.MatchId.Should().NotBe(match2!.MatchId);
    }

    [Fact]
    public void FindOrCreateMatch_NewMatch_ShouldCreate()
    {
        var manager = CreateMatchManager();

        var match = manager.FindOrCreateMatch("player1");

        match.Should().NotBeNull();
        match!.MatchId.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public void FindOrCreateMatch_ReusesJoinableMatch()
    {
        var manager = CreateMatchManager();

        var match1 = manager.FindOrCreateMatch("player1");
        match1!.AddPlayer("player1", "Player 1", "conn1");

        var match2 = manager.FindOrCreateMatch("player2");

        match1.MatchId.Should().Be(match2!.MatchId, "should reuse match with available slots");
    }

    [Fact]
    public void FindOrCreateMatch_FullMatch_ShouldCreateNew()
    {
        var manager = CreateMatchManager();

        var match1 = manager.CreateEmptyMatch();
        for (int i = 0; i < 6; i++)
        {
            match1!.AddPlayer($"player{i}", $"Player {i}", $"conn{i}", i);
        }

        var match2 = manager.FindOrCreateMatch("player_new");

        match1!.MatchId.Should().NotBe(match2!.MatchId, "should create new match when existing are full");
    }

    [Fact]
    public void GetActiveMatchCount_ShouldReturnCorrectCount()
    {
        var manager = CreateMatchManager();

        manager.CreateMatchWithId("match1");
        manager.CreateMatchWithId("match2");
        manager.CreateMatchWithId("match3");

        var count = manager.GetActiveMatchCount();

        count.Should().Be(3);
    }

    [Fact]
    public void GetActiveMatchCount_AfterRemoval_ShouldDecrement()
    {
        var manager = CreateMatchManager();

        manager.CreateMatchWithId("match1");
        manager.CreateMatchWithId("match2");
        manager.RemoveMatch("match1");

        var count = manager.GetActiveMatchCount();

        count.Should().Be(1);
    }

    [Fact]
    public void ShutdownAll_ShouldRemoveAllMatches()
    {
        var manager = CreateMatchManager();

        manager.CreateMatchWithId("match1");
        manager.CreateMatchWithId("match2");
        manager.ShutdownAll();

        manager.GetActiveMatchCount().Should().Be(0);
    }

    [Fact]
    public void GetMatch_ThreadSafety_ShouldHandleConcurrentAccess()
    {
        var manager = CreateMatchManager();
        manager.CreateMatchWithId("test_match");

        var tasks = new List<Task>();
        for (int i = 0; i < 10; i++)
        {
            tasks.Add(Task.Run(() =>
            {
                var match = manager.GetMatch("test_match");
                match.Should().NotBeNull();
            }));
        }

        Task.WaitAll(tasks.ToArray());
    }
}
