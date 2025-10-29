using OceanKing.Server.Entities;

namespace OceanKing.Server.Managers;

public class CollisionResolver
{
    public List<KillEvent> ResolveCollisions(List<Projectile> projectiles, List<Fish> fish)
    {
        var kills = new List<KillEvent>();

        foreach (var projectile in projectiles)
        {
            if (projectile.IsSpent) continue;

            foreach (var f in fish)
            {
                if (f.IsDead()) continue;

                // Simple circle collision
                var dx = projectile.X - f.X;
                var dy = projectile.Y - f.Y;
                var distanceSquared = dx * dx + dy * dy;
                var radiusSum = f.HitboxRadius + 5f; // projectile is small point

                if (distanceSquared <= radiusSum * radiusSum)
                {
                    // Hit!
                    f.Hp -= projectile.Damage;
                    projectile.IsSpent = true;

                    if (f.IsDead())
                    {
                        kills.Add(new KillEvent
                        {
                            FishId = f.FishId,
                            ProjectileId = projectile.ProjectileId
                        });
                    }

                    break; // Projectile can only hit one fish
                }
            }
        }

        return kills;
    }
}
