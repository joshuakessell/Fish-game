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
        // SMALL FISH (Types 0-2) - Common, easy to catch - 70% spawn rate
        [0] = new FishDefinition
        {
            TypeId = 0,
            FileName = "clownfish.png",
            FishName = "Clownfish",
            Description = "Common small reef fish that move in schools. Easy to catch.",
            AppearanceFrequency = "25%",
            BaseRewardValue = 3,
            Category = FishCategory.SmallFish,
            PayoutMultiplier = 7,
            CaptureProbability = 0.064591305843402f,
            ExpectedValue = 0.452139140903814f,
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
            PayoutMultiplier = 6,
            CaptureProbability = 0.08603861203078643f,
            ExpectedValue = 0.5162316721847185f,
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
            PayoutMultiplier = 5,
            CaptureProbability = 0.08653738659328375f,
            ExpectedValue = 0.43268693296641875f,
            KillAnimation = "Standard 0.25s spin and fade-out with bubbles.",
            SpawnWeight = 20,
            HitboxRadius = 17f,
            BaseSpeed = 81.25f
        },
        
        // MEDIUM FISH (Types 6, 9) - Moderate difficulty - 20% spawn rate
        [6] = new FishDefinition
        {
            TypeId = 6,
            FileName = "lionfish.png",
            FishName = "Lionfish",
            Description = "Colorful mid-sized fish that take moderate damage before capture.",
            AppearanceFrequency = "10%",
            BaseRewardValue = 9,
            Category = FishCategory.MediumFish,
            PayoutMultiplier = 18,
            CaptureProbability = 0.049659242378638696f,
            ExpectedValue = 0.8938663628154966f,
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
            PayoutMultiplier = 16,
            CaptureProbability = 0.045731392698972355f,
            ExpectedValue = 0.7317022831835577f,
            KillAnimation = "Standard 0.25s spin and fade-out with bubbles.",
            SpawnWeight = 10,
            HitboxRadius = 27f,
            BaseSpeed = 60f
        },
        
        // LARGE FISH (Types 12, 14) - Low capture probability - 10% spawn rate
        [12] = new FishDefinition
        {
            TypeId = 12,
            FileName = "hammerhead_shark.png",
            FishName = "Hammerhead Shark",
            Description = "Large predator that roams slowly. Requires focused fire to defeat.",
            AppearanceFrequency = "5%",
            BaseRewardValue = 21,
            Category = FishCategory.LargeFish,
            PayoutMultiplier = 43,
            CaptureProbability = 0.043954508320075684f,
            ExpectedValue = 1.8900438577632543f,
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
            PayoutMultiplier = 56,
            CaptureProbability = 0.02665326568345015f,
            ExpectedValue = 1.4925828782732085f,
            KillAnimation = "Standard 0.25s spin and fade-out with bubbles.",
            SpawnWeight = 5,
            HitboxRadius = 55f,
            BaseSpeed = 81.25f
        },
        
        // BONUS FISH (Type 21) - Special periodic spawn
        [21] = new FishDefinition
        {
            TypeId = 21,
            FileName = "wave_rider.png",
            FishName = "Wave Rider",
            Description = "Rare bonus fish that appears periodically from the edges in a sine wave pattern.",
            AppearanceFrequency = "Periodic (every ~5 seconds)",
            BaseRewardValue = 17,
            Category = FishCategory.BonusFish,
            PayoutMultiplier = 35,
            CaptureProbability = 0.017768843788966766f,
            ExpectedValue = 0.6219095326138369f,
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
