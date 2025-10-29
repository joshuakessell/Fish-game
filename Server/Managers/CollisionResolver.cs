using OceanKing.Server.Entities;

namespace OceanKing.Server.Managers;

public class CollisionResolver
{
    private readonly PlayerManager _playerManager;
    
    public CollisionResolver(PlayerManager playerManager)
    {
        _playerManager = playerManager;
    }
    
    public List<KillEvent> ResolveCollisions(List<Projectile> projectiles, List<Fish> fish)
    {
        var kills = new List<KillEvent>();

        foreach (var projectile in projectiles)
        {
            if (projectile.IsSpent) continue;

            foreach (var f in fish)
            {
                // Simple circle collision
                var dx = projectile.X - f.X;
                var dy = projectile.Y - f.Y;
                var distanceSquared = dx * dx + dy * dy;
                var radiusSum = f.HitboxRadius + 5f; // projectile is small point

                if (distanceSquared <= radiusSum * radiusSum)
                {
                    // Hit! Mark projectile as spent
                    projectile.IsSpent = true;

                    // Get player for hot seat bonus
                    var player = _playerManager.GetPlayer(projectile.OwnerPlayerId);
                    float luckMultiplier = player?.LuckMultiplier ?? 1.0f;
                    
                    // Casino-style: Each hit has a random chance to destroy the fish
                    // Apply hot seat bonus if player is lucky
                    float adjustedOdds = f.DestructionOdds * luckMultiplier;
                    float roll = Random.Shared.NextSingle(); // 0.0 to 1.0
                    
                    if (roll < adjustedOdds)
                    {
                        // Lucky shot! This bullet destroys the fish
                        kills.Add(new KillEvent
                        {
                            FishId = f.FishId,
                            ProjectileId = projectile.ProjectileId
                        });
                        
                        // Fish is destroyed, no other bullets can hit it this tick
                        break;
                    }
                    
                    // Bullet hit but didn't destroy - just wasted the shot
                    break; // Projectile can only hit one fish
                }
            }
        }

        return kills;
    }
}
