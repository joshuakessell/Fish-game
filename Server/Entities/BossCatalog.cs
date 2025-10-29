namespace OceanKing.Server.Entities;

public enum BossDeathEffect
{
    ScreenWipe,
    SectorBlast,
    VortexPull,
    LineClear,
    ChainLightning,
    LootDrop,
    ExplosionRing,
    TimeFreeze
}

public class BossDefinition
{
    public int TypeId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal BaseValue { get; set; }
    public float DestructionOdds { get; set; }
    public float HitboxRadius { get; set; }
    public float BaseSpeed { get; set; }
    public int MovementPatternId { get; set; }
    public BossDeathEffect DeathEffect { get; set; }
    public bool RequiresInteraction { get; set; }
    public string InteractionType { get; set; } = string.Empty;
    public bool IsUltraRare { get; set; }
}

public static class BossCatalog
{
    private const float RTP = 0.90f;
    private const float AVG_MULTIPLIER = 1.74f;

    private static float CalculateDestructionOdds(decimal baseValue)
    {
        return RTP / ((float)baseValue * AVG_MULTIPLIER);
    }

    public static readonly Dictionary<int, BossDefinition> AllBosses = new()
    {
        // ===== RARE MID-BOSSES (for rotation) =====
        // These appear more frequently but are still valuable targets
        
        [2] = new BossDefinition // Large Fish (existing)
        {
            TypeId = 2,
            Name = "Giant Tuna",
            BaseValue = 50m,
            DestructionOdds = CalculateDestructionOdds(50m),
            HitboxRadius = 50f,
            BaseSpeed = 80f,
            MovementPatternId = 0,
            DeathEffect = BossDeathEffect.ExplosionRing,
            RequiresInteraction = false,
            IsUltraRare = false
        },
        
        [3] = new BossDefinition // Boss Fish (existing, now part of rotation)
        {
            TypeId = 3,
            Name = "Dragon Turtle",
            BaseValue = 500m,
            DestructionOdds = CalculateDestructionOdds(500m),
            HitboxRadius = 80f,
            BaseSpeed = 60f,
            MovementPatternId = 0,
            DeathEffect = BossDeathEffect.SectorBlast,
            RequiresInteraction = false,
            IsUltraRare = false
        },
        
        [4] = new BossDefinition // Bomb Crab (new rare boss)
        {
            TypeId = 4,
            Name = "Bomb Crab",
            BaseValue = 200m,
            DestructionOdds = CalculateDestructionOdds(200m),
            HitboxRadius = 55f,
            BaseSpeed = 50f,
            MovementPatternId = 0,
            DeathEffect = BossDeathEffect.ExplosionRing,
            RequiresInteraction = false,
            IsUltraRare = false
        },
        
        [5] = new BossDefinition // Lightning Eel (new rare boss)
        {
            TypeId = 5,
            Name = "Lightning Eel",
            BaseValue = 150m,
            DestructionOdds = CalculateDestructionOdds(150m),
            HitboxRadius = 48f,
            BaseSpeed = 90f,
            MovementPatternId = 2,
            DeathEffect = BossDeathEffect.ChainLightning,
            RequiresInteraction = false,
            IsUltraRare = false
        },
        
        [6] = new BossDefinition // Vortex Starfish (new rare boss)
        {
            TypeId = 6,
            Name = "Vortex Starfish",
            BaseValue = 300m,
            DestructionOdds = CalculateDestructionOdds(300m),
            HitboxRadius = 60f,
            BaseSpeed = 40f,
            MovementPatternId = 1,
            DeathEffect = BossDeathEffect.VortexPull,
            RequiresInteraction = false,
            IsUltraRare = false
        },

        // ===== ULTRA-RARE JACKPOT BOSSES (types 9-19) =====
        // These are the legendary bosses with massive payouts and spectacular effects
        
        [9] = new BossDefinition // Kaiju Megalodon - INTERACTIVE
        {
            TypeId = 9,
            Name = "Kaiju Megalodon",
            BaseValue = 5000m,
            DestructionOdds = CalculateDestructionOdds(5000m),
            HitboxRadius = 120f,
            BaseSpeed = 70f,
            MovementPatternId = 0,
            DeathEffect = BossDeathEffect.ScreenWipe,
            RequiresInteraction = true,
            InteractionType = "QTE_TEETH",
            IsUltraRare = true
        },
        
        [10] = new BossDefinition // Emperor Kraken - INTERACTIVE
        {
            TypeId = 10,
            Name = "Emperor Kraken",
            BaseValue = 8000m,
            DestructionOdds = CalculateDestructionOdds(8000m),
            HitboxRadius = 140f,
            BaseSpeed = 50f,
            MovementPatternId = 1,
            DeathEffect = BossDeathEffect.VortexPull,
            RequiresInteraction = true,
            InteractionType = "CHEST_CHOICE",
            IsUltraRare = true
        },
        
        [11] = new BossDefinition // Cosmic Leviathan
        {
            TypeId = 11,
            Name = "Cosmic Leviathan",
            BaseValue = 10000m,
            DestructionOdds = CalculateDestructionOdds(10000m),
            HitboxRadius = 150f,
            BaseSpeed = 60f,
            MovementPatternId = 2,
            DeathEffect = BossDeathEffect.ScreenWipe,
            RequiresInteraction = false,
            IsUltraRare = true
        },
        
        [12] = new BossDefinition // Samurai Swordfish
        {
            TypeId = 12,
            Name = "Samurai Swordfish",
            BaseValue = 6000m,
            DestructionOdds = CalculateDestructionOdds(6000m),
            HitboxRadius = 110f,
            BaseSpeed = 120f,
            MovementPatternId = 0,
            DeathEffect = BossDeathEffect.LineClear,
            RequiresInteraction = false,
            IsUltraRare = true
        },
        
        [13] = new BossDefinition // Carnival King Crab
        {
            TypeId = 13,
            Name = "Carnival King Crab",
            BaseValue = 7000m,
            DestructionOdds = CalculateDestructionOdds(7000m),
            HitboxRadius = 130f,
            BaseSpeed = 45f,
            MovementPatternId = 1,
            DeathEffect = BossDeathEffect.LootDrop,
            RequiresInteraction = false,
            IsUltraRare = true
        },
        
        [14] = new BossDefinition // Wizard Octopus
        {
            TypeId = 14,
            Name = "Wizard Octopus",
            BaseValue = 9000m,
            DestructionOdds = CalculateDestructionOdds(9000m),
            HitboxRadius = 125f,
            BaseSpeed = 55f,
            MovementPatternId = 2,
            DeathEffect = BossDeathEffect.TimeFreeze,
            RequiresInteraction = false,
            IsUltraRare = true
        },
        
        [15] = new BossDefinition // Rocket Hammerhead
        {
            TypeId = 15,
            Name = "Rocket Hammerhead",
            BaseValue = 5500m,
            DestructionOdds = CalculateDestructionOdds(5500m),
            HitboxRadius = 100f,
            BaseSpeed = 150f,
            MovementPatternId = 0,
            DeathEffect = BossDeathEffect.LineClear,
            RequiresInteraction = false,
            IsUltraRare = true
        },
        
        [16] = new BossDefinition // Pirate Captain Whale
        {
            TypeId = 16,
            Name = "Pirate Captain Whale",
            BaseValue = 12000m,
            DestructionOdds = CalculateDestructionOdds(12000m),
            HitboxRadius = 160f,
            BaseSpeed = 40f,
            MovementPatternId = 1,
            DeathEffect = BossDeathEffect.LootDrop,
            RequiresInteraction = false,
            IsUltraRare = true
        },
        
        [17] = new BossDefinition // Nuclear Submarine
        {
            TypeId = 17,
            Name = "Nuclear Submarine",
            BaseValue = 15000m,
            DestructionOdds = CalculateDestructionOdds(15000m),
            HitboxRadius = 145f,
            BaseSpeed = 65f,
            MovementPatternId = 0,
            DeathEffect = BossDeathEffect.SectorBlast,
            RequiresInteraction = false,
            IsUltraRare = true
        },
        
        [18] = new BossDefinition // Phoenix Firebird
        {
            TypeId = 18,
            Name = "Phoenix Firebird",
            BaseValue = 8500m,
            DestructionOdds = CalculateDestructionOdds(8500m),
            HitboxRadius = 115f,
            BaseSpeed = 140f,
            MovementPatternId = 2,
            DeathEffect = BossDeathEffect.ExplosionRing,
            RequiresInteraction = false,
            IsUltraRare = true
        },
        
        [19] = new BossDefinition // Alien Mothership
        {
            TypeId = 19,
            Name = "Alien Mothership",
            BaseValue = 20000m,
            DestructionOdds = CalculateDestructionOdds(20000m),
            HitboxRadius = 170f,
            BaseSpeed = 35f,
            MovementPatternId = 1,
            DeathEffect = BossDeathEffect.ScreenWipe,
            RequiresInteraction = false,
            IsUltraRare = true
        }
    };

    public static List<int> GetUltraRareBossTypes()
    {
        return AllBosses.Values
            .Where(b => b.IsUltraRare)
            .Select(b => b.TypeId)
            .ToList();
    }

    public static List<int> GetRareMidBossTypes()
    {
        return AllBosses.Values
            .Where(b => !b.IsUltraRare)
            .Select(b => b.TypeId)
            .ToList();
    }

    public static BossDefinition? GetBoss(int typeId)
    {
        return AllBosses.TryGetValue(typeId, out var boss) ? boss : null;
    }

    public static bool IsBoss(int typeId)
    {
        return AllBosses.ContainsKey(typeId);
    }
}
