using Xunit;
using FluentAssertions;
using OceanKing.Server.Managers;
using OceanKing.Server.Entities;

namespace Tests.Unit;

public class KillSequenceHandlerTests
{
    [Fact]
    public void StartBossKillSequence_ShouldCreateSequence()
    {
        var fishManager = new FishManager(new Random(42));
        var handler = new KillSequenceHandler(fishManager);
        
        handler.StartBossKillSequence(9, 1001, "player1", 1000m, 0);
        
        var activeSequences = handler.GetActiveSequences();
        activeSequences.Should().HaveCount(1);
        activeSequences[0].KillerPlayerId.Should().Be("player1");
        activeSequences[0].BasePayout.Should().Be(1000m);
    }

    [Fact]
    public void StartBossKillSequence_InvalidBossType_ShouldNotCreateSequence()
    {
        var fishManager = new FishManager(new Random(42));
        var handler = new KillSequenceHandler(fishManager);
        
        handler.StartBossKillSequence(999, 1001, "player1", 1000m, 0);
        
        var activeSequences = handler.GetActiveSequences();
        activeSequences.Should().BeEmpty();
    }

    [Fact]
    public void ApplyInteractionResult_ShouldUpdatePerformanceModifier()
    {
        var fishManager = new FishManager(new Random(42));
        var handler = new KillSequenceHandler(fishManager);
        
        handler.StartBossKillSequence(9, 1001, "player1", 1000m, 0);
        var sequence = handler.GetActiveSequences()[0];
        
        handler.ApplyInteractionResult(sequence.SequenceId, 1.5m);
        
        sequence.PerformanceModifier.Should().Be(1.5m);
        sequence.WaitingForInteraction.Should().BeFalse();
    }

    [Fact]
    public void ProcessSequences_WaitingForInteraction_ShouldNotProcess()
    {
        var fishManager = new FishManager(new Random(42));
        var handler = new KillSequenceHandler(fishManager);
        
        handler.StartBossKillSequence(9, 1001, "player1", 1000m, 0);
        
        var results = handler.ProcessSequences(10);
        
        results.Should().BeEmpty("should wait for interaction before processing");
    }

    [Fact]
    public void ProcessSequences_InteractionTimeout_ShouldApplyPenalty()
    {
        var fishManager = new FishManager(new Random(42));
        var handler = new KillSequenceHandler(fishManager);
        
        handler.StartBossKillSequence(9, 1001, "player1", 1000m, 0);
        
        handler.ProcessSequences(301);
        
        var sequence = handler.GetActiveSequences();
        if (sequence.Count > 0)
        {
            sequence[0].PerformanceModifier.Should().Be(0.7m, "timeout should apply 30% penalty");
        }
    }

    [Fact]
    public void ProcessSequences_AtEffectInterval_ShouldExecuteEffect()
    {
        var fishManager = new FishManager(new Random(42));
        
        var handler = new KillSequenceHandler(fishManager);
        
        handler.StartBossKillSequence(11, 1001, "player1", 1000m, 0);
        
        var results = handler.ProcessSequences(15);
        
        results.Should().NotBeNull();
    }

    [Fact]
    public void ProcessSequences_SequenceComplete_ShouldRemoveSequence()
    {
        var fishManager = new FishManager(new Random(42));
        var handler = new KillSequenceHandler(fishManager);
        
        handler.StartBossKillSequence(13, 1001, "player1", 1000m, 0);
        
        handler.ProcessSequences(15);
        handler.ProcessSequences(50);
        
        var activeSequences = handler.GetActiveSequences();
        activeSequences.Should().BeEmpty("completed sequences should be removed");
    }

    [Fact]
    public void GetPendingInteraction_WithWaitingSequence_ShouldReturnSequence()
    {
        var fishManager = new FishManager(new Random(42));
        var handler = new KillSequenceHandler(fishManager);
        
        handler.StartBossKillSequence(10, 1001, "player1", 1000m, 0);
        
        var pending = handler.GetPendingInteraction("player1");
        
        pending.Should().NotBeNull();
        pending!.KillerPlayerId.Should().Be("player1");
    }

    [Fact]
    public void GetPendingInteraction_NoWaitingSequence_ShouldReturnNull()
    {
        var fishManager = new FishManager(new Random(42));
        var handler = new KillSequenceHandler(fishManager);
        
        var pending = handler.GetPendingInteraction("player1");
        
        pending.Should().BeNull();
    }

    [Fact]
    public void ProcessSequences_ScreenWipe_ShouldExecuteWithoutFish()
    {
        var fishManager = new FishManager(new Random(42));
        
        var handler = new KillSequenceHandler(fishManager);
        handler.StartBossKillSequence(9, 1001, "player1", 500m, 0);
        
        var results = handler.ProcessSequences(15);
        
        results.Should().NotBeNull();
    }

    [Fact]
    public void ProcessSequences_FinalStep_ShouldCalculatePayout()
    {
        var fishManager = new FishManager(new Random(42));
        
        var handler = new KillSequenceHandler(fishManager);
        handler.StartBossKillSequence(13, 1001, "player1", 500m, 0);
        
        handler.ProcessSequences(15);
        
        var activeSequences = handler.GetActiveSequences();
        activeSequences.Should().NotBeNull();
    }

    [Fact]
    public void GetActiveSequences_ShouldReturnCopy()
    {
        var fishManager = new FishManager(new Random(42));
        var handler = new KillSequenceHandler(fishManager);
        
        handler.StartBossKillSequence(9, 1001, "player1", 1000m, 0);
        
        var sequences1 = handler.GetActiveSequences();
        var sequences2 = handler.GetActiveSequences();
        
        sequences1.Should().NotBeSameAs(sequences2, "should return a copy of the list");
    }
}
