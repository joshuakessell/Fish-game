using OceanKing.Server.Entities;

namespace OceanKing.Server.Managers;

public class ProjectileManager
{
    private readonly Dictionary<string, Projectile> _activeProjectiles = new();
    private static int _nextProjectileId = 1;

    public void AddProjectile(Projectile projectile)
    {
        projectile.NumericId = _nextProjectileId++;
        _activeProjectiles[projectile.ProjectileId] = projectile;
    }

    public void UpdateProjectiles(float deltaTime)
    {
        var projectilesToRemove = new List<string>();

        foreach (var projectile in _activeProjectiles.Values)
        {
            projectile.UpdatePosition(deltaTime);

            if (projectile.ShouldRemove())
            {
                projectilesToRemove.Add(projectile.ProjectileId);
            }
        }

        foreach (var projId in projectilesToRemove)
        {
            _activeProjectiles.Remove(projId);
        }
    }

    public Projectile? GetProjectile(string projectileId)
    {
        _activeProjectiles.TryGetValue(projectileId, out var projectile);
        return projectile;
    }

    public List<Projectile> GetActiveProjectiles()
    {
        return _activeProjectiles.Values.ToList();
    }

    public void RemoveProjectile(string projectileId)
    {
        _activeProjectiles.Remove(projectileId);
    }
}
