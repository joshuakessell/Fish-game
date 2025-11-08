using System.ComponentModel.DataAnnotations;

namespace OceanKing.Server.Data;

public class GuestSession
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;
    
    public int Credits { get; set; } = 1000; // Guests start with 1000 credits
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddHours(24); // 24 hour session
}
