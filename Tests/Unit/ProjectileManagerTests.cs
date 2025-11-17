using Xunit;
using FluentAssertions;
using OceanKing.Server.Managers;
using OceanKing.Server.Entities;

namespace Tests.Unit;

public class ProjectileManagerTests
{
    [Fact]
    public void AddProjectile_ShouldAddToActiveProjectiles()
    {
        var manager = new ProjectileManager();
        var projectile = new Projectile
        {
            X = 100,
            Y = 100,
            DirectionX = 1,
            DirectionY = 0
        };
        
        manager.AddProjectile(projectile);
        
        var activeProjectiles = manager.GetActiveProjectiles();
        activeProjectiles.Should().Contain(projectile);
    }

    [Fact]
    public void AddProjectile_ShouldAssignNumericId()
    {
        var manager = new ProjectileManager();
        var projectile = new Projectile
        {
            X = 100,
            Y = 100
        };
        
        manager.AddProjectile(projectile);
        
        projectile.NumericId.Should().BeGreaterThan(0);
    }

    [Fact]
    public void GetProjectile_ExistingProjectile_ShouldReturnProjectile()
    {
        var manager = new ProjectileManager();
        var projectile = new Projectile
        {
            ProjectileId = "test-projectile",
            X = 100,
            Y = 100
        };
        
        manager.AddProjectile(projectile);
        
        var retrieved = manager.GetProjectile("test-projectile");
        retrieved.Should().Be(projectile);
    }

    [Fact]
    public void GetProjectile_NonExistingProjectile_ShouldReturnNull()
    {
        var manager = new ProjectileManager();
        
        var retrieved = manager.GetProjectile("non-existing");
        
        retrieved.Should().BeNull();
    }

    [Fact]
    public void RemoveProjectile_ShouldRemoveFromActive()
    {
        var manager = new ProjectileManager();
        var projectile = new Projectile
        {
            ProjectileId = "test-projectile",
            X = 100,
            Y = 100
        };
        
        manager.AddProjectile(projectile);
        manager.RemoveProjectile("test-projectile");
        
        var activeProjectiles = manager.GetActiveProjectiles();
        activeProjectiles.Should().NotContain(projectile);
    }

    [Fact]
    public void UpdateProjectiles_ShouldMoveProjectiles()
    {
        var manager = new ProjectileManager();
        var projectile = new Projectile
        {
            X = 100,
            Y = 100,
            DirectionX = 1,
            DirectionY = 0,
            Speed = 100
        };
        
        manager.AddProjectile(projectile);
        manager.UpdateProjectiles(0.1f);
        
        projectile.X.Should().BeGreaterThan(100, "projectile should move in the direction");
    }

    [Fact]
    public void UpdateProjectiles_ExpiredProjectile_ShouldRemove()
    {
        var manager = new ProjectileManager();
        var projectile = new Projectile
        {
            X = 100,
            Y = 100,
            TtlTicks = 1
        };
        
        manager.AddProjectile(projectile);
        manager.UpdateProjectiles(0.1f);
        manager.UpdateProjectiles(0.1f);
        
        var activeProjectiles = manager.GetActiveProjectiles();
        activeProjectiles.Should().NotContain(projectile, "expired projectiles should be removed");
    }

    [Fact]
    public void UpdateProjectiles_SpentProjectile_ShouldRemove()
    {
        var manager = new ProjectileManager();
        var projectile = new Projectile
        {
            X = 100,
            Y = 100,
            IsSpent = true
        };
        
        manager.AddProjectile(projectile);
        manager.UpdateProjectiles(0.1f);
        
        var activeProjectiles = manager.GetActiveProjectiles();
        activeProjectiles.Should().NotContain(projectile, "spent projectiles should be removed");
    }

    [Fact]
    public void UpdateProjectiles_HomingProjectile_ShouldTrackTarget()
    {
        var manager = new ProjectileManager();
        var projectile = new Projectile
        {
            X = 100,
            Y = 100,
            DirectionX = 1,
            DirectionY = 0,
            TargetFishId = 999
        };
        
        var targetFish = new Fish
        {
            FishIdHash = 999,
            X = 100,
            Y = 200,
            TypeId = 1,
            BaseValue = 10
        };
        
        manager.AddProjectile(projectile);
        manager.UpdateProjectiles(0.1f, new List<Fish> { targetFish });
        
        projectile.DirectionY.Should().NotBe(0, "homing projectile should adjust direction toward target");
    }

    [Fact]
    public void GetActiveProjectiles_ShouldReturnAllActive()
    {
        var manager = new ProjectileManager();
        
        manager.AddProjectile(new Projectile { X = 100, Y = 100 });
        manager.AddProjectile(new Projectile { X = 200, Y = 200 });
        manager.AddProjectile(new Projectile { X = 300, Y = 300 });
        
        var activeProjectiles = manager.GetActiveProjectiles();
        activeProjectiles.Should().HaveCount(3);
    }

    [Fact]
    public void AddProjectile_MultipleProjectiles_ShouldHaveUniqueNumericIds()
    {
        var manager = new ProjectileManager();
        
        var proj1 = new Projectile { X = 100, Y = 100 };
        var proj2 = new Projectile { X = 200, Y = 200 };
        
        manager.AddProjectile(proj1);
        manager.AddProjectile(proj2);
        
        proj1.NumericId.Should().NotBe(proj2.NumericId);
    }
}
