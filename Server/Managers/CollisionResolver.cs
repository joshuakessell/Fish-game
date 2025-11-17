using OceanKing.Server.Entities;
using OceanKing.Server.Systems;

namespace OceanKing.Server.Managers;

public class CollisionResolver
{
    private readonly PlayerManager _playerManager;
    private readonly BossShotTracker _bossShotTracker;
    
    public CollisionResolver(PlayerManager playerManager, BossShotTracker bossShotTracker)
    {
        _playerManager = playerManager;
        _bossShotTracker = bossShotTracker;
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
                    
                    if (BossCatalog.IsBoss(f.TypeId))
                    {
                        _bossShotTracker.RecordShot(f.TypeId, projectile.BetValue);
                        
                        float killProbability = _bossShotTracker.GetKillProbability(f.TypeId, projectile.BetValue);
                        float roll = Random.Shared.NextSingle();
                        
                        var record = _bossShotTracker.GetRecord(f.TypeId);
                        Console.WriteLine($"[Boss] Type {f.TypeId} hit by {player?.DisplayName ?? "unknown"} - " +
                                        $"Cumulative: {record?.TotalShots ?? 0} shots, ${record?.TotalDamage ?? 0} damage - " +
                                        $"Kill probability: {killProbability * 100:F2}% - Roll: {roll * 100:F2}%");
                        
                        if (roll < killProbability)
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
                                
                                Console.WriteLine($"[Boss] KILLED! Type {f.TypeId} by {player?.DisplayName ?? "unknown"} - " +
                                                $"Base payout: ${basePayout} (x{multiplier})");
                                
                                _bossShotTracker.ResetBoss(f.TypeId);
                                
                                killSequenceHandler.StartBossKillSequence(
                                    f.TypeId,
                                    f.FishIdHash,
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
                    }
                    else
                    {
                        var fishDef = FishCatalog.GetFish(f.TypeId);
                        if (fishDef != null)
                        {
                            float killProbability = fishDef.CaptureProbability;
                            float roll = Random.Shared.NextSingle();
                            
                            if (roll < killProbability)
                            {
                                kills.Add(new KillEvent
                                {
                                    FishId = f.FishId,
                                    ProjectileId = projectile.ProjectileId
                                });
                            }
                        }
                    }
                    
                    break;
                }
            }
        }

        return kills;
    }
}
