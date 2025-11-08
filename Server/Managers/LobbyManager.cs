using System.Collections.Concurrent;
using Microsoft.AspNetCore.SignalR;
using OceanKing.Hubs;

namespace OceanKing.Server.Managers;

public class LobbyManager
{
    private readonly MatchManager _matchManager;
    private readonly ConcurrentDictionary<string, MatchInstance> _soloMatches = new();
    private int _soloMatchCounter = 0;
    
    public LobbyManager(MatchManager matchManager)
    {
        _matchManager = matchManager;
    }
    
    public RoomListResponse GetRoomList(int page = 0)
    {
        var allMatches = new List<RoomInfo>();
        var matchesToCheck = new List<MatchInstance>();
        
        // Get all active matches from MatchManager
        for (int i = 0; i < 100; i++) // Check up to 100 potential matches
        {
            var matchId = $"match_{i}";
            var match = _matchManager.GetMatch(matchId);
            if (match != null)
            {
                matchesToCheck.Add(match);
            }
        }
        
        // Filter and map to RoomInfo
        foreach (var match in matchesToCheck)
        {
            // Skip solo matches (they're private)
            if (_soloMatches.ContainsKey(match.MatchId))
                continue;
                
            var playerCount = match.GetPlayerCount();
            
            // Skip full rooms
            if (playerCount >= MatchManager.MAX_PLAYERS_PER_MATCH)
                continue;
            
            allMatches.Add(new RoomInfo
            {
                RoomId = match.MatchId,
                PlayerCount = playerCount,
                MaxPlayers = MatchManager.MAX_PLAYERS_PER_MATCH
            });
        }
        
        // Ensure at least 4 rooms are available
        EnsureMinimumRooms(allMatches);
        
        // Paginate (4 per page)
        const int roomsPerPage = 4;
        var totalRooms = allMatches.Count;
        var totalPages = (int)Math.Ceiling(totalRooms / (double)roomsPerPage);
        var roomsOnPage = allMatches
            .Skip(page * roomsPerPage)
            .Take(roomsPerPage)
            .ToList();
        
        return new RoomListResponse
        {
            Rooms = roomsOnPage,
            CurrentPage = page,
            TotalPages = totalPages,
            TotalRooms = totalRooms
        };
    }
    
    private void EnsureMinimumRooms(List<RoomInfo> existingRooms)
    {
        // Auto-create new rooms if:
        // 1. Less than 4 available rooms exist, OR
        // 2. All existing rooms have >2 players
        
        var roomsNeeded = 4 - existingRooms.Count;
        var allRoomsBusy = existingRooms.All(r => r.PlayerCount >= 2);
        
        if (allRoomsBusy && existingRooms.Count > 0)
        {
            roomsNeeded = 1; // Create one more room
        }
        
        for (int i = 0; i < roomsNeeded; i++)
        {
            // Create new match by calling FindOrCreateMatch with a placeholder player ID
            var placeholderMatch = _matchManager.FindOrCreateMatch($"_placeholder_{Guid.NewGuid()}");
            if (placeholderMatch != null)
            {
                existingRooms.Add(new RoomInfo
                {
                    RoomId = placeholderMatch.MatchId,
                    PlayerCount = 0,
                    MaxPlayers = MatchManager.MAX_PLAYERS_PER_MATCH
                });
            }
        }
    }
    
    public MatchInstance? JoinRoom(string roomId, string playerId)
    {
        var match = _matchManager.GetMatch(roomId);
        if (match == null || !match.CanJoin())
        {
            return null;
        }
        
        return match;
    }
    
    public MatchInstance CreateSoloMatch(string playerId, IHubContext<GameHub> hubContext)
    {
        var soloMatchId = $"solo_{Interlocked.Increment(ref _soloMatchCounter)}";
        var soloMatch = new MatchInstance(soloMatchId, _matchManager, hubContext, isSolo: true);
        
        if (_soloMatches.TryAdd(soloMatchId, soloMatch))
        {
            soloMatch.Start();
            Console.WriteLine($"Created solo match: {soloMatchId} for player: {playerId}");
            return soloMatch;
        }
        
        throw new InvalidOperationException("Failed to create solo match");
    }
    
    public void RemoveSoloMatch(string matchId)
    {
        if (_soloMatches.TryRemove(matchId, out var match))
        {
            match.Stop();
            Console.WriteLine($"Removed solo match: {matchId}");
        }
    }
}

public class RoomInfo
{
    public string RoomId { get; set; } = string.Empty;
    public int PlayerCount { get; set; }
    public int MaxPlayers { get; set; }
}

public class RoomListResponse
{
    public List<RoomInfo> Rooms { get; set; } = new();
    public int CurrentPage { get; set; }
    public int TotalPages { get; set; }
    public int TotalRooms { get; set; }
}
