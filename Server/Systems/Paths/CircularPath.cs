using OceanKing.Server.Models;

namespace OceanKing.Server.Systems.Paths;

/// <summary>
/// Circular or elliptical movement pattern
/// </summary>
public class CircularPath : IPath
{
    private readonly float[] _center;
    private readonly float _radiusX;
    private readonly float _radiusY;
    private readonly float _startAngle;
    private readonly bool _clockwise;
    private readonly int _fishId;
    private readonly int _seed;
    private readonly int _startTick;
    private readonly float _speed;
    
    public CircularPath(int fishId, int seed, int startTick, float speed, float[] center, float radiusX, float radiusY, float startAngle, bool clockwise)
    {
        _fishId = fishId;
        _seed = seed;
        _startTick = startTick;
        _speed = speed;
        _center = center;
        _radiusX = radiusX;
        _radiusY = radiusY;
        _startAngle = startAngle;
        _clockwise = clockwise;
    }
    
    public float[] GetPosition(float t)
    {
        // Calculate angle based on progress
        float angle = _startAngle + (t * MathF.PI * 2);
        if (_clockwise)
        {
            angle = _startAngle - (t * MathF.PI * 2);
        }
        
        float x = _center[0] + MathF.Cos(angle) * _radiusX;
        float y = _center[1] + MathF.Sin(angle) * _radiusY;
        
        return new[] { x, y };
    }
    
    public PathType GetPathType() => PathType.Circular;
    
    public PathData GetPathData()
    {
        // Circumference approximation for ellipse: π * (3(a+b) - sqrt((3a+b)(a+3b)))
        float a = _radiusX;
        float b = _radiusY;
        float circumference = MathF.PI * (3 * (a + b) - MathF.Sqrt((3 * a + b) * (a + 3 * b)));
        
        return new PathData
        {
            FishId = _fishId,
            PathType = PathType.Circular,
            Seed = _seed,
            StartTick = _startTick,
            Speed = _speed,
            ControlPoints = new[] 
            { 
                _center, 
                new[] { _radiusX, _radiusY }, 
                new[] { _startAngle, _clockwise ? 1f : 0f }
            },
            Duration = circumference / _speed,
            Loop = true
        };
    }
}
