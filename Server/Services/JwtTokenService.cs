using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace OceanKing.Server.Services;

public class JwtTokenService
{
    private readonly IConfiguration _config;
    
    public JwtTokenService(IConfiguration config)
    {
        _config = config;
    }
    
    public string GenerateToken(string userId, string name, int credits, bool isGuest = false, string role = "Player")
    {
        var jwtSecretKey = _config["JwtSettings:SecretKey"] ?? "OceanKing3SecretKey2025MinLength32Chars!";
        var jwtIssuer = _config["JwtSettings:Issuer"] ?? "OceanKing3";
        var jwtAudience = _config["JwtSettings:Audience"] ?? "OceanKing3Players";
        
        var secretKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey));
        var credentials = new SigningCredentials(secretKey, SecurityAlgorithms.HmacSha256);
        
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(ClaimTypes.Name, name),
            new Claim(ClaimTypes.Role, role),
            new Claim("credits", credits.ToString()),
            new Claim("isGuest", isGuest.ToString())
        };
        
        var expirationHours = isGuest ? 24 : 168; // 24 hours for guests, 7 days for users
        
        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(expirationHours),
            signingCredentials: credentials
        );
        
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
    
    public string GenerateGuestToken(string name)
    {
        var guestId = $"guest_{Guid.NewGuid()}";
        return GenerateToken(guestId, name, 10000, isGuest: true, role: "Guest");
    }
}
