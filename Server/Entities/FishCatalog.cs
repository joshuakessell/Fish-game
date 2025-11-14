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
    public int PayoutMultiplier { get; set; }
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
        // 105% RTP: CaptureProbability = 1.05 / (BaseRewardValue * PayoutMultiplier)
        [0] = new FishDefinition
        {
            TypeId = 0,
            FileName = "clownfish.png",
            FishName = "Clownfish",
            Description = "Common small reef fish that move in schools. Easy to catch.",
            AppearanceFrequency = "25%",
            BaseRewardValue = 3,
            Category = FishCategory.SmallFish,
            PayoutMultiplier = 2,
            CaptureProbability = 0.175f,
            ExpectedValue = 1.05f,
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
            BaseRewardValue = 3,
            Category = FishCategory.SmallFish,
            PayoutMultiplier = 4,
            CaptureProbability = 0.0875f,
            ExpectedValue = 1.05f,
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
            BaseRewardValue = 2,
            Category = FishCategory.SmallFish,
            PayoutMultiplier = 6,
            CaptureProbability = 0.0875f,
            ExpectedValue = 1.05f,
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
            BaseRewardValue = 9,
            Category = FishCategory.MediumFish,
            PayoutMultiplier = 8,
            CaptureProbability = 0.01458f,
            ExpectedValue = 1.05f,
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
            BaseRewardValue = 8,
            Category = FishCategory.MediumFish,
            PayoutMultiplier = 12,
            CaptureProbability = 0.01094f,
            ExpectedValue = 1.05f,
            KillAnimation = "Standard 0.25s spin and fade-out with bubbles.",
            SpawnWeight = 10,
            HitboxRadius = 27f,
            BaseSpeed = 60f
        },
        
        // LARGE FISH (Types 12, 14) - Rare big wins - 10% spawn rate
        [12] = new FishDefinition
        {
            TypeId = 12,
            FileName = "hammerhead_shark.png",
            FishName = "Hammerhead Shark",
            Description = "Large predator that roams slowly. Requires focused fire to defeat.",
            AppearanceFrequency = "5%",
            BaseRewardValue = 21,
            Category = FishCategory.LargeFish,
            PayoutMultiplier = 24,
            CaptureProbability = 0.002083f,
            ExpectedValue = 1.05f,
            KillAnimation = "Standard 0.25s spin and fade-out with bubbles.",
            SpawnWeight = 5,
            HitboxRadius = 45f,
            BaseSpeed = 100f
        },
        [14] = new FishDefinition
        {
            TypeId = 14,
            FileName = "giant_manta_ray.png",
            FishName = "Giant Manta Ray",
            Description = "Large graceful fish that glides through the water. Requires focused fire to defeat.",
            AppearanceFrequency = "5%",
            BaseRewardValue = 28,
            Category = FishCategory.LargeFish,
            PayoutMultiplier = 32,
            CaptureProbability = 0.001172f,
            ExpectedValue = 1.05f,
            KillAnimation = "Standard 0.25s spin and fade-out with bubbles.",
            SpawnWeight = 5,
            HitboxRadius = 55f,
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
            BaseRewardValue = 17,
            Category = FishCategory.BonusFish,
            PayoutMultiplier = 20,
            CaptureProbability = 0.00353f,
            ExpectedValue = 1.2f,
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
