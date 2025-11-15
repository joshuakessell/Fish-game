using OceanKing.Server.Models;

namespace OceanKing.Server.Systems.Paths;

/// <summary>
/// Cubic Bezier curve for smooth, curved fish movement
/// </summary>
public class BezierPath : IPath
{
    private readonly float[] _p0; // Start point
    private readonly float[] _p1; // First control point
    private readonly float[] _p2; // Second control point
    private readonly float[] _p3; // End point
    private readonly int _fishId;
    private readonly int _seed;
    private readonly int _startTick;
    private readonly float _speed;
    
    public BezierPath(int fishId, int seed, int startTick, float speed, float[] p0, float[] p1, float[] p2, float[] p3)
    {
        _fishId = fishId;
        _seed = seed;
        _startTick = startTick;
        _speed = speed;
        _p0 = p0;
        _p1 = p1;
        _p2 = p2;
        _p3 = p3;
    }
    
    public float[] GetPosition(float t)
    {
        // Cubic Bezier formula: B(t) = (1-t)³P0 + 3(1-t)²tP1 + 3(1-t)t²P2 + t³P3
        float u = 1 - t;
        float tt = t * t;
        float uu = u * u;
        float uuu = uu * u;
        float ttt = tt * t;
        
        float x = uuu * _p0[0] + 
                  3 * uu * t * _p1[0] + 
                  3 * u * tt * _p2[0] + 
                  ttt * _p3[0];
                  
        float y = uuu * _p0[1] + 
                  3 * uu * t * _p1[1] + 
                  3 * u * tt * _p2[1] + 
                  ttt * _p3[1];
        
        return new[] { x, y };
    }
    
    public PathType GetPathType() => PathType.Bezier;
    
    public PathData GetPathData()
    {
        // Approximate arc length using Simpson's rule
        float arcLength = ApproximateArcLength(20);
        
        return new PathData
        {
            FishId = _fishId,
            PathType = PathType.Bezier,
            Seed = _seed,
            StartTick = _startTick,
            Speed = _speed,
            ControlPoints = new[] { _p0, _p1, _p2, _p3 },
            Duration = arcLength / _speed,
            Loop = false  // Fish should exit screen smoothly, not loop back
        };
    }
    
    private float ApproximateArcLength(int segments)
    {
        float length = 0f;
        float[] prevPoint = GetPosition(0f);
        
        for (int i = 1; i <= segments; i++)
        {
            float t = (float)i / segments;
            float[] point = GetPosition(t);
            
            float dx = point[0] - prevPoint[0];
            float dy = point[1] - prevPoint[1];
            length += MathF.Sqrt(dx * dx + dy * dy);
            
            prevPoint = point;
        }
        
        return length;
    }
}
