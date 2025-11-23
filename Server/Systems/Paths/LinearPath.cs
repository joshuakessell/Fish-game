using OceanKing.Server.Models;

namespace OceanKing.Server.Systems.Paths;

/// <summary>
/// Straight line movement from start to end point
/// </summary>
public class LinearPath : IPath
{
    private readonly float[] _start;
    private readonly float[] _end;
    private readonly int _fishId;
    private readonly int _seed;
    private readonly int _startTick;
    private readonly float _speed;
    
    public LinearPath(int fishId, int seed, int startTick, float speed, float[] start, float[] end)
    {
        _fishId = fishId;
        _seed = seed;
        _startTick = startTick;
        _speed = speed;
        _start = start;
        _end = end;
    }
    
    public float[] GetPosition(float t)
    {
        // Linear interpolation between start and end
        float x = _start[0] + (_end[0] - _start[0]) * t;
        float y = _start[1] + (_end[1] - _start[1]) * t;
        return new[] { x, y };
    }
    
    public PathType GetPathType() => PathType.Linear;
    
    public PathData GetPathData()
    {
        float distance = MathF.Sqrt(
            MathF.Pow(_end[0] - _start[0], 2) + 
            MathF.Pow(_end[1] - _start[1], 2)
        );
        
        return new PathData
        {
            FishId = _fishId,
            PathType = PathType.Linear,
            Seed = _seed,
            StartTick = _startTick,
            Speed = _speed,
            ControlPoints = new[] { _start, _end },
            Duration = distance / _speed,
            Loop = false
        };
    }
}
