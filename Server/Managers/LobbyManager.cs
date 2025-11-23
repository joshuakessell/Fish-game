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
            
            // Build seat occupancy array (6 seats, indexed 0-5)
            var seatOccupancy = new SeatOccupancy[6];
            for (int i = 0; i < 6; i++)
            {
                seatOccupancy[i] = new SeatOccupancy { PlayerId = null, DisplayName = null };
            }
            
            // Populate seat occupancy from match players
            var players = match.GetAllPlayers();
            foreach (var player in players)
            {
                if (player.PlayerSlot >= 0 && player.PlayerSlot < 6)
                {
                    seatOccupancy[player.PlayerSlot] = new SeatOccupancy
                    {
                        PlayerId = player.PlayerId,
                        DisplayName = player.DisplayName
                    };
                }
            }
            
            allMatches.Add(new RoomInfo
            {
                MatchId = match.MatchId,
                PlayerCount = playerCount,
                MaxPlayers = MatchManager.MAX_PLAYERS_PER_MATCH,
                SeatOccupancy = seatOccupancy
            });
        }
        
        // Ensure at least 4 rooms are available for 2x2 grid
        EnsureMinimumRooms(allMatches, 4);
        
        // Paginate (4 per page for 2x2 grid)
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
    
    private void EnsureMinimumRooms(List<RoomInfo> existingRooms, int minimumRooms = 4)
    {
        // Auto-create new rooms if:
        // 1. Less than minimum available rooms exist, OR
        // 2. All existing rooms have >2 players
        
        var roomsNeeded = minimumRooms - existingRooms.Count;
        var allRoomsBusy = existingRooms.All(r => r.PlayerCount >= 2);
        
        if (allRoomsBusy && existingRooms.Count > 0)
        {
            roomsNeeded = 1; // Create one more room
        }
        
        for (int i = 0; i < roomsNeeded; i++)
        {
            // Create new empty match without any placeholder players
            var emptyMatch = _matchManager.CreateEmptyMatch();
            if (emptyMatch != null)
            {
                var seatOccupancy = new SeatOccupancy[6];
                for (int j = 0; j < 6; j++)
                {
                    seatOccupancy[j] = new SeatOccupancy { PlayerId = null, DisplayName = null };
                }
                
                existingRooms.Add(new RoomInfo
                {
                    MatchId = emptyMatch.MatchId,
                    PlayerCount = 0,
                    MaxPlayers = MatchManager.MAX_PLAYERS_PER_MATCH,
                    SeatOccupancy = seatOccupancy
                });
            }
        }
    }
    
    public MatchInstance? JoinRoom(string matchId, string playerId, int seatIndex)
    {
        var match = _matchManager.GetMatch(matchId);
        if (match == null || !match.CanJoin())
        {
            return null;
        }
        
        // Validate seat index
        if (seatIndex < 0 || seatIndex >= MatchManager.MAX_PLAYERS_PER_MATCH)
        {
            return null;
        }
        
        // Check if seat is available
        var availableSlots = match.GetAvailableSlots();
        if (!availableSlots.Contains(seatIndex))
        {
            return null; // Seat already occupied
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
    
    public MatchInstance? GetSoloMatch(string matchId)
    {
        return _soloMatches.TryGetValue(matchId, out var match) ? match : null;
    }
}

public class SeatOccupancy
{
    public string? PlayerId { get; set; }
    public string? DisplayName { get; set; }
}

public class RoomInfo
{
    public string MatchId { get; set; } = string.Empty;
    public int PlayerCount { get; set; }
    public int MaxPlayers { get; set; }
    public SeatOccupancy[] SeatOccupancy { get; set; } = new SeatOccupancy[6];
}

public class RoomListResponse
{
    public List<RoomInfo> Rooms { get; set; } = new();
    public int CurrentPage { get; set; }
    public int TotalPages { get; set; }
    public int TotalRooms { get; set; }
}
