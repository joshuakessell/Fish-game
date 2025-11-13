using System.Collections.Concurrent;
using OceanKing.Server.Entities;

namespace OceanKing.Server.Systems;

public class BossDamageRecord
{
    public int TotalShots { get; set; }
    public decimal TotalDamage { get; set; }
    public DateTime LastHitTime { get; set; }
}

public class BossShotTracker
{
    // NOTE: Per-match instance tracking ensures boss damage is isolated to each game room
    // This prevents cross-room interference where one match's wagers affect another match's boss
    // Each match maintains its own progressive jackpot pool for boss fish
    // TODO: For persistent global progressive jackpots, migrate to PostgreSQL with room-keyed records
    
    private readonly ConcurrentDictionary<int, BossDamageRecord> _damageRecords = new();
    
    // TODO: Production - Migrate to PostgreSQL with batched writes and read-through cache
    // Current in-memory tracking is suitable for dev testing but will reset on server restart.
    // For production, implement persistent storage to maintain boss damage state across sessions.
    
    private const float MIN_PROBABILITY = 0.015f;
    private const float ONE_SHOT_CHANCE = 0.005f;
    private const float CURVE_STEEPNESS = 12.0f; // Changed from 8.0f for steeper ramp
    private const float TARGET_RTP = 1.05f;
    
    public void RecordShot(int bossTypeId, decimal betValue)
    {
        _damageRecords.AddOrUpdate(
            bossTypeId,
            _ => new BossDamageRecord
            {
                TotalShots = 1,
                TotalDamage = betValue,
                LastHitTime = DateTime.UtcNow
            },
            (_, record) =>
            {
                record.TotalShots++;
                record.TotalDamage += betValue;
                record.LastHitTime = DateTime.UtcNow;
                return record;
            }
        );
    }
    
    public float GetKillProbability(int bossTypeId, decimal currentBetValue)
    {
        var bossDef = BossCatalog.GetBoss(bossTypeId);
        if (bossDef == null) return ONE_SHOT_CHANCE;
        
        if (!_damageRecords.TryGetValue(bossTypeId, out var record))
        {
            return ONE_SHOT_CHANCE; // 0.5% one-shot chance
        }
        
        // Calculate damage ratio toward break-even at 105% RTP
        // Boss payout = BaseValue × AVG_MULTIPLIER (1.74)
        // For 105% RTP: cumulative damage = payout / 1.05 = 1.74 / 1.05 ≈ 1.657
        decimal breakEvenDamage = bossDef.BaseValue * 1.657m;
        decimal totalDamage = record.TotalDamage + currentBetValue;
        float damageRatio = (float)(totalDamage / breakEvenDamage);
        
        // AGGRESSIVE CURVE: At break-even (damageRatio=1.0), probability should be ~15-25%
        // This ensures bosses actually die and contribute 105% RTP
        
        // Scale target max with boss value (smaller bosses = higher max, easier to kill)
        // For 500 value boss: ~50% max
        // For 5000 value boss: ~15% max
        // For 20000 value boss: ~8% max
        float targetMaxProb = 0.5f / Math.Max(1f, MathF.Log10((float)bossDef.BaseValue / 100f));
        targetMaxProb = Math.Clamp(targetMaxProb, 0.08f, 0.60f); // Bound between 8-60%
        
        // Steeper curve (k=12 instead of 8) for faster ramp-up
        const float STEEPER_K = 12.0f;
        
        // Logistic curve centered at damageRatio=1.0 (break-even point)
        // At break-even, probability ≈ targetMaxProb/2
        // At 2x break-even (damageRatio=2.0), probability ≈ targetMaxProb
        float logisticValue = targetMaxProb / (1 + MathF.Exp(-STEEPER_K * (damageRatio - 1.0f)));
        
        float finalProbability = ONE_SHOT_CHANCE + logisticValue;
        
        // Cap at reasonable max (95%) to avoid guaranteed kills
        return Math.Min(finalProbability, 0.95f);
    }
    
    public void ResetBoss(int bossTypeId)
    {
        _damageRecords.TryRemove(bossTypeId, out _);
    }
    
    public BossDamageRecord? GetRecord(int bossTypeId)
    {
        return _damageRecords.TryGetValue(bossTypeId, out var record) ? record : null;
    }
    
    public void CleanupStaleRecords(TimeSpan maxAge)
    {
        var cutoffTime = DateTime.UtcNow - maxAge;
        var staleKeys = _damageRecords
            .Where(kvp => kvp.Value.LastHitTime < cutoffTime)
            .Select(kvp => kvp.Key)
            .ToList();
        
        foreach (var key in staleKeys)
        {
            _damageRecords.TryRemove(key, out _);
        }
    }
}
