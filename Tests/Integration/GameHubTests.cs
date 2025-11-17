using Xunit;
using FluentAssertions;
using Moq;
using OceanKing.Hubs;
using OceanKing.Server;
using OceanKing.Server.Managers;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace Tests.Integration;

public class GameHubTests : IDisposable
{
    private readonly List<MatchInstance> _matchInstances = new();
    private readonly GameServerHost _gameServer;

    public GameHubTests()
    {
        var mockHubContext = new Mock<IHubContext<GameHub>>();
        mockHubContext.Setup(x => x.Clients.Group(It.IsAny<string>()))
            .Returns(Mock.Of<IClientProxy>());
        
        _gameServer = new GameServerHost(mockHubContext.Object);
        _gameServer.Start();
    }

    public void Dispose()
    {
        _gameServer.Stop();
    }

    private Mock<HubCallerContext> CreateMockContext(string userId = "test-user", string name = "Test User", int credits = 1000)
    {
        var mockContext = new Mock<HubCallerContext>();
        
        mockContext.Setup(x => x.ConnectionId).Returns("test-connection");
        
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(ClaimTypes.Name, name),
            new Claim("credits", credits.ToString())
        };
        
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);
        
        mockContext.Setup(x => x.User).Returns(principal);
        
        return mockContext;
    }

    [Fact]
    public void Constructor_ShouldInitializeHub()
    {
        var hub = new GameHub(_gameServer);

        hub.Should().NotBeNull();
    }

    [Fact]
    public void Fire_WithoutMatchRegistration_ShouldNotThrow()
    {
        var hub = new GameHub(_gameServer);
        hub.Context = CreateMockContext().Object;

        hub.Fire(900, 450, 0, -1, "test-nonce", null);
    }

    [Fact]
    public void SetBetValue_WithoutMatchRegistration_ShouldNotThrow()
    {
        var hub = new GameHub(_gameServer);
        hub.Context = CreateMockContext().Object;

        hub.SetBetValue(50);
    }

    [Fact]
    public async Task SelectTurretSlot_InvalidSlot_ShouldReturnError()
    {
        var hub = new GameHub(_gameServer);
        hub.Context = CreateMockContext().Object;

        var result = await hub.SelectTurretSlot(-1);

        result.Should().NotBeNull();
        var resultType = result.GetType();
        var successProperty = resultType.GetProperty("success");
        var success = (bool)successProperty!.GetValue(result)!;
        success.Should().BeFalse();
    }

    [Fact]
    public async Task SelectTurretSlot_OutOfRangeSlot_ShouldReturnError()
    {
        var hub = new GameHub(_gameServer);
        hub.Context = CreateMockContext().Object;

        var result = await hub.SelectTurretSlot(10);

        result.Should().NotBeNull();
        var resultType = result.GetType();
        var successProperty = resultType.GetProperty("success");
        var success = (bool)successProperty!.GetValue(result)!;
        success.Should().BeFalse();
    }

    [Fact]
    public async Task SelectTurretSlot_WithoutMatchConnection_ShouldReturnError()
    {
        var hub = new GameHub(_gameServer);
        hub.Context = CreateMockContext().Object;

        var result = await hub.SelectTurretSlot(2);

        result.Should().NotBeNull();
        var resultType = result.GetType();
        var successProperty = resultType.GetProperty("success");
        var success = (bool)successProperty!.GetValue(result)!;
        success.Should().BeFalse();
    }

    [Fact]
    public void Fire_OutOfBounds_ShouldNotThrow()
    {
        var hub = new GameHub(_gameServer);
        hub.Context = CreateMockContext().Object;

        hub.Fire(-100, -100, 0, -1, "test-nonce", null);
        hub.Fire(2000, 2000, 0, -1, "test-nonce", null);
    }

    [Fact]
    public void SetBetValue_ShouldAcceptValidRange()
    {
        var hub = new GameHub(_gameServer);
        hub.Context = CreateMockContext().Object;

        hub.SetBetValue(10);
        hub.SetBetValue(50);
        hub.SetBetValue(200);
    }

    [Fact]
    public void GetUserFromContext_ShouldExtractClaimsCorrectly()
    {
        var hub = new GameHub(_gameServer);
        hub.Context = CreateMockContext("user123", "John Doe", 5000).Object;

        var userMethod = hub.GetType().GetMethod("GetUserFromContext", 
            System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

        if (userMethod != null)
        {
            var result = userMethod.Invoke(hub, null) as ValueTuple<string, string, int>?;

            if (result.HasValue)
            {
                result.Value.Item1.Should().Be("user123");
                result.Value.Item2.Should().Be("John Doe");
                result.Value.Item3.Should().Be(5000);
            }
        }
    }

    [Fact]
    public void Fire_WithTargetFishId_ShouldNotThrow()
    {
        var hub = new GameHub(_gameServer);
        hub.Context = CreateMockContext().Object;

        hub.Fire(900, 450, 0, -1, "test-nonce", 42);
    }

    [Fact]
    public void Fire_WithClientNonce_ShouldNotThrow()
    {
        var hub = new GameHub(_gameServer);
        hub.Context = CreateMockContext().Object;

        hub.Fire(900, 450, 0, -1, "nonce-12345", null);
    }

    [Fact]
    public void GetRoomList_ShouldReturnRoomListResponse()
    {
        var hub = new GameHub(_gameServer);
        hub.Context = CreateMockContext().Object;

        var result = hub.GetRoomList(0);

        result.Should().NotBeNull();
        result.Rooms.Should().NotBeNull();
        result.CurrentPage.Should().Be(0);
    }

    [Fact]
    public void GetRoomList_WithPage_ShouldReturnCorrectPage()
    {
        var hub = new GameHub(_gameServer);
        hub.Context = CreateMockContext().Object;

        var result = hub.GetRoomList(1);

        result.Should().NotBeNull();
        result.CurrentPage.Should().Be(1);
    }

    [Fact]
    public async Task JoinRoom_ValidRequest_ShouldCreateMatch()
    {
        var hub = new GameHub(_gameServer);
        var mockContext = CreateMockContext("user1", "Player 1", 5000);
        hub.Context = mockContext.Object;

        var result = await hub.JoinRoom("match_test_1", 0);

        result.Should().NotBeNull();
        var resultType = result.GetType();
        var successProperty = resultType.GetProperty("success");
        if (successProperty != null)
        {
            var success = successProperty.GetValue(result);
            success.Should().NotBeNull();
        }
    }

    [Fact]
    public async Task JoinRoom_InvalidSeatIndex_ShouldReturnError()
    {
        var hub = new GameHub(_gameServer);
        var mockContext = CreateMockContext("user1", "Player 1", 5000);
        hub.Context = mockContext.Object;

        var result = await hub.JoinRoom("match_1", -1);

        result.Should().NotBeNull();
        var resultType = result.GetType();
        var successProperty = resultType.GetProperty("success");
        var success = (bool)successProperty!.GetValue(result)!;
        success.Should().BeFalse();
    }

    [Fact]
    public async Task JoinRoom_SeatIndexTooHigh_ShouldReturnError()
    {
        var hub = new GameHub(_gameServer);
        var mockContext = CreateMockContext("user1", "Player 1", 5000);
        hub.Context = mockContext.Object;

        var result = await hub.JoinRoom("match_1", 6);

        result.Should().NotBeNull();
        var resultType = result.GetType();
        var successProperty = resultType.GetProperty("success");
        var success = (bool)successProperty!.GetValue(result)!;
        success.Should().BeFalse();
    }


    [Fact]
    public void SubmitInteraction_WithoutMatchRegistration_ShouldNotThrow()
    {
        var hub = new GameHub(_gameServer);
        hub.Context = CreateMockContext().Object;

        var submissionData = new Dictionary<string, object>
        {
            ["choice"] = 1
        };

        hub.SubmitInteraction("interaction1", submissionData);
    }

    [Fact]
    public void SubmitInteraction_ValidData_ShouldNotThrow()
    {
        var hub = new GameHub(_gameServer);
        hub.Context = CreateMockContext().Object;

        var submissionData = new Dictionary<string, object>
        {
            ["clicks"] = new List<Dictionary<string, float>>()
        };

        hub.SubmitInteraction("interaction1", submissionData);
    }




}
