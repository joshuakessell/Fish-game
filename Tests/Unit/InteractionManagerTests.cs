using Xunit;
using FluentAssertions;
using OceanKing.Server.Managers;

namespace Tests.Unit;

public class InteractionManagerTests
{
    [Fact]
    public void CreateInteraction_QTE_ShouldInitializeCorrectly()
    {
        var manager = new InteractionManager();

        var interaction = manager.CreateInteraction("seq1", "player1", 9, "QTE_TEETH", 100);

        interaction.Should().NotBeNull();
        interaction.SequenceId.Should().Be("seq1");
        interaction.PlayerId.Should().Be("player1");
        interaction.BossTypeId.Should().Be(9);
        interaction.InteractionType.Should().Be("QTE_TEETH");
        interaction.StartTick.Should().Be(100);
        interaction.TimeoutTick.Should().Be(400, "timeout is 300 ticks after start");
        interaction.InteractionData.Should().ContainKey("teeth");
        interaction.InteractionData.Should().ContainKey("hits");
        interaction.InteractionData["hits"].Should().Be(0);
    }

    [Fact]
    public void CreateInteraction_ChestChoice_ShouldInitializeCorrectly()
    {
        var manager = new InteractionManager();

        var interaction = manager.CreateInteraction("seq2", "player2", 10, "CHEST_CHOICE", 200);

        interaction.Should().NotBeNull();
        interaction.SequenceId.Should().Be("seq2");
        interaction.PlayerId.Should().Be("player2");
        interaction.BossTypeId.Should().Be(10);
        interaction.InteractionType.Should().Be("CHEST_CHOICE");
        interaction.StartTick.Should().Be(200);
        interaction.TimeoutTick.Should().Be(500);
        interaction.InteractionData.Should().ContainKey("chests");
        
        var chests = (List<decimal>)interaction.InteractionData["chests"];
        chests.Should().HaveCount(3, "chest choice has 3 options");
    }

    [Fact]
    public void ProcessInteractionSubmission_ValidQTE_ShouldReturnResult()
    {
        var manager = new InteractionManager();
        var interaction = manager.CreateInteraction("seq1", "player1", 9, "QTE_TEETH", 100);

        var clicks = new List<Dictionary<string, float>>
        {
            new() { ["x"] = 500f, ["y"] = 400f }
        };

        var submissionData = new Dictionary<string, object>
        {
            ["clicks"] = clicks
        };

        var result = manager.ProcessInteractionSubmission(interaction.InteractionId, submissionData);

        result.Should().NotBeNull();
        result!.InteractionId.Should().Be(interaction.InteractionId);
        result.SequenceId.Should().Be("seq1");
        result.Score.Should().BeGreaterOrEqualTo(0);
        result.PerformanceModifier.Should().BeGreaterThan(0);
    }

    [Fact]
    public void ProcessInteractionSubmission_QTE_PerfectScore_ShouldGive130Percent()
    {
        var manager = new InteractionManager();
        var interaction = manager.CreateInteraction("seq1", "player1", 9, "QTE_TEETH", 100);

        var teeth = (List<Dictionary<string, float>>)interaction.InteractionData["teeth"];
        var clicks = teeth.Select(t => new Dictionary<string, float>
        {
            ["x"] = t["x"],
            ["y"] = t["y"]
        }).ToList();

        var submissionData = new Dictionary<string, object>
        {
            ["clicks"] = clicks
        };

        var result = manager.ProcessInteractionSubmission(interaction.InteractionId, submissionData);

        result!.Score.Should().Be(5, "all 5 teeth hit");
        result.PerformanceModifier.Should().Be(1.30m, "perfect QTE gives 30% bonus");
        result.Success.Should().BeTrue("5/5 is success");
    }

    [Fact]
    public void ProcessInteractionSubmission_QTE_NoHits_ShouldGive70Percent()
    {
        var manager = new InteractionManager();
        var interaction = manager.CreateInteraction("seq1", "player1", 9, "QTE_TEETH", 100);

        var submissionData = new Dictionary<string, object>
        {
            ["clicks"] = new List<Dictionary<string, float>>()
        };

        var result = manager.ProcessInteractionSubmission(interaction.InteractionId, submissionData);

        result!.Score.Should().Be(0);
        result.PerformanceModifier.Should().Be(0.70m, "0/5 gives 70% (penalty)");
        result.Success.Should().BeFalse("0/5 is failure");
    }

    [Fact]
    public void ProcessInteractionSubmission_ChestChoice_ShouldReturnSelectedModifier()
    {
        var manager = new InteractionManager();
        var interaction = manager.CreateInteraction("seq2", "player2", 10, "CHEST_CHOICE", 200);

        var submissionData = new Dictionary<string, object>
        {
            ["choice"] = 1
        };

        var result = manager.ProcessInteractionSubmission(interaction.InteractionId, submissionData);

        result.Should().NotBeNull();
        result!.InteractionId.Should().Be(interaction.InteractionId);
        result.SequenceId.Should().Be("seq2");
        result.Score.Should().Be(1, "selected chest index 1");
        result.PerformanceModifier.Should().BeOneOf(new[] { 0.70m, 1.00m, 1.30m }, "modifier is one of the chest values");
    }

    [Fact]
    public void ProcessInteractionSubmission_ChestChoice_InvalidIndex_ShouldDefaultToZero()
    {
        var manager = new InteractionManager();
        var interaction = manager.CreateInteraction("seq2", "player2", 10, "CHEST_CHOICE", 200);

        var submissionData = new Dictionary<string, object>
        {
            ["choice"] = 99
        };

        var result = manager.ProcessInteractionSubmission(interaction.InteractionId, submissionData);

        result!.Score.Should().Be(0, "invalid index defaults to 0");
    }

    [Fact]
    public void ProcessInteractionSubmission_NonExistentInteraction_ShouldReturnNull()
    {
        var manager = new InteractionManager();

        var submissionData = new Dictionary<string, object>();
        var result = manager.ProcessInteractionSubmission("nonexistent-id", submissionData);

        result.Should().BeNull();
    }

    [Fact]
    public void ProcessInteractionSubmission_ShouldRemoveInteraction()
    {
        var manager = new InteractionManager();
        var interaction = manager.CreateInteraction("seq1", "player1", 9, "QTE_TEETH", 100);

        var submissionData = new Dictionary<string, object>
        {
            ["clicks"] = new List<Dictionary<string, float>>()
        };

        manager.ProcessInteractionSubmission(interaction.InteractionId, submissionData);

        var retrieved = manager.GetInteractionById(interaction.InteractionId);
        retrieved.Should().BeNull("interaction should be removed after processing");
    }

    [Fact]
    public void CheckTimeouts_ShouldReturnTimedOutInteractions()
    {
        var manager = new InteractionManager();

        manager.CreateInteraction("seq1", "player1", 9, "QTE_TEETH", 100);
        manager.CreateInteraction("seq2", "player2", 10, "CHEST_CHOICE", 200);

        var timedOut = manager.CheckTimeouts(450);

        timedOut.Should().HaveCount(1, "only interaction at tick 100 should time out at tick 450");
        timedOut[0].SequenceId.Should().Be("seq1");
    }

    [Fact]
    public void CheckTimeouts_ShouldRemoveTimedOutInteractions()
    {
        var manager = new InteractionManager();

        var interaction = manager.CreateInteraction("seq1", "player1", 9, "QTE_TEETH", 100);
        manager.CheckTimeouts(450);

        var retrieved = manager.GetInteractionById(interaction.InteractionId);
        retrieved.Should().BeNull("timed out interaction should be removed");
    }

    [Fact]
    public void CheckTimeouts_NoTimeouts_ShouldReturnEmpty()
    {
        var manager = new InteractionManager();

        manager.CreateInteraction("seq1", "player1", 9, "QTE_TEETH", 100);

        var timedOut = manager.CheckTimeouts(200);

        timedOut.Should().BeEmpty("no interactions should time out yet");
    }

    [Fact]
    public void GetPendingInteraction_ExistingPlayer_ShouldReturn()
    {
        var manager = new InteractionManager();

        manager.CreateInteraction("seq1", "player1", 9, "QTE_TEETH", 100);

        var pending = manager.GetPendingInteraction("player1");

        pending.Should().NotBeNull();
        pending!.PlayerId.Should().Be("player1");
        pending.SequenceId.Should().Be("seq1");
    }

    [Fact]
    public void GetPendingInteraction_NonExistentPlayer_ShouldReturnNull()
    {
        var manager = new InteractionManager();

        var pending = manager.GetPendingInteraction("nonexistent");

        pending.Should().BeNull();
    }

    [Fact]
    public void GetInteractionById_ExistingId_ShouldReturn()
    {
        var manager = new InteractionManager();

        var interaction = manager.CreateInteraction("seq1", "player1", 9, "QTE_TEETH", 100);

        var retrieved = manager.GetInteractionById(interaction.InteractionId);

        retrieved.Should().NotBeNull();
        retrieved!.InteractionId.Should().Be(interaction.InteractionId);
    }

    [Fact]
    public void GetInteractionById_NonExistentId_ShouldReturnNull()
    {
        var manager = new InteractionManager();

        var retrieved = manager.GetInteractionById("nonexistent");

        retrieved.Should().BeNull();
    }

    [Fact]
    public void QTE_MultiplePartialHits_ShouldCalculateCorrectModifier()
    {
        var manager = new InteractionManager();
        var interaction = manager.CreateInteraction("seq1", "player1", 9, "QTE_TEETH", 100);

        var teeth = (List<Dictionary<string, float>>)interaction.InteractionData["teeth"];
        var clicks = teeth.Take(3).Select(t => new Dictionary<string, float>
        {
            ["x"] = t["x"],
            ["y"] = t["y"]
        }).ToList();

        var submissionData = new Dictionary<string, object>
        {
            ["clicks"] = clicks
        };

        var result = manager.ProcessInteractionSubmission(interaction.InteractionId, submissionData);

        result!.Score.Should().Be(3);
        result.PerformanceModifier.Should().Be(1.10m, "3/5 hits gives 10% bonus");
        result.Success.Should().BeTrue("3/5 is considered success");
    }

    [Fact]
    public void ChestChoice_AllThreeOptions_ShouldHaveDifferentModifiers()
    {
        var manager = new InteractionManager();
        var interaction = manager.CreateInteraction("seq2", "player2", 10, "CHEST_CHOICE", 200);

        var chests = (List<decimal>)interaction.InteractionData["chests"];

        chests.Should().Contain(0.70m, "one chest has penalty");
        chests.Should().Contain(1.00m, "one chest is neutral");
        chests.Should().Contain(1.30m, "one chest has bonus");
    }

    [Fact]
    public void CreateInteraction_UnknownType_ShouldNotCrash()
    {
        var manager = new InteractionManager();

        var interaction = manager.CreateInteraction("seq3", "player3", 11, "UNKNOWN_TYPE", 300);

        interaction.Should().NotBeNull();
        interaction.InteractionType.Should().Be("UNKNOWN_TYPE");
    }

    [Fact]
    public void ProcessInteractionSubmission_UnknownType_ShouldReturnNull()
    {
        var manager = new InteractionManager();
        var interaction = manager.CreateInteraction("seq3", "player3", 11, "UNKNOWN_TYPE", 300);

        var submissionData = new Dictionary<string, object>();
        var result = manager.ProcessInteractionSubmission(interaction.InteractionId, submissionData);

        result.Should().BeNull("unknown interaction type should return null");
    }

    [Fact]
    public void QTE_MissedClicks_ShouldNotCountTowardScore()
    {
        var manager = new InteractionManager();
        var interaction = manager.CreateInteraction("seq1", "player1", 9, "QTE_TEETH", 100);

        var clicks = new List<Dictionary<string, float>>
        {
            new() { ["x"] = 0f, ["y"] = 0f },
            new() { ["x"] = 9999f, ["y"] = 9999f }
        };

        var submissionData = new Dictionary<string, object>
        {
            ["clicks"] = clicks
        };

        var result = manager.ProcessInteractionSubmission(interaction.InteractionId, submissionData);

        result!.Score.Should().Be(0, "clicks far from targets should not count");
    }
}
