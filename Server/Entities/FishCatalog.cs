namespace OceanKing.Server.Entities;

public enum FishCategory
{
    SmallFish,      // 2x to 10x payout, high capture probability
    MediumFish,     // 12x to 20x payout, moderate capture probability
    LargeFish,      // 30x to 80x payout, low capture probability
    HighValueFish,  // 100x to 150x payout, very low capture probability
    SpecialItems,   // 20x to 40x payout plus power-up, exactly 1 active
    BossFish        // 100x to 500x payout, triggers events, exactly 1 active
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
    public string DeathSequence { get; set; } = "";
    public string ExtendedDeathBehavior { get; set; } = "";
    
    // Computed spawn weight (0-100 for percentages, 1000 for "Always")
    public int SpawnWeight { get; set; }
    
    // Visual properties
    public float HitboxRadius { get; set; }
    public float BaseSpeed { get; set; }
}

public static class FishCatalog
{
    private static readonly Dictionary<int, FishDefinition> _catalog = new()
    {
        // SMALL FISH (Types 0-5) - Common, easy to catch
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
            AppearanceFrequency = "34%",
            BaseRewardValue = 3,
            Category = FishCategory.SmallFish,
            PayoutMultiplier = 6,
            CaptureProbability = 0.08603861203078643f,
            ExpectedValue = 0.5162316721847185f,
            KillAnimation = "Standard 0.25s spin and fade-out with bubbles.",
            SpawnWeight = 34,
            HitboxRadius = 16f,
            BaseSpeed = 87.5f
        },
        [2] = new FishDefinition
        {
            TypeId = 2,
            FileName = "butterflyfish.png",
            FishName = "Butterflyfish",
            Description = "Common small reef fish that move in schools. Easy to catch.",
            AppearanceFrequency = "34%",
            BaseRewardValue = 2,
            Category = FishCategory.SmallFish,
            PayoutMultiplier = 5,
            CaptureProbability = 0.08653738659328375f,
            ExpectedValue = 0.43268693296641875f,
            KillAnimation = "Standard 0.25s spin and fade-out with bubbles.",
            SpawnWeight = 34,
            HitboxRadius = 17f,
            BaseSpeed = 81.25f
        },
        [3] = new FishDefinition
        {
            TypeId = 3,
            FileName = "angelfish.png",
            FishName = "Angelfish",
            Description = "Common small reef fish that move in schools. Easy to catch.",
            AppearanceFrequency = "34%",
            BaseRewardValue = 2,
            Category = FishCategory.SmallFish,
            PayoutMultiplier = 4,
            CaptureProbability = 0.0862879993120351f,
            ExpectedValue = 0.3451519972481404f,
            KillAnimation = "Standard 0.25s spin and fade-out with bubbles.",
            SpawnWeight = 34,
            HitboxRadius = 19f,
            BaseSpeed = 81.25f
        },
        [4] = new FishDefinition
        {
            TypeId = 4,
            FileName = "pufferfish.png",
            FishName = "Pufferfish",
            Description = "Common small reef fish that move in schools. Easy to catch.",
            AppearanceFrequency = "22%",
            BaseRewardValue = 4,
            Category = FishCategory.SmallFish,
            PayoutMultiplier = 9,
            CaptureProbability = 0.0548652018747044f,
            ExpectedValue = 0.4937868168723396f,
            KillAnimation = "Standard 0.25s spin and fade-out with bubbles.",
            SpawnWeight = 22,
            HitboxRadius = 20f,
            BaseSpeed = 68.75f
        },
        [5] = new FishDefinition
        {
            TypeId = 5,
            FileName = "wrasse.png",
            FishName = "Wrasse",
            Description = "Common small reef fish that move in schools. Easy to catch.",
            AppearanceFrequency = "25%",
            BaseRewardValue = 2,
            Category = FishCategory.SmallFish,
            PayoutMultiplier = 4,
            CaptureProbability = 0.06259620759341275f,
            ExpectedValue = 0.250384830373651f,
            KillAnimation = "Standard 0.25s spin and fade-out with bubbles.",
            SpawnWeight = 25,
            HitboxRadius = 17f,
            BaseSpeed = 93.75f
        },
        
        // MEDIUM FISH (Types 6-11) - Moderate difficulty
        [6] = new FishDefinition
        {
            TypeId = 6,
            FileName = "lionfish.png",
            FishName = "Lionfish",
            Description = "Colorful mid-sized fish that take moderate damage before capture.",
            AppearanceFrequency = "17%",
            BaseRewardValue = 9,
            Category = FishCategory.MediumFish,
            PayoutMultiplier = 18,
            CaptureProbability = 0.049659242378638696f,
            ExpectedValue = 0.8938663628154966f,
            KillAnimation = "Standard 0.25s spin and fade-out with bubbles.",
            SpawnWeight = 17,
            HitboxRadius = 26f,
            BaseSpeed = 62.5f
        },
        [7] = new FishDefinition
        {
            TypeId = 7,
            FileName = "parrotfish.png",
            FishName = "Parrotfish",
            Description = "Colorful mid-sized fish that take moderate damage before capture.",
            AppearanceFrequency = "14%",
            BaseRewardValue = 6,
            Category = FishCategory.MediumFish,
            PayoutMultiplier = 12,
            CaptureProbability = 0.04208410371071076f,
            ExpectedValue = 0.5050092445285291f,
            KillAnimation = "Standard 0.25s spin and fade-out with bubbles.",
            SpawnWeight = 14,
            HitboxRadius = 28f,
            BaseSpeed = 56.25f
        },
        [8] = new FishDefinition
        {
            TypeId = 8,
            FileName = "seahorse.png",
            FishName = "Seahorse",
            Description = "Colorful mid-sized fish that take moderate damage before capture.",
            AppearanceFrequency = "10%",
            BaseRewardValue = 6,
            Category = FishCategory.MediumFish,
            PayoutMultiplier = 12,
            CaptureProbability = 0.030019993980307007f,
            ExpectedValue = 0.3602399277636841f,
            KillAnimation = "Standard 0.25s spin and fade-out with bubbles.",
            SpawnWeight = 10,
            HitboxRadius = 24f,
            BaseSpeed = 50f
        },
        [9] = new FishDefinition
        {
            TypeId = 9,
            FileName = "triggerfish.png",
            FishName = "Triggerfish",
            Description = "Colorful mid-sized fish that take moderate damage before capture.",
            AppearanceFrequency = "16%",
            BaseRewardValue = 8,
            Category = FishCategory.MediumFish,
            PayoutMultiplier = 16,
            CaptureProbability = 0.045731392698972355f,
            ExpectedValue = 0.7317022831835577f,
            KillAnimation = "Standard 0.25s spin and fade-out with bubbles.",
            SpawnWeight = 16,
            HitboxRadius = 27f,
            BaseSpeed = 60f
        },
        [10] = new FishDefinition
        {
            TypeId = 10,
            FileName = "grouper.png",
            FishName = "Grouper",
            Description = "Colorful mid-sized fish that take moderate damage before capture.",
            AppearanceFrequency = "13%",
            BaseRewardValue = 8,
            Category = FishCategory.MediumFish,
            PayoutMultiplier = 17,
            CaptureProbability = 0.037875693339639686f,
            ExpectedValue = 0.6438867867738747f,
            KillAnimation = "Standard 0.25s spin and fade-out with bubbles.",
            SpawnWeight = 13,
            HitboxRadius = 29f,
            BaseSpeed = 57.5f
        },
        [11] = new FishDefinition
        {
            TypeId = 11,
            FileName = "boxfish.png",
            FishName = "Boxfish",
            Description = "Colorful mid-sized fish that take moderate damage before capture.",
            AppearanceFrequency = "15%",
            BaseRewardValue = 9,
            Category = FishCategory.MediumFish,
            PayoutMultiplier = 19,
            CaptureProbability = 0.0423646644021155f,
            ExpectedValue = 0.8049286236401945f,
            KillAnimation = "Standard 0.25s spin and fade-out with bubbles.",
            SpawnWeight = 15,
            HitboxRadius = 26f,
            BaseSpeed = 58.75f
        },
        
        // LARGE FISH (Types 12-16) - Low capture probability
        [12] = new FishDefinition
        {
            TypeId = 12,
            FileName = "swordfish.png",
            FishName = "Swordfish",
            Description = "Large predators that roam slowly. Require focused fire to defeat.",
            AppearanceFrequency = "9%",
            BaseRewardValue = 21,
            Category = FishCategory.LargeFish,
            PayoutMultiplier = 43,
            CaptureProbability = 0.043954508320075684f,
            ExpectedValue = 1.8900438577632543f,
            KillAnimation = "Standard 0.25s spin and fade-out with bubbles.",
            SpawnWeight = 9,
            HitboxRadius = 45f,
            BaseSpeed = 100f
        },
        [13] = new FishDefinition
        {
            TypeId = 13,
            FileName = "shark.png",
            FishName = "Shark",
            Description = "Large predators that roam slowly. Require focused fire to defeat.",
            AppearanceFrequency = "5%",
            BaseRewardValue = 34,
            Category = FishCategory.LargeFish,
            PayoutMultiplier = 68,
            CaptureProbability = 0.02384765876940276f,
            ExpectedValue = 1.6216407963193877f,
            KillAnimation = "Standard 0.25s spin and fade-out with bubbles.",
            SpawnWeight = 5,
            HitboxRadius = 60f,
            BaseSpeed = 87.5f
        },
        [14] = new FishDefinition
        {
            TypeId = 14,
            FileName = "manta_ray.png",
            FishName = "Manta Ray",
            Description = "Large predators that roam slowly. Require focused fire to defeat.",
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
        [15] = new FishDefinition
        {
            TypeId = 15,
            FileName = "barracuda.png",
            FishName = "Barracuda",
            Description = "Large predators that roam slowly. Require focused fire to defeat.",
            AppearanceFrequency = "9%",
            BaseRewardValue = 19,
            Category = FishCategory.LargeFish,
            PayoutMultiplier = 39,
            CaptureProbability = 0.04629251408178184f,
            ExpectedValue = 1.8054080491894917f,
            KillAnimation = "Standard 0.25s spin and fade-out with bubbles.",
            SpawnWeight = 9,
            HitboxRadius = 50f,
            BaseSpeed = 106.25f
        },
        [16] = new FishDefinition
        {
            TypeId = 16,
            FileName = "moray_eel.png",
            FishName = "Moray Eel",
            Description = "Large predators that roam slowly. Require focused fire to defeat.",
            AppearanceFrequency = "5%",
            BaseRewardValue = 31,
            Category = FishCategory.LargeFish,
            PayoutMultiplier = 63,
            CaptureProbability = 0.027588467988132605f,
            ExpectedValue = 1.7380734832523541f,
            KillAnimation = "Standard 0.25s spin and fade-out with bubbles.",
            SpawnWeight = 5,
            HitboxRadius = 52f,
            BaseSpeed = 68.75f
        },
        
        // HIGH-VALUE FISH (Types 17-20) - Rare, very low capture probability
        [17] = new FishDefinition
        {
            TypeId = 17,
            FileName = "golden_carp.png",
            FishName = "Golden Carp",
            Description = "Rare and high-value targets that yield massive rewards when caught.",
            AppearanceFrequency = "1%",
            BaseRewardValue = 66,
            Category = FishCategory.HighValueFish,
            PayoutMultiplier = 133,
            CaptureProbability = 0.007481618437459691f,
            ExpectedValue = 0.9950552521821389f,
            KillAnimation = "Standard 0.25s spin and fade-out with bubbles.",
            SpawnWeight = 1,
            HitboxRadius = 38f,
            BaseSpeed = 112.5f
        },
        [18] = new FishDefinition
        {
            TypeId = 18,
            FileName = "fire_kirin.png",
            FishName = "Fire Kirin",
            Description = "Rare and high-value targets that yield massive rewards when caught.",
            AppearanceFrequency = "2%",
            BaseRewardValue = 60,
            Category = FishCategory.HighValueFish,
            PayoutMultiplier = 120,
            CaptureProbability = 0.011690028808530768f,
            ExpectedValue = 1.4028034570236922f,
            KillAnimation = "Standard 0.25s spin and fade-out with bubbles.",
            SpawnWeight = 2,
            HitboxRadius = 42f,
            BaseSpeed = 93.75f
        },
        [19] = new FishDefinition
        {
            TypeId = 19,
            FileName = "electric_eel.png",
            FishName = "Electric Eel",
            Description = "Rare and high-value targets that yield massive rewards when caught.",
            AppearanceFrequency = "2%",
            BaseRewardValue = 60,
            Category = FishCategory.HighValueFish,
            PayoutMultiplier = 121,
            CaptureProbability = 0.011222427656189537f,
            ExpectedValue = 1.357913746398934f,
            KillAnimation = "Standard 0.25s spin and fade-out with bubbles.",
            SpawnWeight = 2,
            HitboxRadius = 48f,
            BaseSpeed = 118.75f
        },
        [20] = new FishDefinition
        {
            TypeId = 20,
            FileName = "crimson_whale.png",
            FishName = "Crimson Whale",
            Description = "Rare and high-value targets that yield massive rewards when caught.",
            AppearanceFrequency = "2%",
            BaseRewardValue = 59,
            Category = FishCategory.HighValueFish,
            PayoutMultiplier = 119,
            CaptureProbability = 0.011222427656189537f,
            ExpectedValue = 1.3354688910865549f,
            KillAnimation = "Standard 0.25s spin and fade-out with bubbles.",
            SpawnWeight = 2,
            HitboxRadius = 70f,
            BaseSpeed = 75f
        },
        
        // SPECIAL ITEMS (Types 21-24) - Always exactly 1 active
        [21] = new FishDefinition
        {
            TypeId = 21,
            FileName = "drill_crab.png",
            FishName = "Drill Crab",
            Description = "Special units that drop temporary power-ups or unique attacks.",
            AppearanceFrequency = "Always (1 active at all times)",
            BaseRewardValue = 17,
            Category = FishCategory.SpecialItems,
            PayoutMultiplier = 35,
            CaptureProbability = 0.017768843788966766f,
            ExpectedValue = 0.6219095326138369f,
            KillAnimation = "Advanced animation with glow, pulse, and screen shake.",
            DeathSequence = "Summons lightning across the screen and bursts into coins.",
            ExtendedDeathBehavior = "Upon death, launches a bouncing drill that ricochets around the screen for 5–7 seconds, damaging nearby fish. Respawn of new special item delayed until drill stops moving and all rewards are awarded.",
            SpawnWeight = 1000,
            HitboxRadius = 35f,
            BaseSpeed = 37.5f
        },
        [22] = new FishDefinition
        {
            TypeId = 22,
            FileName = "laser_crab.png",
            FishName = "Laser Crab",
            Description = "Special units that drop temporary power-ups or unique attacks.",
            AppearanceFrequency = "Always (1 active at all times)",
            BaseRewardValue = 17,
            Category = FishCategory.SpecialItems,
            PayoutMultiplier = 34,
            CaptureProbability = 0.019327514296770865f,
            ExpectedValue = 0.6571354860902094f,
            KillAnimation = "Advanced animation with glow, pulse, and screen shake.",
            DeathSequence = "Explodes in a wave of coins and fire particles.",
            ExtendedDeathBehavior = "Fires a sweeping laser beam for 4 seconds across the playfield, destroying small and medium fish in its path. Respawn of special item disabled until beam cycle completes.",
            SpawnWeight = 1000,
            HitboxRadius = 35f,
            BaseSpeed = 37.5f
        },
        [23] = new FishDefinition
        {
            TypeId = 23,
            FileName = "roulette_crab.png",
            FishName = "Roulette Crab",
            Description = "Special units that drop temporary power-ups or unique attacks.",
            AppearanceFrequency = "Always (1 active at all times)",
            BaseRewardValue = 19,
            Category = FishCategory.SpecialItems,
            PayoutMultiplier = 39,
            CaptureProbability = 0.01589843917960184f,
            ExpectedValue = 0.6200391280044718f,
            KillAnimation = "Advanced animation with glow, pulse, and screen shake.",
            DeathSequence = "Explodes in a wave of coins and fire particles.",
            ExtendedDeathBehavior = "Triggers a roulette wheel event for all players. Wheel spins 3–4 seconds, granting random multipliers or mini bonus games. New special item cannot spawn until the roulette event finishes.",
            SpawnWeight = 1000,
            HitboxRadius = 36f,
            BaseSpeed = 35f
        },
        [24] = new FishDefinition
        {
            TypeId = 24,
            FileName = "vortex_jelly.png",
            FishName = "Vortex Jelly",
            Description = "Special units that drop temporary power-ups or unique attacks.",
            AppearanceFrequency = "Always (1 active at all times)",
            BaseRewardValue = 14,
            Category = FishCategory.SpecialItems,
            PayoutMultiplier = 29,
            CaptureProbability = 0.018392311992088406f,
            ExpectedValue = 0.5333770477705637f,
            KillAnimation = "Advanced animation with glow, pulse, and screen shake.",
            DeathSequence = "Triggers a massive whirlpool that pulls nearby fish.",
            ExtendedDeathBehavior = "Creates a vortex that lasts 5 seconds, pulling nearby fish inward and rewarding chain bonuses per capture. Respawn blocked until vortex dissipates.",
            SpawnWeight = 1000,
            HitboxRadius = 40f,
            BaseSpeed = 31.25f
        },
        
        // BOSS FISH (Types 25-28) - Always exactly 1 active
        [25] = new FishDefinition
        {
            TypeId = 25,
            FileName = "dragon_king.png",
            FishName = "Dragon King",
            Description = "Massive boss creatures triggering global battle events and bonuses.",
            AppearanceFrequency = "Always (1 active at all times)",
            BaseRewardValue = 232,
            Category = FishCategory.BossFish,
            PayoutMultiplier = 464,
            CaptureProbability = 0.004052543320290665f,
            ExpectedValue = 1.8803801006148686f,
            KillAnimation = "Advanced animation with glow, pulse, and screen shake.",
            DeathSequence = "Triggers a massive whirlpool that pulls nearby fish.",
            ExtendedDeathBehavior = "Unleashes a multi-phase animation where it circles the field and explodes into flames and gold coins for 8 seconds. Respawn of boss fish paused until explosion effect concludes.",
            SpawnWeight = 1000,
            HitboxRadius = 80f,
            BaseSpeed = 50f
        },
        [26] = new FishDefinition
        {
            TypeId = 26,
            FileName = "emperor_turtle.png",
            FishName = "Emperor Turtle",
            Description = "Massive boss creatures triggering global battle events and bonuses.",
            AppearanceFrequency = "Always (1 active at all times)",
            BaseRewardValue = 90,
            Category = FishCategory.BossFish,
            PayoutMultiplier = 180,
            CaptureProbability = 0.0028056069140473838f,
            ExpectedValue = 0.5050092445285291f,
            KillAnimation = "Advanced animation with glow, pulse, and screen shake.",
            DeathSequence = "Explodes in a wave of coins and fire particles.",
            ExtendedDeathBehavior = "Retreats into its shell and releases waves of energy that radiate outward for 6 seconds, damaging nearby fish. Respawn prevented until the wave animation ends.",
            SpawnWeight = 1000,
            HitboxRadius = 75f,
            BaseSpeed = 43.75f
        },
        [27] = new FishDefinition
        {
            TypeId = 27,
            FileName = "poseidon.png",
            FishName = "Poseidon",
            Description = "Massive boss creatures triggering global battle events and bonuses.",
            AppearanceFrequency = "Always (1 active at all times)",
            BaseRewardValue = 109,
            Category = FishCategory.BossFish,
            PayoutMultiplier = 219,
            CaptureProbability = 0.0046760115234123064f,
            ExpectedValue = 1.024046523627295f,
            KillAnimation = "Advanced animation with glow, pulse, and screen shake.",
            DeathSequence = "Triggers a massive whirlpool that pulls nearby fish.",
            ExtendedDeathBehavior = "Summons lightning storms and crashing waves for 7 seconds, turning screen tint blue and increasing catch rates temporarily. No boss fish respawn during this event.",
            SpawnWeight = 1000,
            HitboxRadius = 85f,
            BaseSpeed = 47.5f
        },
        [28] = new FishDefinition
        {
            TypeId = 28,
            FileName = "phantom_kraken.png",
            FishName = "Phantom Kraken",
            Description = "Massive boss creatures triggering global battle events and bonuses.",
            AppearanceFrequency = "Always (1 active at all times)",
            BaseRewardValue = 239,
            Category = FishCategory.BossFish,
            PayoutMultiplier = 478,
            CaptureProbability = 0.0034290751171690247f,
            ExpectedValue = 1.6390979060067938f,
            KillAnimation = "Advanced animation with glow, pulse, and screen shake.",
            DeathSequence = "Explodes in a wave of coins and fire particles.",
            ExtendedDeathBehavior = "Spawns tentacles that sweep across the playfield for 9 seconds, each hitting random areas. Respawn halted until tentacle phase is complete.",
            SpawnWeight = 1000,
            HitboxRadius = 90f,
            BaseSpeed = 40f
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
    
    public static bool IsSpecialItem(int typeId)
    {
        return typeId >= 21 && typeId <= 24;
    }
    
    public static bool IsBossFish(int typeId)
    {
        return typeId >= 25 && typeId <= 28;
    }
}
