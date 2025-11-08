using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OceanKing.Server.Data;
using OceanKing.Server.Services;
using System.Security.Claims;

namespace OceanKing.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly JwtTokenService _tokenService;
    private readonly OceanKingDbContext _dbContext;
    
    public AuthController(JwtTokenService tokenService, OceanKingDbContext dbContext)
    {
        _tokenService = tokenService;
        _dbContext = dbContext;
    }
    
    [HttpPost("guest")]
    public async Task<IActionResult> GuestLogin([FromBody] GuestLoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Length > 50)
        {
            return BadRequest(new { Message = "Name is required and must be under 50 characters" });
        }
        
        // Create guest session in database (optional - for tracking)
        var guestSession = new GuestSession
        {
            Name = request.Name.Trim(),
            Credits = 1000,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(24)
        };
        
        _dbContext.GuestSessions.Add(guestSession);
        await _dbContext.SaveChangesAsync();
        
        // Generate JWT token
        var token = _tokenService.GenerateToken(
            guestSession.Id.ToString(),
            guestSession.Name,
            guestSession.Credits,
            isGuest: true,
            role: "Guest"
        );
        
        return Ok(new
        {
            Token = token,
            UserId = guestSession.Id,
            Name = guestSession.Name,
            Credits = guestSession.Credits,
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
