using OceanKing.Server;
using OceanKing.Server.Data;
using OceanKing.Server.Services;
using OceanKing.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add Database Context (optional - used for registered users only, not guests)
var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL");
if (!string.IsNullOrEmpty(connectionString))
{
    try
    {
        builder.Services.AddDbContext<OceanKingDbContext>(options =>
            options.UseNpgsql(connectionString));
        Console.WriteLine("Database connected successfully");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Database connection warning: {ex.Message}. Guest mode will work without database.");
    }
}
else
{
    Console.WriteLine("DATABASE_URL not set. Running in guest-only mode (no user registration).");
}

// Configure JWT Authentication
var jwtSecretKey = builder.Configuration["JwtSettings:SecretKey"] ?? "OceanKing3SecretKey2025MinLength32Chars!";
var jwtIssuer = builder.Configuration["JwtSettings:Issuer"] ?? "OceanKing3";
var jwtAudience = builder.Configuration["JwtSettings:Audience"] ?? "OceanKing3Players";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
    
    // Support JWT from SignalR query string
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/gamehub"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();
builder.Services.AddControllers();

// Register JWT token service
builder.Services.AddSingleton<JwtTokenService>();

// Add SignalR with optimizations for performance
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true; // Enable for debugging
    options.MaximumReceiveMessageSize = 32768; // 32KB default
    options.StatefulReconnectBufferSize = 100000; // Enable stateful reconnect for mobile
})
.AddJsonProtocol(options =>
{
    // Configure JSON serialization to use camelCase for client compatibility
    options.PayloadSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
})
.AddMessagePackProtocol(); // Support MessagePack protocol for reduced bandwidth

// Register game server as singleton
builder.Services.AddSingleton<GameServerHost>();

// Add CORS for local development
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Start the game server
var gameServer = app.Services.GetRequiredService<GameServerHost>();
gameServer.Start();

app.UseDefaultFiles();
app.UseStaticFiles();
app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

// Map controllers for auth endpoints
app.MapControllers();

// Map SignalR hub
app.MapHub<GameHub>("/gamehub");

app.Run();
