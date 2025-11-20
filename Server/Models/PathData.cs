using MessagePack;

namespace OceanKing.Server.Models;

/// <summary>
/// Represents a fish movement path that can be deterministically computed by both server and client
/// </summary>
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
    public float Duration { get; set; } // How long the path lasts in seconds
    
    [Key(7)]
    public bool Loop { get; set; } // Whether the path loops
    
    [Key(8)]
    public float Variance { get; set; } = 1.0f; // Path duration variance multiplier (default 1.0 = no variance)
}

public enum PathType
{
    Linear,      // Straight line movement
    Sine,        // Sinusoidal wave pattern
    Bezier,      // Cubic Bezier curve
    Circular,    // Circular/elliptical motion
    MultiSegment // Multiple path segments chained together
}
