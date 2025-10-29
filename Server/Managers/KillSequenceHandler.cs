using OceanKing.Server.Entities;

namespace OceanKing.Server.Managers;

public class BossKillSequence
{
    public string SequenceId { get; set; } = Guid.NewGuid().ToString();
    public int BossTypeId { get; set; }
    public string KillerPlayerId { get; set; } = string.Empty;
    public decimal BasePayout { get; set; }
    public BossDeathEffect EffectType { get; set; }
    public long StartTick { get; set; }
    public int CurrentStep { get; set; }
    public List<string> AffectedFishIds { get; set; } = new();
    public decimal PerformanceModifier { get; set; } = 1.0m;
    public bool IsInteractive { get; set; }
    public bool WaitingForInteraction { get; set; }
}

public class BossKillResult
{
    public string KillerPlayerId { get; set; } = string.Empty;
    public decimal TotalPayout { get; set; }
    public List<string> DestroyedFishIds { get; set; } = new();
    public BossDeathEffect EffectType { get; set; }
    public int EffectStep { get; set; }
}

public class KillSequenceHandler
{
    private readonly List<BossKillSequence> _activeSequences = new();
    private readonly FishManager _fishManager;
    
    public KillSequenceHandler(FishManager fishManager)
    {
        _fishManager = fishManager;
    }

    public void StartBossKillSequence(int bossTypeId, string killerPlayerId, decimal basePayout, long currentTick)
    {
        var bossDef = BossCatalog.GetBoss(bossTypeId);
        if (bossDef == null) return;

        var sequence = new BossKillSequence
        {
            BossTypeId = bossTypeId,
            KillerPlayerId = killerPlayerId,
            BasePayout = basePayout,
            EffectType = bossDef.DeathEffect,
            StartTick = currentTick,
            CurrentStep = 0,
            IsInteractive = bossDef.RequiresInteraction,
            WaitingForInteraction = bossDef.RequiresInteraction
        };

        _activeSequences.Add(sequence);
        
        Console.WriteLine($"Boss kill sequence started: {bossDef.Name} by {killerPlayerId}, payout: {basePayout}");
    }

    public void ApplyInteractionResult(string sequenceId, decimal performanceModifier)
    {
        var sequence = _activeSequences.FirstOrDefault(s => s.SequenceId == sequenceId);
        if (sequence == null) return;

        sequence.PerformanceModifier = performanceModifier;
        sequence.WaitingForInteraction = false;
        
        Console.WriteLine($"Interaction completed for sequence {sequenceId}, modifier: {performanceModifier:P0}");
    }

    public List<BossKillResult> ProcessSequences(long currentTick)
    {
        var results = new List<BossKillResult>();
        var sequencesToRemove = new List<BossKillSequence>();

        foreach (var sequence in _activeSequences)
        {
            if (sequence.WaitingForInteraction)
            {
                if (currentTick - sequence.StartTick > 300) // 10 second timeout
                {
                    sequence.PerformanceModifier = 0.7m; // -30% for timeout
                    sequence.WaitingForInteraction = false;
                    Console.WriteLine($"Interaction timeout for sequence {sequence.SequenceId}, applying -30% modifier");
                }
                else
                {
                    continue;
                }
            }

            var result = ProcessSequenceStep(sequence, currentTick);
            if (result != null)
            {
                results.Add(result);
            }

            if (IsSequenceComplete(sequence, currentTick))
            {
                sequencesToRemove.Add(sequence);
            }
        }

        foreach (var seq in sequencesToRemove)
        {
            _activeSequences.Remove(seq);
        }

        return results;
    }

    private BossKillResult? ProcessSequenceStep(BossKillSequence sequence, long currentTick)
    {
        var ticksSinceStart = currentTick - sequence.StartTick;
        var effectInterval = 15; // Execute effect every 0.5 seconds (15 ticks at 30 TPS)
        
        if (ticksSinceStart % effectInterval != 0) return null;

        var stepNumber = (int)(ticksSinceStart / effectInterval);
        if (stepNumber <= sequence.CurrentStep) return null;

        sequence.CurrentStep = stepNumber;

        var result = new BossKillResult
        {
            KillerPlayerId = sequence.KillerPlayerId,
            EffectType = sequence.EffectType,
            EffectStep = stepNumber
        };

        var activeFish = _fishManager.GetActiveFish();
        var destroyedFish = new List<Fish>();

        switch (sequence.EffectType)
        {
            case BossDeathEffect.ScreenWipe:
                destroyedFish = ExecuteScreenWipe(activeFish, stepNumber);
                break;
                
            case BossDeathEffect.SectorBlast:
                destroyedFish = ExecuteSectorBlast(activeFish, stepNumber);
                break;
                
            case BossDeathEffect.VortexPull:
                destroyedFish = ExecuteVortexPull(activeFish, stepNumber);
                break;
                
            case BossDeathEffect.LineClear:
                destroyedFish = ExecuteLineClear(activeFish, stepNumber);
                break;
                
            case BossDeathEffect.ChainLightning:
                destroyedFish = ExecuteChainLightning(activeFish, stepNumber);
                break;
                
            case BossDeathEffect.LootDrop:
                destroyedFish = new List<Fish>();
                break;
                
            case BossDeathEffect.ExplosionRing:
                destroyedFish = ExecuteExplosionRing(activeFish, stepNumber);
                break;
                
            case BossDeathEffect.TimeFreeze:
                destroyedFish = ExecuteTimeFreeze(activeFish, stepNumber);
                break;
        }

        foreach (var fish in destroyedFish)
        {
            result.DestroyedFishIds.Add(fish.FishId);
            sequence.AffectedFishIds.Add(fish.FishId);
            _fishManager.RemoveFish(fish.FishId);
        }

        if (stepNumber == GetMaxStepsForEffect(sequence.EffectType))
        {
            var totalFishValue = destroyedFish.Sum(f => f.BaseValue);
            result.TotalPayout = (sequence.BasePayout + totalFishValue) * sequence.PerformanceModifier;
        }

        return result.DestroyedFishIds.Count > 0 || result.TotalPayout > 0 ? result : null;
    }

    private List<Fish> ExecuteScreenWipe(List<Fish> activeFish, int step)
    {
        if (step != 1) return new List<Fish>();
        
        return activeFish
            .Where(f => f.TypeId < 9)
            .OrderBy(_ => Random.Shared.Next())
            .Take(30)
            .ToList();
    }

    private List<Fish> ExecuteSectorBlast(List<Fish> activeFish, int step)
    {
        if (step < 1 || step > 3) return new List<Fish>();
        
        var sectorX = step switch
        {
            1 => 400f,
            2 => 800f,
            3 => 1200f,
            _ => 800f
        };
        
        return activeFish
            .Where(f => f.TypeId < 9 && Math.Abs(f.X - sectorX) < 300)
            .Take(8)
            .ToList();
    }

    private List<Fish> ExecuteVortexPull(List<Fish> activeFish, int step)
    {
        if (step < 1 || step > 2) return new List<Fish>();
        
        const float centerX = 800f;
        const float centerY = 400f;
        
        return activeFish
            .Where(f => f.TypeId < 9)
            .OrderBy(f => (f.X - centerX) * (f.X - centerX) + (f.Y - centerY) * (f.Y - centerY))
            .Take(10)
            .ToList();
    }

    private List<Fish> ExecuteLineClear(List<Fish> activeFish, int step)
    {
        if (step != 1) return new List<Fish>();
        
        var lineY = 400f;
        
        return activeFish
            .Where(f => f.TypeId < 9 && Math.Abs(f.Y - lineY) < 100)
            .Take(15)
            .ToList();
    }

    private List<Fish> ExecuteChainLightning(List<Fish> activeFish, int step)
    {
        if (step < 1 || step > 5) return new List<Fish>();
        
        return activeFish
            .Where(f => f.TypeId < 9)
            .OrderBy(_ => Random.Shared.Next())
            .Take(2)
            .ToList();
    }

    private List<Fish> ExecuteExplosionRing(List<Fish> activeFish, int step)
    {
        if (step != 1) return new List<Fish>();
        
        return activeFish
            .Where(f => f.TypeId < 9)
            .OrderBy(_ => Random.Shared.Next())
            .Take(12)
            .ToList();
    }

    private List<Fish> ExecuteTimeFreeze(List<Fish> activeFish, int step)
    {
        if (step != 2) return new List<Fish>();
        
        return activeFish
            .Where(f => f.TypeId < 9)
            .OrderBy(_ => Random.Shared.Next())
            .Take(20)
            .ToList();
    }

    private int GetMaxStepsForEffect(BossDeathEffect effect)
    {
        return effect switch
        {
            BossDeathEffect.ScreenWipe => 2,
            BossDeathEffect.SectorBlast => 3,
            BossDeathEffect.VortexPull => 2,
            BossDeathEffect.LineClear => 1,
            BossDeathEffect.ChainLightning => 5,
            BossDeathEffect.LootDrop => 1,
            BossDeathEffect.ExplosionRing => 1,
            BossDeathEffect.TimeFreeze => 2,
            _ => 1
        };
    }

    private bool IsSequenceComplete(BossKillSequence sequence, long currentTick)
    {
        var ticksSinceStart = currentTick - sequence.StartTick;
        var maxTicks = GetMaxStepsForEffect(sequence.EffectType) * 15 + 30;
        return ticksSinceStart >= maxTicks;
    }

    public List<BossKillSequence> GetActiveSequences()
    {
        return _activeSequences.ToList();
    }

    public BossKillSequence? GetPendingInteraction(string playerId)
    {
        return _activeSequences.FirstOrDefault(s => 
            s.KillerPlayerId == playerId && 
            s.IsInteractive && 
            s.WaitingForInteraction);
    }
}
