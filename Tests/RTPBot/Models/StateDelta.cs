using MessagePack;

namespace RTPBot.Models;

[MessagePackObject]
public class StateDelta
{
    [Key(0)]
    public long Tick { get; set; }
    
    [Key(1)]
    public int RoundNumber { get; set; }
    
    [Key(2)]
    public long TimeRemainingTicks { get; set; }
    
    [Key(3)]
    public bool IsRoundTransitioning { get; set; }
    
    [Key(4)]
    public List<PlayerState> Players { get; set; } = new();
    
    [Key(5)]
    public List<FishState> Fish { get; set; } = new();
    
    [Key(6)]
    public List<ProjectileState> Projectiles { get; set; } = new();
    
    [Key(7)]
    public List<BossSequenceState> ActiveBossSequences { get; set; } = new();
    
    [Key(8)]
    public List<InteractionState> PendingInteractions { get; set; } = new();
    
    [Key(9)]
    public List<KillPayoutEvent> PayoutEvents { get; set; } = new();
}

[MessagePackObject]
public class PlayerState
{
    [Key(0)]
    public string PlayerId { get; set; } = string.Empty;
    
    [Key(1)]
    public string DisplayName { get; set; } = string.Empty;
    
    [Key(2)]
    public decimal Credits { get; set; }
    
    [Key(3)]
    public int CannonLevel { get; set; }
    
    [Key(4)]
    public int PlayerSlot { get; set; }
    
    [Key(5)]
    public int TotalKills { get; set; }
    
    [Key(6)]
    public int BetValue { get; set; }
}

[MessagePackObject]
public class FishState
{
    [Key(0)]
    public int id { get; set; }
    
    [Key(1)]
    public int type { get; set; }
    
    [Key(2)]
    public float x { get; set; }
    
    [Key(3)]
    public float y { get; set; }
    
    [Key(4)]
    public PathData? path { get; set; }
    
    [Key(5)]
    public bool isNewSpawn { get; set; }
}

[MessagePackObject]
public class ProjectileState
{
    [Key(0)]
    public int id { get; set; }
    
    [Key(1)]
    public float x { get; set; }
    
    [Key(2)]
    public float y { get; set; }
    
    [Key(3)]
    public float directionX { get; set; }
    
    [Key(4)]
    public float directionY { get; set; }
    
    [Key(5)]
    public string ownerId { get; set; } = string.Empty;
    
    [Key(6)]
    public string clientNonce { get; set; } = string.Empty;
    
    [Key(7)]
    public int? targetFishId { get; set; }
}

[MessagePackObject]
public class BossSequenceState
{
    [Key(0)]
    public string SequenceId { get; set; } = string.Empty;
    
    [Key(1)]
    public int BossTypeId { get; set; }
    
    [Key(2)]
    public string EffectType { get; set; } = string.Empty;
    
    [Key(3)]
    public int CurrentStep { get; set; }
}

[MessagePackObject]
public class InteractionState
{
    [Key(0)]
    public string InteractionId { get; set; } = string.Empty;
    
    [Key(1)]
    public string PlayerId { get; set; } = string.Empty;
    
    [Key(2)]
    public string InteractionType { get; set; } = string.Empty;
    
    [Key(3)]
    public Dictionary<string, object> InteractionData { get; set; } = new();
}

[MessagePackObject]
public class KillPayoutEvent
{
    [Key(0)]
    public int FishId { get; set; }
    
    [Key(1)]
    public int Payout { get; set; }
    
    [Key(2)]
    public int PlayerSlot { get; set; }
}

[MessagePackObject]
public class PathData
{
    [Key(0)]
    public int FishId { get; set; }
    
    [Key(1)]
    public PathType PathType { get; set; }
    
    [Key(2)]
    public int Seed { get; set; }
    
    [Key(3)]
    public int StartTick { get; set; }
    
    [Key(4)]
    public float Speed { get; set; }
    
    [Key(5)]
    public float[][] ControlPoints { get; set; } = Array.Empty<float[]>();
    
    [Key(6)]
    public float Duration { get; set; }
    
    [Key(7)]
    public bool Loop { get; set; }
}

public enum PathType
{
    Linear,
    Sine,
    Bezier,
    Circular,
    MultiSegment
}
