using Microsoft.EntityFrameworkCore;

namespace OceanKing.Server.Data;

public class OceanKingDbContext : DbContext
{
    public OceanKingDbContext(DbContextOptions<OceanKingDbContext> options) : base(options)
    {
    }
    
    public DbSet<User> Users { get; set; }
    public DbSet<GuestSession> GuestSessions { get; set; }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Configure User table
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.Username).IsUnique();
            entity.HasIndex(e => e.Email);
        });
        
        // Configure GuestSession table
        modelBuilder.Entity<GuestSession>(entity =>
        {
            entity.HasIndex(e => e.CreatedAt);
        });
    }
}
