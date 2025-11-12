using OceanKing.Server.Models;

namespace OceanKing.Server.Systems.Paths;

/// <summary>
/// Interface for all path computation strategies
/// </summary>
public interface IPath
{
    /// <summary>
    /// Compute the position along the path at a given time offset
    /// </summary>
    /// <param name="t">Normalized time (0.0 to 1.0) representing progress along the path</param>
    /// <returns>Position as [x, y]</returns>
    float[] GetPosition(float t);
    
    /// <summary>
    /// Get the path type identifier
    /// </summary>
    PathType GetPathType();
    
    /// <summary>
    /// Get the serializable path data for transmission to clients
    /// </summary>
    PathData GetPathData();
}
