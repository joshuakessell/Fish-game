using System.ComponentModel.DataAnnotations;

namespace OceanKing.Server.Data;

public class User
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string Username { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(256)]
    public string PasswordHash { get; set; } = string.Empty;
    
    [MaxLength(100)]
    public string? Email { get; set; }
    
    public int Credits { get; set; } = 1000; // Start with 1000 credits
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime LastLoginAt { get; set; } = DateTime.UtcNow;
}
