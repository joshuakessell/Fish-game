using Xunit;
using FluentAssertions;
using Moq;
using OceanKing.Server.Managers;
using OceanKing.Server.Entities;
using OceanKing.Server.Systems;

namespace Tests.Unit;

public class CollisionResolverTests
{
    [Fact]
    public void Constructor_ShouldInitialize()
    {
        var playerManager = new PlayerManager();
        var bossShotTracker = new BossShotTracker();
        
        var resolver = new CollisionResolver(playerManager, bossShotTracker);
        
        resolver.Should().NotBeNull();
    }

    [Fact]
    public void ResolveCollisions_NoProjectiles_ShouldReturnEmptyList()
    {
        var playerManager = new PlayerManager();
        var bossShotTracker = new BossShotTracker();
        var resolver = new CollisionResolver(playerManager, bossShotTracker);
        var killSeqHandler = new KillSequenceHandler(new FishManager(new Random(42)));
        var interactionManager = new InteractionManager();
        
        var kills = resolver.ResolveCollisions(
            new List<Projectile>(), 
            new List<Fish>(), 
            killSeqHandler,
            interactionManager,
            0);
        
        kills.Should().BeEmpty();
    }

    [Fact]
    public void ResolveCollisions_NoFish_ShouldReturnEmptyList()
    {
        var playerManager = new PlayerManager();
        var bossShotTracker = new BossShotTracker();
        var resolver = new CollisionResolver(playerManager, bossShotTracker);
        var killSeqHandler = new KillSequenceHandler(new FishManager(new Random(42)));
        var interactionManager = new InteractionManager();
        
        var projectile = new Projectile
        {
            X = 100,
            Y = 100,
            OwnerPlayerId = "player1",
            BetValue = 10
        };
        
        var kills = resolver.ResolveCollisions(
            new List<Projectile> { projectile }, 
            new List<Fish>(), 
            killSeqHandler,
            interactionManager,
            0);
        
        kills.Should().BeEmpty();
    }

    [Fact]
    public void ResolveCollisions_ProjectileHitsFish_ShouldMarkProjectileAsSpent()
    {
        var playerManager = new PlayerManager();
        playerManager.AddPlayer("player1", "Test Player", "conn1");
        
        var bossShotTracker = new BossShotTracker();
        var resolver = new CollisionResolver(playerManager, bossShotTracker);
        var killSeqHandler = new KillSequenceHandler(new FishManager(new Random(42)));
        var interactionManager = new InteractionManager();
        
        var projectile = new Projectile
        {
            X = 100,
            Y = 100,
            OwnerPlayerId = "player1",
            BetValue = 10,
            IsSpent = false
        };
        
        var fish = new Fish
        {
            FishId = "fish1",
            TypeId = 1,
            X = 100,
            Y = 100,
            HitboxRadius = 20,
            BaseValue = 5
        };
        
        resolver.ResolveCollisions(
            new List<Projectile> { projectile }, 
            new List<Fish> { fish }, 
            killSeqHandler,
            interactionManager,
            0);
        
        projectile.IsSpent.Should().BeTrue("projectile should be marked as spent after collision");
    }

    [Fact]
    public void ResolveCollisions_SpentProjectile_ShouldNotCollide()
    {
        var playerManager = new PlayerManager();
        var bossShotTracker = new BossShotTracker();
        var resolver = new CollisionResolver(playerManager, bossShotTracker);
        var killSeqHandler = new KillSequenceHandler(new FishManager(new Random(42)));
        var interactionManager = new InteractionManager();
        
        var projectile = new Projectile
        {
            X = 100,
            Y = 100,
            OwnerPlayerId = "player1",
            BetValue = 10,
            IsSpent = true
        };
        
        var fish = new Fish
        {
            FishId = "fish1",
            TypeId = 1,
            X = 100,
            Y = 100,
            HitboxRadius = 20,
            BaseValue = 5
        };
        
        var kills = resolver.ResolveCollisions(
            new List<Projectile> { projectile }, 
            new List<Fish> { fish }, 
            killSeqHandler,
            interactionManager,
            0);
        
        kills.Should().BeEmpty("spent projectiles should not trigger collisions");
    }

    [Fact]
    public void ResolveCollisions_BossHit_ShouldRecordShotInTracker()
    {
        var playerManager = new PlayerManager();
        playerManager.AddPlayer("player1", "Test Player", "conn1");
        
        var bossShotTracker = new BossShotTracker();
        var resolver = new CollisionResolver(playerManager, bossShotTracker);
        var killSeqHandler = new KillSequenceHandler(new FishManager(new Random(42)));
        var interactionManager = new InteractionManager();
        
        var projectile = new Projectile
        {
            X = 100,
            Y = 100,
            OwnerPlayerId = "player1",
            BetValue = 50,
            IsSpent = false
        };
        
        var bossFish = new Fish
        {
            FishId = "boss1",
            TypeId = 9,
            X = 100,
            Y = 100,
            HitboxRadius = 40,
            BaseValue = 500
        };
        
        resolver.ResolveCollisions(
            new List<Projectile> { projectile }, 
            new List<Fish> { bossFish }, 
            killSeqHandler,
            interactionManager,
            0);
        
        var record = bossShotTracker.GetRecord(9);
        record.Should().NotBeNull("boss shot should be recorded");
        record!.TotalShots.Should().Be(1);
        record.TotalDamage.Should().Be(50);
    }

    [Fact]
    public void ResolveCollisions_RegularFishWithHighProbability_CanKillFish()
    {
        var playerManager = new PlayerManager();
        playerManager.AddPlayer("player1", "Test Player", "conn1");
        
        var bossShotTracker = new BossShotTracker();
        var resolver = new CollisionResolver(playerManager, bossShotTracker);
        var killSeqHandler = new KillSequenceHandler(new FishManager(new Random(42)));
        var interactionManager = new InteractionManager();
        
        int killCount = 0;
        
        for (int i = 0; i < 100; i++)
        {
            var projectile = new Projectile
            {
                X = 100,
                Y = 100,
                OwnerPlayerId = "player1",
                BetValue = 10,
                IsSpent = false
            };
            
            var fish = new Fish
            {
                FishId = $"fish{i}",
                TypeId = 1,
                X = 100,
                Y = 100,
                HitboxRadius = 20,
                BaseValue = 5
            };
            
            var kills = resolver.ResolveCollisions(
                new List<Projectile> { projectile }, 
                new List<Fish> { fish }, 
                killSeqHandler,
                interactionManager,
                0);
            
            if (kills.Count > 0)
            {
                killCount++;
            }
        }
        
        killCount.Should().BeGreaterThan(0, "some fish should be killed with random probability");
    }

    [Fact]
    public void ResolveCollisions_OutOfRange_ShouldNotCollide()
    {
        var playerManager = new PlayerManager();
        var bossShotTracker = new BossShotTracker();
        var resolver = new CollisionResolver(playerManager, bossShotTracker);
        var killSeqHandler = new KillSequenceHandler(new FishManager(new Random(42)));
        var interactionManager = new InteractionManager();
        
        var projectile = new Projectile
        {
            X = 100,
            Y = 100,
            OwnerPlayerId = "player1",
            BetValue = 10,
            IsSpent = false
        };
        
        var fish = new Fish
        {
            FishId = "fish1",
            TypeId = 1,
            X = 500,
            Y = 500,
            HitboxRadius = 20,
            BaseValue = 5
        };
        
        var kills = resolver.ResolveCollisions(
            new List<Projectile> { projectile }, 
            new List<Fish> { fish }, 
            killSeqHandler,
            interactionManager,
            0);
        
        projectile.IsSpent.Should().BeFalse("projectile should not hit fish that is out of range");
        kills.Should().BeEmpty();
    }
}
