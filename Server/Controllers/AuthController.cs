using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace OceanKing.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _configuration;
    
    public AuthController(IConfiguration configuration)
    {
        _configuration = configuration;
    }
    
    [HttpPost("guest")]
    public IActionResult GuestLogin([FromBody] GuestLoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Length > 50)
        {
            return BadRequest(new { Message = "Name is required and must be under 50 characters" });
        }
        
        // Generate guest ID and create token (no database persistence - guests are ephemeral)
        var guestId = Guid.NewGuid();
        var guestName = request.Name.Trim();
        var guestCredits = 10000; // Increased from 1000 for better testing
        
        // Generate JWT token with all guest data embedded
        var token = GenerateJwtToken(
            guestId.ToString(),
            guestName,
            guestCredits,
            isGuest: true,
            role: "Guest"
        );
        
        Console.WriteLine($"Guest '{guestName}' created with ID {guestId} and {guestCredits} credits");
        
        return Ok(new
        {
            Token = token,
            UserId = guestId,
            Name = guestName,
            Credits = guestCredits,
            IsGuest = true,
            Message = "Guest session created successfully"
        });
    }
    
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        // TODO: Implement actual user authentication
        // For now, return not implemented
        return StatusCode(501, new { Message = "User authentication will be implemented in a future update" });
    }
    
    [Authorize]
    [HttpGet("me")]
    public IActionResult GetCurrentUser()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var name = User.FindFirst(ClaimTypes.Name)?.Value;
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        var creditsStr = User.FindFirst("credits")?.Value;
        var isGuestStr = User.FindFirst("isGuest")?.Value;
        
        int.TryParse(creditsStr, out int credits);
        bool.TryParse(isGuestStr, out bool isGuest);
        
        return Ok(new
        {
            UserId = userId,
            Name = name,
            Role = role,
            Credits = credits,
            IsGuest = isGuest
        });
    }
    
    private string GenerateJwtToken(string userId, string name, int credits, bool isGuest, string role)
    {
        var jwtSecretKey = _configuration["JwtSettings:SecretKey"] ?? "OceanKing3SecretKey2025MinLength32Chars!";
        var jwtIssuer = _configuration["JwtSettings:Issuer"] ?? "OceanKing3";
        var jwtAudience = _configuration["JwtSettings:Audience"] ?? "OceanKing3Players";
        
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(ClaimTypes.Name, name),
            new Claim(ClaimTypes.Role, role),
            new Claim("credits", credits.ToString()),
            new Claim("isGuest", isGuest.ToString())
        };
        
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        
        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(24),
            signingCredentials: credentials
        );
        
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

public class GuestLoginRequest
{
    public string Name { get; set; } = string.Empty;
}

public class LoginRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
