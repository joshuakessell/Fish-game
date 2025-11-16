using OceanKing.Server.Models;

namespace OceanKing.Server.Systems.Paths;

/// <summary>
/// Sinusoidal wave pattern - fish moves in a wave
/// </summary>
public class SinePath : IPath
{
    private readonly float[] _start;
    private readonly float[] _end;
    private readonly float[] _baseStart;
    private readonly float[] _baseEnd;
    private readonly float _amplitude;
    private readonly float _frequency;
    private readonly int _fishId;
    private readonly int _seed;
    private readonly int _startTick;
    private readonly float _speed;
    
    public SinePath(int fishId, int seed, int startTick, float speed, float[] start, float[] end, float[] baseStart, float[] baseEnd, float amplitude, float frequency)
    {
        _fishId = fishId;
        _seed = seed;
        _startTick = startTick;
        _speed = speed;
        _start = start;
        _end = end;
        _baseStart = baseStart;
        _baseEnd = baseEnd;
        _amplitude = amplitude;
        _frequency = frequency;
    }
    
    public float[] GetPosition(float t)
    {
        // Linear interpolation for base path using individual fish position
        float baseX = _start[0] + (_end[0] - _start[0]) * t;
        float baseY = _start[1] + (_end[1] - _start[1]) * t;
        
        // Calculate perpendicular direction for wave using SHARED base anchors
        // This ensures all fish in formation have synchronized wave phase
        float dx = _baseEnd[0] - _baseStart[0];
        float dy = _baseEnd[1] - _baseStart[1];
        float length = MathF.Sqrt(dx * dx + dy * dy);
        
        // Perpendicular unit vector
        float perpX = -dy / length;
        float perpY = dx / length;
        
        // Apply sine wave offset
        float offset = MathF.Sin(t * _frequency * MathF.PI * 2) * _amplitude;
        
        float x = baseX + perpX * offset;
        float y = baseY + perpY * offset;
        
        return new[] { x, y };
    }
    
    public PathType GetPathType() => PathType.Sine;
    
    public PathData GetPathData()
    {
        float distance = MathF.Sqrt(
            MathF.Pow(_end[0] - _start[0], 2) + 
            MathF.Pow(_end[1] - _start[1], 2)
        );
        
        return new PathData
        {
            FishId = _fishId,
            PathType = PathType.Sine,
            Seed = _seed,
            StartTick = _startTick,
            Speed = _speed,
            ControlPoints = new[] 
            { 
                _start, 
                _end, 
                new[] { _amplitude, _frequency } // Store wave parameters
            },
            Duration = distance / _speed,
            Loop = false  // Fish should exit screen smoothly, not loop back
        };
    }
}
