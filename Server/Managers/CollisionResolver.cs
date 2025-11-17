using OceanKing.Server.Entities;
using OceanKing.Server.Systems;

namespace OceanKing.Server.Managers;

public class CollisionResolver
{
    private readonly PlayerManager _playerManager;
    private readonly BossShotTracker _bossShotTracker;
    private readonly HotColdCycleManager _hotColdManager;
    
    public CollisionResolver(PlayerManager playerManager, BossShotTracker bossShotTracker, HotColdCycleManager hotColdManager)
    {
        _playerManager = playerManager;
        _bossShotTracker = bossShotTracker;
        _hotColdManager = hotColdManager;
    }
    
    public List<KillEvent> ResolveCollisions(
        List<Projectile> projectiles, 
        List<Fish> fish,
        KillSequenceHandler killSequenceHandler,
        InteractionManager interactionManager,
        long currentTick)
    {
        var kills = new List<KillEvent>();

        // Debug: Log that collision detection is running
        if (projectiles.Count > 0 && fish.Count > 0)
        {
            Console.WriteLine($"[COLLISION] Checking {projectiles.Count} projectiles against {fish.Count} fish");
        }

        foreach (var projectile in projectiles)
        {
            if (projectile.IsSpent) continue;

            foreach (var f in fish)
            {
                var dx = projectile.X - f.X;
                var dy = projectile.Y - f.Y;
                var distanceSquared = dx * dx + dy * dy;
                var radiusSum = f.HitboxRadius + 5f;

                // Debug: Log close projectiles to understand coordinate space
                if (distanceSquared <= (radiusSum * radiusSum * 4)) // Log when within 2x hit radius
                {
                    var distance = Math.Sqrt(distanceSquared);
                    Console.WriteLine($"[COLLISION] Projectile at ({projectile.X:F1}, {projectile.Y:F1}) near Fish {f.FishId} at ({f.X:F1}, {f.Y:F1}) - Distance: {distance:F1}, HitRadius: {radiusSum:F1}");
                }

                if (distanceSquared <= radiusSum * radiusSum)
                {
                    projectile.IsSpent = true;

                    var player = _playerManager.GetPlayer(projectile.OwnerPlayerId);
                    
                    if (BossCatalog.IsBoss(f.TypeId))
                    {
                        _bossShotTracker.RecordShot(f.TypeId, projectile.BetValue);
                        
                        float baseKillProbability = _bossShotTracker.GetKillProbability(f.TypeId, projectile.BetValue);
                        float hotColdMultiplier = _hotColdManager.GetBossOddsMultiplier();
                        float killProbability = baseKillProbability * hotColdMultiplier;
                        float roll = Random.Shared.NextSingle();
                        
                        var record = _bossShotTracker.GetRecord(f.TypeId);
                        Console.WriteLine($"[Boss] Type {f.TypeId} hit by {player?.DisplayName ?? "unknown"} - " +
                                        $"Cumulative: {record?.TotalShots ?? 0} shots, ${record?.TotalDamage ?? 0} damage - " +
                                        $"Base probability: {baseKillProbability * 100:F2}%, Hot/Cold: x{hotColdMultiplier:F1}, Final: {killProbability * 100:F2}% - Roll: {roll * 100:F2}%");
                        
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
                                    projectile.BetValue,
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
                                Console.WriteLine($"[KILL] Fish {f.FishId} (type {f.TypeId}) killed! Roll {roll:F3} < Probability {killProbability:F3}");
                                kills.Add(new KillEvent
                                {
                                    FishId = f.FishId,
                                    ProjectileId = projectile.ProjectileId
                                });
                            }
                            else
                            {
                                Console.WriteLine($"[MISS] Fish {f.FishId} (type {f.TypeId}) survived. Roll {roll:F3} >= Probability {killProbability:F3}");
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
