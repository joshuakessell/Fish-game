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
    // BALANCED RTP: Increased RTP_FACTOR to 6.0 with REVERTED BaseValue multipliers
    // This gives target DestructionOdds: 3-5% for mid-bosses, 0.5-1.5% for ultra-rares
    // Formula: DestructionOdds = 6.0 / (BaseValue × 1.74)
    // Combined with HotColdCycleManager multipliers for dynamic difficulty
    private const float RTP_FACTOR = 6.0f;
    private const float AVG_MULTIPLIER = 1.74f;

    private static float CalculateDestructionOdds(decimal baseValue)
    {
        return RTP_FACTOR / ((float)baseValue * AVG_MULTIPLIER);
    }

    public static readonly Dictionary<int, BossDefinition> AllBosses = new()
    {
        // ===== RARE MID-BOSSES (for rotation) =====
        // REVERTED to original BaseValue for balanced DestructionOdds with RTP_FACTOR=6.0
        
        [2] = new BossDefinition // Large Fish (existing)
        {
            TypeId = 2,
            Name = "Giant Tuna",
            BaseValue = 70m,
            DestructionOdds = CalculateDestructionOdds(70m),
            HitboxRadius = 75f,  // Greatly increased for easier targeting
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
            BaseValue = 700m,
            DestructionOdds = CalculateDestructionOdds(700m),
            HitboxRadius = 120f,  // Greatly increased for easier targeting
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
            BaseValue = 280m,
            DestructionOdds = CalculateDestructionOdds(280m),
            HitboxRadius = 85f,  // Greatly increased for easier targeting
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
            BaseValue = 210m,
            DestructionOdds = CalculateDestructionOdds(210m),
            HitboxRadius = 75f,  // Greatly increased for easier targeting
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
            BaseValue = 420m,
            DestructionOdds = CalculateDestructionOdds(420m),
            HitboxRadius = 90f,  // Greatly increased for easier targeting
            BaseSpeed = 40f,
            MovementPatternId = 1,
            DeathEffect = BossDeathEffect.VortexPull,
            RequiresInteraction = false,
            IsUltraRare = false
        },

        // ===== ULTRA-RARE JACKPOT BOSSES (types 9-19) =====
        // REVERTED to original BaseValue for balanced DestructionOdds with RTP_FACTOR=6.0
        
        [9] = new BossDefinition // Kaiju Megalodon - INTERACTIVE
        {
            TypeId = 9,
            Name = "Kaiju Megalodon",
            BaseValue = 7500m,
            DestructionOdds = CalculateDestructionOdds(7500m),
            HitboxRadius = 170f,  // Greatly increased for easier targeting
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
            BaseValue = 12000m,
            DestructionOdds = CalculateDestructionOdds(12000m),
            HitboxRadius = 195f,  // Greatly increased for easier targeting
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
            BaseValue = 15000m,
            DestructionOdds = CalculateDestructionOdds(15000m),
            HitboxRadius = 210f,  // Greatly increased for easier targeting
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
            BaseValue = 9000m,
            DestructionOdds = CalculateDestructionOdds(9000m),
            HitboxRadius = 155f,  // Greatly increased for easier targeting
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
            BaseValue = 10500m,
            DestructionOdds = CalculateDestructionOdds(10500m),
            HitboxRadius = 180f,  // Greatly increased for easier targeting
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
            BaseValue = 13500m,
            DestructionOdds = CalculateDestructionOdds(13500m),
            HitboxRadius = 175f,  // Greatly increased for easier targeting
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
            BaseValue = 8250m,
            DestructionOdds = CalculateDestructionOdds(8250m),
            HitboxRadius = 140f,  // Greatly increased for easier targeting
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
            BaseValue = 18000m,
            DestructionOdds = CalculateDestructionOdds(18000m),
            HitboxRadius = 225f,  // Greatly increased for easier targeting
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
            BaseValue = 22500m,
            DestructionOdds = CalculateDestructionOdds(22500m),
            HitboxRadius = 200f,  // Greatly increased for easier targeting
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
            BaseValue = 12750m,
            DestructionOdds = CalculateDestructionOdds(12750m),
            HitboxRadius = 160f,  // Greatly increased for easier targeting
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
            BaseValue = 30000m,
            DestructionOdds = CalculateDestructionOdds(30000m),
            HitboxRadius = 240f,  // Greatly increased for easier targeting
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
