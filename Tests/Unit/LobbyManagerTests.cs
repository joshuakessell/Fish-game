using Xunit;
using FluentAssertions;
using Moq;
using OceanKing.Server.Managers;
using OceanKing.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace Tests.Unit;

public class LobbyManagerTests : IDisposable
{
    private readonly List<MatchManager> _matchManagers = new();

    private LobbyManager CreateLobbyManager()
    {
        var mockHubContext = new Mock<IHubContext<GameHub>>();
        mockHubContext.Setup(x => x.Clients.Group(It.IsAny<string>()))
            .Returns(Mock.Of<IClientProxy>());
        
        var matchManager = new MatchManager(mockHubContext.Object);
        _matchManagers.Add(matchManager);
        return new LobbyManager(matchManager);
    }

    public void Dispose()
    {
        foreach (var manager in _matchManagers)
        {
            manager.ShutdownAll();
        }
    }

    [Fact]
    public void GetRoomList_EmptyLobby_ShouldCreateMinimumRooms()
    {
        var lobbyManager = CreateLobbyManager();

        var result = lobbyManager.GetRoomList(0);

        result.Should().NotBeNull();
        result.Rooms.Should().NotBeEmpty("minimum rooms should be auto-created");
        result.Rooms.Count.Should().BeGreaterOrEqualTo(4, "should ensure at least 4 rooms");
        result.CurrentPage.Should().Be(0);
    }

    [Fact]
    public void GetRoomList_ShouldReturnCorrectPage()
    {
        var lobbyManager = CreateLobbyManager();

        var result = lobbyManager.GetRoomList(0);

        result.CurrentPage.Should().Be(0);
        result.TotalPages.Should().BeGreaterThan(0);
    }

    [Fact]
    public void GetRoomList_Page1_ShouldReturnSecondPage()
    {
        var lobbyManager = CreateLobbyManager();

        var result = lobbyManager.GetRoomList(1);

        result.CurrentPage.Should().Be(1);
    }

    [Fact]
    public void GetRoomList_ShouldShowSeatOccupancy()
    {
        var lobbyManager = CreateLobbyManager();

        var result = lobbyManager.GetRoomList(0);

        result.Rooms.Should().NotBeEmpty();
        foreach (var room in result.Rooms)
        {
            room.SeatOccupancy.Should().NotBeNull();
            room.SeatOccupancy.Should().HaveCount(6, "6 seats per room");
        }
    }

    [Fact]
    public void JoinRoom_ValidMatch_ShouldReturnMatch()
    {
        var lobbyManager = CreateLobbyManager();
        var roomList = lobbyManager.GetRoomList(0);
        var firstRoom = roomList.Rooms.First();

        var match = lobbyManager.JoinRoom(firstRoom.MatchId, "player1", 0);

        match.Should().NotBeNull("should return valid match for joinable room");
    }

    [Fact]
    public void JoinRoom_InvalidSeatIndex_ShouldReturnNull()
    {
        var lobbyManager = CreateLobbyManager();
        var roomList = lobbyManager.GetRoomList(0);
        var firstRoom = roomList.Rooms.First();

        var match = lobbyManager.JoinRoom(firstRoom.MatchId, "player1", -1);

        match.Should().BeNull("negative seat index should be rejected");
    }

    [Fact]
    public void JoinRoom_SeatIndexTooHigh_ShouldReturnNull()
    {
        var lobbyManager = CreateLobbyManager();
        var roomList = lobbyManager.GetRoomList(0);
        var firstRoom = roomList.Rooms.First();

        var match = lobbyManager.JoinRoom(firstRoom.MatchId, "player1", 6);

        match.Should().BeNull("seat index >= 6 should be rejected");
    }

    [Fact]
    public void JoinRoom_NonExistentMatch_ShouldReturnNull()
    {
        var lobbyManager = CreateLobbyManager();

        var match = lobbyManager.JoinRoom("nonexistent_match", "player1", 0);

        match.Should().BeNull("non-existent match should return null");
    }

    [Fact]
    public void CreateSoloMatch_ShouldReturnNewMatch()
    {
        var mockHubContext = new Mock<IHubContext<GameHub>>();
        mockHubContext.Setup(x => x.Clients.Group(It.IsAny<string>()))
            .Returns(Mock.Of<IClientProxy>());
        
        var matchManager = new MatchManager(mockHubContext.Object);
        var lobbyManager = new LobbyManager(matchManager);

        var soloMatch = lobbyManager.CreateSoloMatch("player1", mockHubContext.Object);

        soloMatch.Should().NotBeNull();
        soloMatch.IsSolo().Should().BeTrue();
        soloMatch.MatchId.Should().StartWith("solo_");
    }

    [Fact]
    public void CreateSoloMatch_MultipleTimes_ShouldCreateUniqueMatches()
    {
        var mockHubContext = new Mock<IHubContext<GameHub>>();
        mockHubContext.Setup(x => x.Clients.Group(It.IsAny<string>()))
            .Returns(Mock.Of<IClientProxy>());
        
        var matchManager = new MatchManager(mockHubContext.Object);
        var lobbyManager = new LobbyManager(matchManager);

        var match1 = lobbyManager.CreateSoloMatch("player1", mockHubContext.Object);
        var match2 = lobbyManager.CreateSoloMatch("player2", mockHubContext.Object);

        match1.MatchId.Should().NotBe(match2.MatchId, "each solo match should have unique ID");
    }

    [Fact]
    public void RemoveSoloMatch_ShouldCleanupMatch()
    {
        var mockHubContext = new Mock<IHubContext<GameHub>>();
        mockHubContext.Setup(x => x.Clients.Group(It.IsAny<string>()))
            .Returns(Mock.Of<IClientProxy>());
        
        var matchManager = new MatchManager(mockHubContext.Object);
        var lobbyManager = new LobbyManager(matchManager);

        var soloMatch = lobbyManager.CreateSoloMatch("player1", mockHubContext.Object);
        lobbyManager.RemoveSoloMatch(soloMatch.MatchId);
    }

    [Fact]
    public void RemoveSoloMatch_NonExistent_ShouldNotThrow()
    {
        var lobbyManager = CreateLobbyManager();

        Action action = () => lobbyManager.RemoveSoloMatch("nonexistent_solo_match");

        action.Should().NotThrow();
    }

    [Fact]
    public void GetRoomList_ShouldExcludeSoloMatches()
    {
        var mockHubContext = new Mock<IHubContext<GameHub>>();
        mockHubContext.Setup(x => x.Clients.Group(It.IsAny<string>()))
            .Returns(Mock.Of<IClientProxy>());
        
        var matchManager = new MatchManager(mockHubContext.Object);
        var lobbyManager = new LobbyManager(matchManager);

        var soloMatch = lobbyManager.CreateSoloMatch("player1", mockHubContext.Object);
        var roomList = lobbyManager.GetRoomList(0);

        roomList.Rooms.Should().NotContain(r => r.MatchId == soloMatch.MatchId, "solo matches should be private");
    }

    [Fact]
    public void GetRoomList_ShouldShowPlayerCount()
    {
        var lobbyManager = CreateLobbyManager();

        var result = lobbyManager.GetRoomList(0);

        result.Rooms.Should().NotBeEmpty();
        foreach (var room in result.Rooms)
        {
            room.PlayerCount.Should().BeGreaterOrEqualTo(0);
            room.MaxPlayers.Should().Be(6);
        }
    }

    [Fact]
    public void GetRoomList_ShouldNotShowFullRooms()
    {
        var mockHubContext = new Mock<IHubContext<GameHub>>();
        mockHubContext.Setup(x => x.Clients.Group(It.IsAny<string>()))
            .Returns(Mock.Of<IClientProxy>());
        
        var matchManager = new MatchManager(mockHubContext.Object);
        var lobbyManager = new LobbyManager(matchManager);

        var match = matchManager.CreateMatchWithId("full_match");
        for (int i = 0; i < 6; i++)
        {
            match!.AddPlayer($"player{i}", $"Player {i}", $"conn{i}", i);
        }

        var roomList = lobbyManager.GetRoomList(0);

        roomList.Rooms.Should().NotContain(r => r.MatchId == "full_match", "full rooms should not appear in lobby");
    }
}
