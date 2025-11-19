namespace OceanKing.Server.Entities;

public enum FishCategory
{
    SmallFish,      // 2x to 10x payout, high capture probability
    MediumFish,     // 12x to 20x payout, moderate capture probability
    LargeFish,      // 30x to 80x payout, low capture probability
    BonusFish       // Special bonus fish that spawns periodically
}

public class FishDefinition
{
    public int TypeId { get; set; }
    public string FileName { get; set; } = "";
    public string FishName { get; set; } = "";
    public string Description { get; set; } = "";
    public string AppearanceFrequency { get; set; } = "";
    public int BaseRewardValue { get; set; }
    public FishCategory Category { get; set; }
    public decimal PayoutMultiplier { get; set; }
    public float CaptureProbability { get; set; }
    public float ExpectedValue { get; set; }
    public string KillAnimation { get; set; } = "";
    
    // Computed spawn weight (0-100 for percentages)
    public int SpawnWeight { get; set; }
    
    // Visual properties
    public float HitboxRadius { get; set; }
    public float BaseSpeed { get; set; }
}

public static class FishCatalog
{
    private static readonly Dictionary<int, FishDefinition> _catalog = new()
    {
        // SMALL FISH (Types 0-2) - Common, frequent wins - 70% spawn rate
        // HIGH VOLATILITY REBALANCE: High capture rates with INCREASED payouts
        // Goal: ~55-60% RTP contribution
        [0] = new FishDefinition
        {
            TypeId = 0,
            FileName = "clownfish.png",
            FishName = "Clownfish",
            Description = "Common small reef fish that move in schools of 3-6. Quick and easy to catch.",
            AppearanceFrequency = "25%",
            BaseRewardValue = 1,
            Category = FishCategory.SmallFish,
            PayoutMultiplier = 3.0m,  // Increased 50% from 2.0
            CaptureProbability = 0.70f,
            ExpectedValue = 2.10f,  // 0.70 × 3.0 = 2.10
            KillAnimation = "Standard 0.25s spin and fade-out with bubbles.",
            SpawnWeight = 25,
            HitboxRadius = 22f,  // Increased from 18f (1.22x larger)
            BaseSpeed = 120f     // Small fish swim faster for better gameplay flow
        },
        [1] = new FishDefinition
        {
            TypeId = 1,
            FileName = "neon_tetra.png",
            FishName = "Neon Tetra",
            Description = "Common small reef fish that move in schools. Easy to catch.",
            AppearanceFrequency = "25%",
            BaseRewardValue = 1,
            Category = FishCategory.SmallFish,
            PayoutMultiplier = 3.6m,  // Increased 50% from 2.4
            CaptureProbability = 0.65f,
            ExpectedValue = 2.34f,  // 0.65 × 3.6 = 2.34
            KillAnimation = "Standard 0.25s spin and fade-out with bubbles.",
            SpawnWeight = 25,
            HitboxRadius = 16f,
            BaseSpeed = 115f     // Small fish swim faster
        },
        [2] = new FishDefinition
        {
            TypeId = 2,
            FileName = "butterflyfish.png",
            FishName = "Butterflyfish",
            Description = "Common small reef fish that move in schools. Easy to catch.",
            AppearanceFrequency = "20%",
            BaseRewardValue = 1,
            Category = FishCategory.SmallFish,
            PayoutMultiplier = 4.5m,  // Increased 50% from 3.0
            CaptureProbability = 0.60f,
            ExpectedValue = 2.70f,  // 0.60 × 4.5 = 2.70
            KillAnimation = "Standard 0.25s spin and fade-out with bubbles.",
            SpawnWeight = 20,
            HitboxRadius = 30f,  // Increased from 17f for better visibility
            BaseSpeed = 110f     // Small fish swim faster
        },
        
        // MEDIUM FISH (Types 6, 9) - Moderate wins - 20% spawn rate
        [6] = new FishDefinition
        {
            TypeId = 6,
            FileName = "lionfish.png",
            FishName = "Lionfish",
            Description = "Colorful mid-sized fish that take moderate damage before capture.",
            AppearanceFrequency = "10%",
            BaseRewardValue = 1,
            Category = FishCategory.MediumFish,
            PayoutMultiplier = 16.5m,  // Increased 50% from 11
            CaptureProbability = 0.15f,
            ExpectedValue = 2.475f,  // 0.15 × 16.5 = 2.475
            KillAnimation = "Standard 0.25s spin and fade-out with bubbles.",
            SpawnWeight = 10,
            HitboxRadius = 70f,  // Greatly increased for easier targeting
            BaseSpeed = 62.5f
        },
        [9] = new FishDefinition
        {
            TypeId = 9,
            FileName = "triggerfish.png",
            FishName = "Triggerfish",
            Description = "Colorful mid-sized fish that take moderate damage before capture.",
            AppearanceFrequency = "10%",
            BaseRewardValue = 1,
            Category = FishCategory.MediumFish,
            PayoutMultiplier = 24m,  // Increased 50% from 16
            CaptureProbability = 0.10f,
            ExpectedValue = 2.40f,  // 0.10 × 24 = 2.40
            KillAnimation = "Standard 0.25s spin and fade-out with bubbles.",
            SpawnWeight = 10,
            HitboxRadius = 50f,  // Greatly increased for easier targeting
            BaseSpeed = 60f
        },
        
        // LARGE FISH (Types 12, 14) - Rare big wins - 10% spawn rate
        // REBALANCE: Increased capture rates and hit zones for better playability
        [12] = new FishDefinition
        {
            TypeId = 12,
            FileName = "hammerhead_shark.png",
            FishName = "Hammerhead Shark",
            Description = "Large predator that roams slowly. Requires focused fire to defeat.",
            AppearanceFrequency = "5%",
            BaseRewardValue = 1,
            Category = FishCategory.LargeFish,
            PayoutMultiplier = 40.5m,  // Increased 50% from 27
            CaptureProbability = 0.12f,  // Increased from 0.05 (5% → 12%)
            ExpectedValue = 4.86f,  // 0.12 × 40.5 = 4.86
            KillAnimation = "Standard 0.25s spin and fade-out with bubbles.",
            SpawnWeight = 5,
            HitboxRadius = 120f,  // Greatly increased for easier targeting
            BaseSpeed = 100f
        },
        [14] = new FishDefinition
        {
            TypeId = 14,
            FileName = "giant_manta_ray.png",
            FishName = "Giant Manta Ray",
            Description = "Large graceful fish that glides through the water. Requires focused fire to defeat.",
            AppearanceFrequency = "5%",
            BaseRewardValue = 1,
            Category = FishCategory.LargeFish,
            PayoutMultiplier = 57m,  // Increased 50% from 38
            CaptureProbability = 0.10f,  // Increased from 0.03 (3% → 10%)
            ExpectedValue = 5.70f,  // 0.10 × 57 = 5.70
            KillAnimation = "Standard 0.25s spin and fade-out with bubbles.",
            SpawnWeight = 5,
            HitboxRadius = 135f,  // Greatly increased for easier targeting
            BaseSpeed = 81.25f
        },
        
        // BONUS FISH (Type 21) - Special periodic spawn with moderate probability
        [21] = new FishDefinition
        {
            TypeId = 21,
            FileName = "wave_rider.png",
            FishName = "Wave Rider",
            Description = "Rare bonus fish that appears periodically from the edges in a sine wave pattern.",
            AppearanceFrequency = "Periodic (every ~5 seconds)",
            BaseRewardValue = 1,
            Category = FishCategory.BonusFish,
            PayoutMultiplier = 30m,  // Increased 50% from 20
            CaptureProbability = 0.055f,
            ExpectedValue = 1.65f,  // 0.055 × 30 = 1.65
            KillAnimation = "Advanced animation with glow, pulse, and screen shake.",
            SpawnWeight = 0,
            HitboxRadius = 60f,  // Greatly increased for easier targeting
            BaseSpeed = 125f
        }
    };
    
    public static FishDefinition? GetFish(int typeId)
    {
        return _catalog.TryGetValue(typeId, out var fish) ? fish : null;
    }
    
    public static IEnumerable<FishDefinition> GetAllFish()
    {
        return _catalog.Values;
    }
    
    public static IEnumerable<FishDefinition> GetFishByCategory(FishCategory category)
    {
        return _catalog.Values.Where(f => f.Category == category);
    }
    
    public static bool IsBonusFish(int typeId)
    {
        return typeId == 21;
    }
}
