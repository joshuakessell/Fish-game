using OceanKing.Server;
using OceanKing.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Add SignalR
builder.Services.AddSignalR();

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

// Map SignalR hub
app.MapHub<GameHub>("/gamehub");

app.Run("http://0.0.0.0:5000");
