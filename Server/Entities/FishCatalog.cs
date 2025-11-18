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
            Description = "Common small reef fish that move in schools. Easy to catch.",
            AppearanceFrequency = "25%",
            BaseRewardValue = 1,
            Category = FishCategory.SmallFish,
            PayoutMultiplier = 2.0m,
            CaptureProbability = 0.70f,
            ExpectedValue = 1.40f,  // 0.70 × 2.0 = 1.40
            KillAnimation = "Standard 0.25s spin and fade-out with bubbles.",
            SpawnWeight = 25,
            HitboxRadius = 18f,
            BaseSpeed = 75f
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
            PayoutMultiplier = 2.4m,
            CaptureProbability = 0.65f,
            ExpectedValue = 1.56f,  // 0.65 × 2.4 = 1.56
            KillAnimation = "Standard 0.25s spin and fade-out with bubbles.",
            SpawnWeight = 25,
            HitboxRadius = 16f,
            BaseSpeed = 87.5f
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
            PayoutMultiplier = 3.0m,
            CaptureProbability = 0.60f,
            ExpectedValue = 1.80f,  // 0.60 × 3.0 = 1.80
            KillAnimation = "Standard 0.25s spin and fade-out with bubbles.",
            SpawnWeight = 20,
            HitboxRadius = 17f,
            BaseSpeed = 81.25f
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
            PayoutMultiplier = 11m,
            CaptureProbability = 0.15f,
            ExpectedValue = 1.65f,  // 0.15 × 11 = 1.65
            KillAnimation = "Standard 0.25s spin and fade-out with bubbles.",
            SpawnWeight = 10,
            HitboxRadius = 26f,
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
            PayoutMultiplier = 16m,
            CaptureProbability = 0.10f,
            ExpectedValue = 1.60f,  // 0.10 × 16 = 1.60
            KillAnimation = "Standard 0.25s spin and fade-out with bubbles.",
            SpawnWeight = 10,
            HitboxRadius = 27f,
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
            PayoutMultiplier = 27m,
            CaptureProbability = 0.12f,  // Increased from 0.05 (5% → 12%)
            ExpectedValue = 3.24f,  // 0.12 × 27 = 3.24
            KillAnimation = "Standard 0.25s spin and fade-out with bubbles.",
            SpawnWeight = 5,
            HitboxRadius = 75f,  // Increased from 45f for longer body
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
            PayoutMultiplier = 38m,
            CaptureProbability = 0.10f,  // Increased from 0.03 (3% → 10%)
            ExpectedValue = 3.80f,  // 0.10 × 38 = 3.80
            KillAnimation = "Standard 0.25s spin and fade-out with bubbles.",
            SpawnWeight = 5,
            HitboxRadius = 85f,  // Increased from 55f for longer body
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
            PayoutMultiplier = 20m,
            CaptureProbability = 0.055f,
            ExpectedValue = 1.10f,
            KillAnimation = "Advanced animation with glow, pulse, and screen shake.",
            SpawnWeight = 0,
            HitboxRadius = 35f,
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
