using Xunit;
using FluentAssertions;
using OceanKing.Server.Managers;

namespace Tests.Unit;

public class RoundManagerTests
{
    [Fact]
    public void Constructor_ShouldInitializeWithRound1()
    {
        var manager = new RoundManager();
        
        manager.GetRoundNumber().Should().Be(1);
    }

    [Fact]
    public void Initialize_ShouldSetRoundStartAndEnd()
    {
        var manager = new RoundManager();
        
        manager.Initialize(100);
        
        var state = manager.GetRoundState();
        state.RoundStartTick.Should().Be(100);
        state.RoundEndTick.Should().Be(100 + 18000);
    }

    [Fact]
    public void Initialize_ShouldSelectBosses()
    {
        var manager = new RoundManager();
        
        manager.Initialize(0);
        
        var eligibleBosses = manager.GetEligibleBosses();
        eligibleBosses.Should().NotBeEmpty("bosses should be selected during initialization");
    }

    [Fact]
    public void Update_BeforeRoundEnd_ShouldNotIncrementRound()
    {
        var manager = new RoundManager();
        manager.Initialize(0);
        
        manager.Update(1000, 10);
        
        manager.GetRoundNumber().Should().Be(1);
    }

    [Fact]
    public void Update_AfterRoundEnd_ShouldIncrementRound()
    {
        var manager = new RoundManager();
        manager.Initialize(0);
        
        manager.Update(18001, 10);
        
        manager.GetRoundNumber().Should().Be(2);
    }

    [Fact]
    public void Update_AfterRoundEnd_ShouldReselectBosses()
    {
        var manager = new RoundManager();
        manager.Initialize(0);
        
        var round1Bosses = manager.GetEligibleBosses();
        
        manager.Update(18001, 10);
        
        var round2Bosses = manager.GetEligibleBosses();
        round2Bosses.Should().NotBeEmpty();
    }

    [Fact]
    public void GetTimeRemainingTicks_ShouldReturnCorrectValue()
    {
        var manager = new RoundManager();
        manager.Initialize(0);
        
        var remaining = manager.GetTimeRemainingTicks(100);
        
        remaining.Should().Be(18000 - 100);
    }

    [Fact]
    public void GetTimeRemainingTicks_AfterRoundEnd_ShouldReturnZero()
    {
        var manager = new RoundManager();
        manager.Initialize(0);
        
        var remaining = manager.GetTimeRemainingTicks(20000);
        
        remaining.Should().Be(0);
    }

    [Fact]
    public void IsBossEligible_ForEligibleBoss_ShouldReturnTrue()
    {
        var manager = new RoundManager();
        manager.Initialize(0);
        
        var eligibleBosses = manager.GetEligibleBosses();
        var firstBoss = eligibleBosses.First();
        
        manager.IsBossEligible(firstBoss).Should().BeTrue();
    }

    [Fact]
    public void GetRoundState_ShouldReturnCurrentState()
    {
        var manager = new RoundManager();
        manager.Initialize(100);
        
        var state = manager.GetRoundState();
        
        state.Should().NotBeNull();
        state.RoundNumber.Should().Be(1);
        state.RoundStartTick.Should().Be(100);
    }

    [Fact]
    public void Update_MultipleRounds_ShouldIncrementCorrectly()
    {
        var manager = new RoundManager();
        manager.Initialize(0);
        
        manager.Update(18001, 10);
        manager.GetRoundNumber().Should().Be(2);
        
        manager.Update(36001, 10);
        manager.GetRoundNumber().Should().Be(3);
        
        manager.Update(54001, 10);
        manager.GetRoundNumber().Should().Be(4);
    }
}
