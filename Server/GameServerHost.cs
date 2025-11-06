using Microsoft.AspNetCore.SignalR;
using OceanKing.Hubs;

namespace OceanKing.Server;

public class GameServerHost
{
    private readonly MatchManager _matchManager;
    private bool _isRunning;

    public GameServerHost(IHubContext<GameHub> hubContext)
    {
        _matchManager = new MatchManager(hubContext);
    }

    public void Start()
    {
        if (_isRunning) return;
        
        _isRunning = true;
        Console.WriteLine("Ocean King 3 Game Server Started");
        Console.WriteLine("Ready to accept up to 6 players per match");
    }

    public void Stop()
    {
        _isRunning = false;
        _matchManager.ShutdownAll();
        Console.WriteLine("Game Server Stopped");
    }

    public MatchManager GetMatchManager() => _matchManager;
}
