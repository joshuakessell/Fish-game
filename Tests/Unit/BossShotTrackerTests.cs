using Xunit;
using FluentAssertions;
using OceanKing.Server.Systems;
using OceanKing.Server.Entities;

namespace Tests.Unit;

public class BossShotTrackerTests
{
    [Fact]
    public void RecordShot_ShouldInitializeNewBossRecord()
    {
        var tracker = new BossShotTracker();
        int bossTypeId = 3;
        decimal betValue = 10m;

        tracker.RecordShot(bossTypeId, betValue);

        var probability = tracker.GetKillProbability(bossTypeId, betValue);
        probability.Should().BeGreaterThan(0f);
    }

    [Fact]
    public void GetKillProbability_WithNoShots_ShouldReturnOneShotChance()
    {
        var tracker = new BossShotTracker();
        int bossTypeId = 3;
        decimal betValue = 10m;

        var probability = tracker.GetKillProbability(bossTypeId, betValue);

        probability.Should().Be(0.005f, "first shot should have 0.5% one-shot chance");
    }

    [Fact]
    public void GetKillProbability_InvalidBossType_ShouldReturnOneShotChance()
    {
        var tracker = new BossShotTracker();
        int invalidBossTypeId = 999;
        decimal betValue = 10m;

        var probability = tracker.GetKillProbability(invalidBossTypeId, betValue);

        probability.Should().Be(0.005f);
    }

    [Fact]
    public void GetKillProbability_ProgressiveIncrease_ShouldFollowLogisticCurve()
    {
        var tracker = new BossShotTracker();
        int bossTypeId = 3; // Dragon Turtle (500 base value)
        decimal betValue = 10m;

        tracker.RecordShot(bossTypeId, betValue);
        var prob1 = tracker.GetKillProbability(bossTypeId, betValue);

        for (int i = 0; i < 50; i++)
        {
            tracker.RecordShot(bossTypeId, betValue);
        }
        var prob51 = tracker.GetKillProbability(bossTypeId, betValue);

        for (int i = 0; i < 50; i++)
        {
            tracker.RecordShot(bossTypeId, betValue);
        }
        var prob101 = tracker.GetKillProbability(bossTypeId, betValue);

        prob51.Should().BeGreaterThan(prob1, "probability should increase with shots");
        prob101.Should().BeGreaterThan(prob51, "probability should continue increasing");
    }

    [Fact]
    public void GetKillProbability_AtBreakEven_ShouldBeReasonablyHigh()
    {
        var tracker = new BossShotTracker();
        int bossTypeId = 3; // Dragon Turtle (500 base value)
        decimal betValue = 10m;

        var bossDef = BossCatalog.GetBoss(bossTypeId);
        bossDef.Should().NotBeNull();

        decimal breakEvenDamage = bossDef!.BaseValue * 1.657m;
        decimal shotsNeeded = breakEvenDamage / betValue;

        for (int i = 0; i < (int)shotsNeeded; i++)
        {
            tracker.RecordShot(bossTypeId, betValue);
        }

        var probabilityAtBreakEven = tracker.GetKillProbability(bossTypeId, betValue);

        probabilityAtBreakEven.Should().BeGreaterThan(0.10f, "probability at break-even should be substantial");
        probabilityAtBreakEven.Should().BeLessThan(0.70f, "probability should not be too easy");
    }

    [Theory]
    [InlineData(2, 50)]    // Giant Tuna
    [InlineData(3, 500)]   // Dragon Turtle
    [InlineData(4, 200)]   // Bomb Crab
    [InlineData(5, 150)]   // Lightning Eel
    public void GetKillProbability_DifferentBosses_ShouldScaleAppropriately(int bossTypeId, int expectedBaseValue)
    {
        var tracker = new BossShotTracker();
        decimal betValue = 10m;

        var bossDef = BossCatalog.GetBoss(bossTypeId);
        bossDef.Should().NotBeNull();
        bossDef!.BaseValue.Should().Be(expectedBaseValue);

        tracker.RecordShot(bossTypeId, betValue);
        var probability = tracker.GetKillProbability(bossTypeId, betValue);

        probability.Should().BeGreaterThan(0f);
    }

    [Fact]
    public void GetKillProbability_MinimumProbability_ShouldNeverBeZero()
    {
        var tracker = new BossShotTracker();
        int bossTypeId = 3;
        decimal betValue = 10m;

        var probability = tracker.GetKillProbability(bossTypeId, betValue);

        probability.Should().BeGreaterOrEqualTo(0.005f, "minimum probability should be ONE_SHOT_CHANCE");
    }

    [Fact]
    public void RecordShot_MultipleBosses_ShouldTrackSeparately()
    {
        var tracker = new BossShotTracker();
        int boss1 = 3;
        int boss2 = 4;
        decimal betValue = 10m;

        for (int i = 0; i < 10; i++)
        {
            tracker.RecordShot(boss1, betValue);
        }

        for (int i = 0; i < 20; i++)
        {
            tracker.RecordShot(boss2, betValue);
        }

        var prob1 = tracker.GetKillProbability(boss1, betValue);
        var prob2 = tracker.GetKillProbability(boss2, betValue);

        prob2.Should().BeGreaterThan(prob1, "boss2 with more shots should have higher probability");
    }

    [Fact]
    public void GetKillProbability_HighDamageRatio_ShouldApproachMaxProbability()
    {
        var tracker = new BossShotTracker();
        int bossTypeId = 2; // Giant Tuna (smaller boss)
        decimal betValue = 10m;

        for (int i = 0; i < 1000; i++)
        {
            tracker.RecordShot(bossTypeId, betValue);
        }

        var probability = tracker.GetKillProbability(bossTypeId, betValue);

        probability.Should().BeGreaterThan(0.30f, "at very high damage, probability should be substantial");
        probability.Should().BeLessThan(1.0f, "probability should never exceed 100%");
    }

    [Fact]
    public void GetKillProbability_CumulativeDamage_ShouldIncludeCurrentBet()
    {
        var tracker = new BossShotTracker();
        int bossTypeId = 3;
        decimal betValue = 10m;

        tracker.RecordShot(bossTypeId, betValue);

        var prob1 = tracker.GetKillProbability(bossTypeId, betValue);

        var prob2 = tracker.GetKillProbability(bossTypeId, betValue * 2);

        prob2.Should().BeGreaterThan(prob1, "higher current bet should increase probability");
    }
}
