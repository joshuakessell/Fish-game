using Microsoft.AspNetCore.SignalR;
using OceanKing.Server;

namespace OceanKing.Hubs;

public class GameHub : Hub
{
    private readonly GameServerHost _gameServer;
    private static readonly Dictionary<string, string> _connectionToMatch = new();
    private static readonly Dictionary<string, string> _connectionToPlayer = new();

    public GameHub(GameServerHost gameServer)
    {
        _gameServer = gameServer;
    }

    public async Task<object> JoinMatch(string displayName)
    {
        try
        {
            var matchManager = _gameServer.GetMatchManager();
            var match = matchManager.FindOrCreateMatch(Context.ConnectionId);

            if (match == null)
            {
                return new { success = false, message = "No available matches" };
            }

            var player = match.AddPlayer(Context.ConnectionId, displayName, Context.ConnectionId);
            
            if (player == null)
            {
                return new { success = false, message = "Match is full" };
            }

            _connectionToMatch[Context.ConnectionId] = match.MatchId;
            _connectionToPlayer[Context.ConnectionId] = player.PlayerId;

            await Groups.AddToGroupAsync(Context.ConnectionId, match.MatchId);

            Console.WriteLine($"Player {displayName} joined match {match.MatchId} in slot {player.PlayerSlot}");

            return new
            {
                success = true,
                matchId = match.MatchId,
                playerId = player.PlayerId,
                playerSlot = player.PlayerSlot,
                credits = player.Credits
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in JoinMatch: {ex.Message}");
            return new { success = false, message = ex.Message };
        }
    }

    public void Fire(float x, float y, float directionX, float directionY)
    {
        if (!_connectionToMatch.TryGetValue(Context.ConnectionId, out var matchId))
            return;

        if (!_connectionToPlayer.TryGetValue(Context.ConnectionId, out var playerId))
            return;

        var matchManager = _gameServer.GetMatchManager();
        var match = matchManager.GetMatch(matchId);
        
        if (match == null) return;

        match.EnqueueCommand(new GameCommand
        {
            Type = CommandType.Fire,
            PlayerId = playerId,
            X = x,
            Y = y,
            DirectionX = directionX,
            DirectionY = directionY
        });
    }

    public void SetBetValue(int betValue)
    {
        if (!_connectionToMatch.TryGetValue(Context.ConnectionId, out var matchId))
            return;

        if (!_connectionToPlayer.TryGetValue(Context.ConnectionId, out var playerId))
            return;

        var matchManager = _gameServer.GetMatchManager();
        var match = matchManager.GetMatch(matchId);
        
        if (match == null) return;

        match.EnqueueCommand(new GameCommand
        {
            Type = CommandType.SetBetValue,
            PlayerId = playerId,
            BetValue = betValue
        });
    }

    public void SubmitInteraction(string interactionId, Dictionary<string, object> submissionData)
    {
        if (!_connectionToMatch.TryGetValue(Context.ConnectionId, out var matchId))
            return;

        if (!_connectionToPlayer.TryGetValue(Context.ConnectionId, out var playerId))
            return;

        var matchManager = _gameServer.GetMatchManager();
        var match = matchManager.GetMatch(matchId);
        
        if (match == null) return;

        match.HandleInteractionSubmission(playerId, interactionId, submissionData);
        
        Console.WriteLine($"Player {playerId} submitted interaction {interactionId}");
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (_connectionToMatch.TryGetValue(Context.ConnectionId, out var matchId))
        {
            if (_connectionToPlayer.TryGetValue(Context.ConnectionId, out var playerId))
            {
                var matchManager = _gameServer.GetMatchManager();
                var match = matchManager.GetMatch(matchId);
                
                if (match != null)
                {
                    var player = match.GetPlayer(playerId);
                    if (player != null)
                    {
                        Console.WriteLine($"Player {player.DisplayName} disconnected from match {matchId}");
                    }
                    match.RemovePlayer(playerId);
                }
            }

            _connectionToMatch.Remove(Context.ConnectionId);
            _connectionToPlayer.Remove(Context.ConnectionId);
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, matchId);
        }

        await base.OnDisconnectedAsync(exception);
    }

}
