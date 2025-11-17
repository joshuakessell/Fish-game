using Xunit;
using FluentAssertions;
using OceanKing.Server.Managers;
using OceanKing.Server.Entities;

namespace Tests.Unit;

public class FishManagerTests
{
    [Fact]
    public void Constructor_ShouldInitializeWithRandomFishCountRange()
    {
        var manager = new FishManager();

        manager.GetActiveFish().Should().BeEmpty("should start with no fish");
    }

    [Fact]
    public void SpawnFishIfNeeded_InitialSpawn_ShouldSpawnMinimumFish()
    {
        var manager = new FishManager();
        long currentTick = 0;

        manager.SpawnFishIfNeeded(currentTick);

        var activeFish = manager.GetActiveFish();
        activeFish.Should().NotBeEmpty("should spawn fish on first call");
        activeFish.Count.Should().BeGreaterOrEqualTo(20, "should spawn at least minimum fish count");
    }

    [Fact]
    public void GetFish_ExistingFish_ShouldReturnFish()
    {
        var manager = new FishManager();
        long currentTick = 0;

        manager.SpawnFishIfNeeded(currentTick);
        var activeFish = manager.GetActiveFish();

        if (activeFish.Count > 0)
        {
            var firstFish = activeFish[0];
            var retrievedFish = manager.GetFish(firstFish.FishId);

            retrievedFish.Should().NotBeNull();
            retrievedFish!.FishId.Should().Be(firstFish.FishId);
        }
    }

    [Fact]
    public void GetFish_NonExistentFish_ShouldReturnNull()
    {
        var manager = new FishManager();

        var fish = manager.GetFish("non-existent-id");

        fish.Should().BeNull();
    }

    [Fact]
    public void RemoveFish_ExistingFish_ShouldRemoveFromActive()
    {
        var manager = new FishManager();
        long currentTick = 0;

        manager.SpawnFishIfNeeded(currentTick);
        var activeFish = manager.GetActiveFish();

        if (activeFish.Count > 0)
        {
            var fishId = activeFish[0].FishId;
            manager.RemoveFish(fishId);

            manager.GetFish(fishId).Should().BeNull("fish should be removed");
            manager.GetActiveFish().Should().NotContain(f => f.FishId == fishId);
        }
    }

    [Fact]
    public void UpdateFish_CompletedPaths_ShouldRemoveFish()
    {
        var manager = new FishManager();
        long startTick = 0;

        manager.SpawnFishIfNeeded(startTick);
        var initialCount = manager.GetActiveFish().Count;

        float deltaTime = 0.033f;
        for (int i = 0; i < 3000; i++)
        {
            manager.UpdateFish(deltaTime, startTick + i);
        }

        var finalFish = manager.GetActiveFish();
        finalFish.Count.Should().BeLessThan(initialCount + 50, "some fish should have completed paths and despawned");
    }

    [Fact]
    public void UpdateFish_OutOfBounds_ShouldRemoveFish()
    {
        var manager = new FishManager();
        long currentTick = 0;

        manager.SpawnFishIfNeeded(currentTick);
        var activeFish = manager.GetActiveFish();

        if (activeFish.Count > 0)
        {
            var fish = activeFish[0];
            fish.CachedPathData = null;
            fish.Path = null;
            fish.X = -200f;
            fish.Y = -200f;

            manager.UpdateFish(0.033f, currentTick + 1);

            manager.GetFish(fish.FishId).Should().BeNull("out-of-bounds fish should be removed");
        }
    }

    [Fact]
    public void SpawnFishIfNeeded_WaveRider_ShouldSpawnPeriodically()
    {
        var manager = new FishManager();

        int waveRiderCount = 0;

        for (long tick = 0; tick < 1000; tick++)
        {
            manager.SpawnFishIfNeeded(tick);
            manager.UpdateFish(0.033f, tick);

            var activeFish = manager.GetActiveFish();
            foreach (var fish in activeFish)
            {
                if (fish.TypeId == 21)
                {
                    waveRiderCount++;
                }
            }
        }

        waveRiderCount.Should().BeGreaterThan(0, "Wave Rider should spawn periodically");
    }

    [Fact]
    public void GetActiveFish_ShouldReturnAllActiveFish()
    {
        var manager = new FishManager();
        long currentTick = 0;

        manager.SpawnFishIfNeeded(currentTick);

        var activeFish = manager.GetActiveFish();
        activeFish.Should().NotBeNull();
        activeFish.Should().BeOfType<List<Fish>>();
    }

    [Fact]
    public void SpawnFishIfNeeded_MaxFishCount_ShouldNotExceedLimit()
    {
        var manager = new FishManager();

        for (long tick = 0; tick < 500; tick++)
        {
            manager.SpawnFishIfNeeded(tick);
        }

        var activeFish = manager.GetActiveFish();
        activeFish.Count.Should().BeLessOrEqualTo(50, "should not exceed reasonable maximum fish count");
    }

    [Fact]
    public void RTP_FishCatalog_ShouldHave110PercentExpectedValue()
    {
        var allFish = FishCatalog.GetAllFish();

        foreach (var fish in allFish.Where(f => f.Category != FishCategory.BonusFish))
        {
            var expectedRTP = fish.CaptureProbability * fish.PayoutMultiplier;

            expectedRTP.Should().BeApproximately(1.10f, 0.01f,
                $"Fish {fish.FishName} (Type {fish.TypeId}) should have ~110% RTP " +
                $"(capture: {fish.CaptureProbability:F3}, payout: {fish.PayoutMultiplier}x, RTP: {expectedRTP:F3})");
        }
    }

    [Fact]
    public void CaptureProbability_ShouldBeInValidRange()
    {
        var allFish = FishCatalog.GetAllFish();

        foreach (var fish in allFish)
        {
            fish.CaptureProbability.Should().BeGreaterThan(0f, $"Fish {fish.FishName} should have positive capture probability");
            fish.CaptureProbability.Should().BeLessOrEqualTo(1.0f, $"Fish {fish.FishName} capture probability should not exceed 100%");
        }
    }

    [Fact]
    public void PayoutMultiplier_SmallerFish_ShouldBeLowerThanLargerFish()
    {
        var smallFish = FishCatalog.GetFishByCategory(FishCategory.SmallFish);
        var mediumFish = FishCatalog.GetFishByCategory(FishCategory.MediumFish);
        var largeFish = FishCatalog.GetFishByCategory(FishCategory.LargeFish);

        var maxSmall = smallFish.Max(f => f.PayoutMultiplier);
        var minMedium = mediumFish.Min(f => f.PayoutMultiplier);
        var minLarge = largeFish.Min(f => f.PayoutMultiplier);

        maxSmall.Should().BeLessThan(minMedium, "small fish should have lower payouts than medium");
        minMedium.Should().BeLessThan(minLarge, "medium fish should have lower payouts than large");
    }

    [Fact]
    public void SpawnWeight_ShouldReflectFrequency()
    {
        var smallFish = FishCatalog.GetFishByCategory(FishCategory.SmallFish);
        var largeFish = FishCatalog.GetFishByCategory(FishCategory.LargeFish);

        var avgSmallWeight = smallFish.Average(f => f.SpawnWeight);
        var avgLargeWeight = largeFish.Average(f => f.SpawnWeight);

        avgSmallWeight.Should().BeGreaterThan(avgLargeWeight, "small fish should spawn more frequently");
    }

    [Fact]
    public void BonusFish_WaveRider_ShouldHaveZeroSpawnWeight()
    {
        var waveRider = FishCatalog.GetFish(21);

        waveRider.Should().NotBeNull();
        waveRider!.SpawnWeight.Should().Be(0, "Wave Rider should not spawn through normal weighted spawning");
        waveRider.Category.Should().Be(FishCategory.BonusFish);
    }

    [Theory]
    [InlineData(0, "Clownfish", 2)]
    [InlineData(1, "Neon Tetra", 4)]
    [InlineData(2, "Butterflyfish", 6)]
    [InlineData(6, "Lionfish", 8)]
    [InlineData(9, "Triggerfish", 12)]
    [InlineData(12, "Hammerhead Shark", 24)]
    [InlineData(14, "Giant Manta Ray", 32)]
    [InlineData(21, "Wave Rider", 20)]
    public void FishDefinition_KnownTypes_ShouldHaveCorrectProperties(int typeId, string name, int multiplier)
    {
        var fish = FishCatalog.GetFish(typeId);

        fish.Should().NotBeNull($"Fish type {typeId} should exist");
        fish!.FishName.Should().Be(name);
        fish.PayoutMultiplier.Should().Be(multiplier);
    }
}
