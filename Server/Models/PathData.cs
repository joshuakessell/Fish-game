namespace OceanKing.Server.Models;

/// <summary>
/// Represents a fish movement path that can be deterministically computed by both server and client
/// </summary>
public class PathData
{
    public int FishId { get; set; }
    public PathType PathType { get; set; }
    public int Seed { get; set; }
    public int StartTick { get; set; }
    public float Speed { get; set; }
    public float[][] ControlPoints { get; set; } = Array.Empty<float[]>();
    
    // Additional metadata
    public float Duration { get; set; } // How long the path lasts in seconds
    public bool Loop { get; set; } // Whether the path loops
}

public enum PathType
{
    Linear,      // Straight line movement
    Sine,        // Sinusoidal wave pattern
    Bezier,      // Cubic Bezier curve
    Circular,    // Circular/elliptical motion
    MultiSegment // Multiple path segments chained together
}
