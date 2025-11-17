using Xunit;
using FluentAssertions;
using OceanKing.Server.Systems;

namespace Tests.Unit;

public class HotSeatManagerTests
{
    [Fact]
    public void Constructor_ShouldInitializeWithNoActiveHotSeat()
    {
        var manager = new HotSeatManager();

        for (int slot = 0; slot < 6; slot++)
        {
            manager.GetMultiplier(slot).Should().Be(1.0f, $"slot {slot} should have no multiplier initially");
            manager.IsHotSeat(slot).Should().BeFalse($"slot {slot} should not be hot seat initially");
        }
    }

    [Fact]
    public void GetMultiplier_NoActiveHotSeat_ShouldReturnOne()
    {
        var manager = new HotSeatManager();

        for (int slot = 0; slot < 6; slot++)
        {
            manager.GetMultiplier(slot).Should().Be(1.0f);
        }
    }

    [Fact]
    public void Update_ManyTicks_ShouldEventuallyActivateHotSeat()
    {
        var manager = new HotSeatManager();
        bool hotSeatActivated = false;

        for (int tick = 0; tick < 100000; tick++)
        {
            manager.Update(tick);

            for (int slot = 0; slot < 6; slot++)
            {
                if (manager.IsHotSeat(slot))
                {
                    hotSeatActivated = true;
                    break;
                }
            }

            if (hotSeatActivated)
                break;
        }

        hotSeatActivated.Should().BeTrue("hot seat should activate within reasonable time");
    }

    [Fact]
    public void GetMultiplier_WhenHotSeatActive_ShouldReturnValidMultiplier()
    {
        var manager = new HotSeatManager();

        for (int tick = 0; tick < 100000; tick++)
        {
            manager.Update(tick);

            for (int slot = 0; slot < 6; slot++)
            {
                var multiplier = manager.GetMultiplier(slot);

                if (manager.IsHotSeat(slot))
                {
                    multiplier.Should().BeGreaterThan(1.0f, "hot seat should have multiplier > 1.0");
                    multiplier.Should().BeOneOf(1.05f, 1.08f, 1.10f, 1.15f);
                    return;
                }
            }
        }
    }

    [Fact]
    public void IsHotSeat_OnlyOneSeatAtTime_ShouldBeTrue()
    {
        var manager = new HotSeatManager();

        for (int tick = 0; tick < 100000; tick++)
        {
            manager.Update(tick);

            int hotSeatCount = 0;
            for (int slot = 0; slot < 6; slot++)
            {
                if (manager.IsHotSeat(slot))
                {
                    hotSeatCount++;
                }
            }

            hotSeatCount.Should().BeLessOrEqualTo(1, "only one hot seat should be active at a time");

            if (hotSeatCount == 1)
                return;
        }
    }

    [Fact]
    public void Update_AfterExpiration_ShouldDeactivateHotSeat()
    {
        var random = new Random(42);
        var manager = new HotSeatManager(random);
        int activationTick = -1;
        int activeSlot = -1;

        for (int tick = 0; tick < 100000; tick++)
        {
            manager.Update(tick);

            for (int slot = 0; slot < 6; slot++)
            {
                if (manager.IsHotSeat(slot) && activationTick == -1)
                {
                    activationTick = tick;
                    activeSlot = slot;
                    break;
                }
            }

            if (activationTick != -1)
                break;
        }

        activationTick.Should().BeGreaterOrEqualTo(0, "hot seat should activate");

        for (int tick = activationTick + 1; tick < activationTick + 2000; tick++)
        {
            manager.Update(tick);
        }

        manager.IsHotSeat(activeSlot).Should().BeFalse("hot seat should expire after DURATION_TICKS");
        manager.GetMultiplier(activeSlot).Should().Be(1.0f, "multiplier should reset after expiration");
    }

    [Fact]
    public void GetMultiplier_NonHotSeatSlots_ShouldAlwaysReturnOne()
    {
        var manager = new HotSeatManager();

        for (int tick = 0; tick < 100000; tick++)
        {
            manager.Update(tick);

            int? hotSeatSlot = null;
            for (int slot = 0; slot < 6; slot++)
            {
                if (manager.IsHotSeat(slot))
                {
                    hotSeatSlot = slot;
                    break;
                }
            }

            if (hotSeatSlot.HasValue)
            {
                for (int slot = 0; slot < 6; slot++)
                {
                    if (slot != hotSeatSlot.Value)
                    {
                        manager.GetMultiplier(slot).Should().Be(1.0f, $"non-hot-seat slot {slot} should have multiplier 1.0");
                    }
                }
                return;
            }
        }
    }

    [Fact]
    public void Update_RespectsCooldown_ShouldNotActivateImmediatelyAfterExpiration()
    {
        var random = new Random(123);
        var manager = new HotSeatManager(random);
        int firstActivationTick = -1;
        int firstExpirationTick = -1;

        for (int tick = 0; tick < 100000; tick++)
        {
            manager.Update(tick);

            bool isAnyHotSeat = false;
            for (int slot = 0; slot < 6; slot++)
            {
                if (manager.IsHotSeat(slot))
                {
                    isAnyHotSeat = true;
                    if (firstActivationTick == -1)
                    {
                        firstActivationTick = tick;
                    }
                    break;
                }
            }

            if (firstActivationTick != -1 && !isAnyHotSeat && firstExpirationTick == -1)
            {
                firstExpirationTick = tick;
            }

            if (firstExpirationTick != -1 && tick < firstExpirationTick + 1800)
            {
                isAnyHotSeat.Should().BeFalse($"hot seat should not reactivate within cooldown period (tick {tick})");
            }

            if (firstExpirationTick != -1 && tick >= firstExpirationTick + 1800)
            {
                return;
            }
        }
    }

    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(3)]
    [InlineData(4)]
    [InlineData(5)]
    public void GetMultiplier_AllSlots_ShouldBeAccessible(int slot)
    {
        var manager = new HotSeatManager();

        var multiplier = manager.GetMultiplier(slot);

        multiplier.Should().BeGreaterOrEqualTo(1.0f);
    }

    [Fact]
    public void MultiplierDistribution_ShouldFollowWeightedProbabilities()
    {
        var multiplierCounts = new Dictionary<float, int>
        {
            [1.05f] = 0,
            [1.08f] = 0,
            [1.10f] = 0,
            [1.15f] = 0
        };

        for (int iteration = 0; iteration < 1000; iteration++)
        {
            var manager = new HotSeatManager();

            for (int tick = 0; tick < 100000; tick++)
            {
                manager.Update(tick);

                for (int slot = 0; slot < 6; slot++)
                {
                    if (manager.IsHotSeat(slot))
                    {
                        var multiplier = manager.GetMultiplier(slot);
                        if (multiplierCounts.ContainsKey(multiplier))
                        {
                            multiplierCounts[multiplier]++;
                        }
                        goto NextIteration;
                    }
                }
            }

            NextIteration:;
        }

        multiplierCounts[1.05f].Should().BeGreaterThan(0, "1.05x should appear");
        multiplierCounts[1.05f].Should().BeGreaterThan(multiplierCounts[1.15f], "1.05x should be more common than 1.15x (weighted)");
    }
}
