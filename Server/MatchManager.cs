using System.Collections.Concurrent;
using Microsoft.AspNetCore.SignalR;
using OceanKing.Hubs;

namespace OceanKing.Server;

public class MatchManager
{
    private readonly ConcurrentDictionary<string, MatchInstance> _activeMatches = new();
    private readonly IHubContext<GameHub> _hubContext;
    private int _matchIdCounter = 0;

    public const int MAX_PLAYERS_PER_MATCH = 6;

    public MatchManager(IHubContext<GameHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public MatchInstance? FindOrCreateMatch(string playerId)
    {
        // Try to find an existing match with available slots
        foreach (var match in _activeMatches.Values)
        {
            if (match.CanJoin())
            {
                return match;
            }
        }

        // Create new match
        var matchId = $"match_{Interlocked.Increment(ref _matchIdCounter)}";
        var newMatch = new MatchInstance(matchId, this, _hubContext);
        
        if (_activeMatches.TryAdd(matchId, newMatch))
        {
            newMatch.Start();
            Console.WriteLine($"Created new match: {matchId}");
            return newMatch;
        }

        return null;
    }

    public MatchInstance? GetMatch(string matchId)
    {
        _activeMatches.TryGetValue(matchId, out var match);
        return match;
    }

    public void RemoveMatch(string matchId)
    {
        if (_activeMatches.TryRemove(matchId, out var match))
        {
            match.Stop();
            Console.WriteLine($"Removed match: {matchId}");
        }
    }

    public void ShutdownAll()
    {
        foreach (var match in _activeMatches.Values)
        {
            match.Stop();
        }
        _activeMatches.Clear();
    }

    public int GetActiveMatchCount() => _activeMatches.Count;
}
