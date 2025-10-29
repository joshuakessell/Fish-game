using OceanKing.Server.Entities;

namespace OceanKing.Server.Managers;

public class CollisionResolver
{
    private readonly PlayerManager _playerManager;
    
    public CollisionResolver(PlayerManager playerManager)
    {
        _playerManager = playerManager;
    }
    
    public List<KillEvent> ResolveCollisions(
        List<Projectile> projectiles, 
        List<Fish> fish,
        KillSequenceHandler killSequenceHandler,
        InteractionManager interactionManager,
        long currentTick)
    {
        var kills = new List<KillEvent>();

        foreach (var projectile in projectiles)
        {
            if (projectile.IsSpent) continue;

            foreach (var f in fish)
            {
                var dx = projectile.X - f.X;
                var dy = projectile.Y - f.Y;
                var distanceSquared = dx * dx + dy * dy;
                var radiusSum = f.HitboxRadius + 5f;

                if (distanceSquared <= radiusSum * radiusSum)
                {
                    projectile.IsSpent = true;

                    var player = _playerManager.GetPlayer(projectile.OwnerPlayerId);
                    float luckMultiplier = player?.LuckMultiplier ?? 1.0f;
                    
                    float adjustedOdds = f.DestructionOdds * luckMultiplier;
                    float roll = Random.Shared.NextSingle();
                    
                    if (roll < adjustedOdds)
                    {
                        if (BossCatalog.IsBoss(f.TypeId))
                        {
                            var bossDef = BossCatalog.GetBoss(f.TypeId);
                            if (bossDef != null)
                            {
                                var multipliers = new[] { 1m, 2m, 3m, 5m, 10m, 20m };
                                var weights = new[] { 70, 15, 8, 5, 1.5f, 0.5f };
                                var totalWeight = weights.Sum();
                                var randomValue = Random.Shared.NextSingle() * totalWeight;
                                
                                decimal multiplier = 1m;
                                float cumulativeWeight = 0f;
                                for (int i = 0; i < weights.Length; i++)
                                {
                                    cumulativeWeight += weights[i];
                                    if (randomValue < cumulativeWeight)
                                    {
                                        multiplier = multipliers[i];
                                        break;
                                    }
                                }

                                var basePayout = f.BaseValue * multiplier;
                                
                                killSequenceHandler.StartBossKillSequence(
                                    f.TypeId, 
                                    projectile.OwnerPlayerId, 
                                    basePayout,
                                    currentTick);

                                if (bossDef.RequiresInteraction)
                                {
                                    var sequence = killSequenceHandler.GetPendingInteraction(projectile.OwnerPlayerId);
                                    if (sequence != null)
                                    {
                                        interactionManager.CreateInteraction(
                                            sequence.SequenceId,
                                            projectile.OwnerPlayerId,
                                            f.TypeId,
                                            bossDef.InteractionType,
                                            currentTick);
                                    }
                                }
                            }
                        }
                        else
                        {
                            kills.Add(new KillEvent
                            {
                                FishId = f.FishId,
                                ProjectileId = projectile.ProjectileId
                            });
                        }
                        
                        break;
                    }
                    
                    break;
                }
            }
        }

        return kills;
    }
}
