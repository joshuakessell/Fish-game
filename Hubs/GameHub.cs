using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using OceanKing.Server;
using OceanKing.Server.Managers;
using System.Security.Claims;

namespace OceanKing.Hubs;

[Authorize] // Require JWT authentication for all hub methods
public class GameHub : Hub
{
    private readonly GameServerHost _gameServer;
    private static readonly Dictionary<string, string> _connectionToMatch = new();
    private static readonly Dictionary<string, string> _connectionToPlayer = new();

    public GameHub(GameServerHost gameServer)
    {
        _gameServer = gameServer;
    }
    
    // Helper to get user info from JWT claims
    private (string userId, string name, int credits) GetUserFromContext()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
        var name = Context.User?.FindFirst(ClaimTypes.Name)?.Value ?? "Player";
        var creditsStr = Context.User?.FindFirst("credits")?.Value;
        int.TryParse(creditsStr, out int credits);
        
        return (userId, name, credits);
    }

    public void Fire(float x, float y, float directionX, float directionY, string clientNonce = "", int? targetFishId = null)
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
            DirectionY = directionY,
            ClientNonce = clientNonce,
            TargetFishId = targetFishId
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

    public async Task<object> SelectTurretSlot(int slotIndex)
    {
        if (!_connectionToMatch.TryGetValue(Context.ConnectionId, out var matchId))
            return new { success = false, message = "Not in a match" };

        if (!_connectionToPlayer.TryGetValue(Context.ConnectionId, out var playerId))
            return new { success = false, message = "Player not found" };

        var matchManager = _gameServer.GetMatchManager();
        var match = matchManager.GetMatch(matchId);
        
        if (match == null)
            return new { success = false, message = "Match not found" };

        if (slotIndex < 0 || slotIndex > 7)
            return new { success = false, message = "Invalid slot index" };

        var success = match.AssignPlayerSlot(playerId, slotIndex);
        
        if (success)
        {
            var player = match.GetPlayer(playerId);
            if (player != null)
            {
                Console.WriteLine($"Player {player.DisplayName} selected turret slot {slotIndex}");
                
                await Clients.Group(matchId).SendAsync("PlayerSlotSelected", new
                {
                    playerId = playerId,
                    playerSlot = slotIndex,
                    displayName = player.DisplayName
                });
            }
            
            return new { success = true, slotIndex = slotIndex };
        }
        
        return new { success = false, message = "Slot not available" };
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

    // Lobby system methods
    public RoomListResponse GetRoomList(int page = 0)
    {
        var lobbyManager = _gameServer.GetLobbyManager();
        return lobbyManager.GetRoomList(page);
    }
    
    public async Task<object> JoinRoom(string matchId, int seatIndex)
    {
        try
        {
            var (userId, name, credits) = GetUserFromContext();
            
            Console.WriteLine($"[JoinRoom] User {name} (ID: {userId}) attempting to join room {matchId} at seat {seatIndex}");
            
            // Validate seatIndex
            if (seatIndex < 0 || seatIndex > 5)
            {
                Console.WriteLine($"[JoinRoom] Invalid seat index: {seatIndex}");
                return new { success = false, message = "Invalid seat index. Must be 0-5." };
            }
            
            // Auto-create match if it doesn't exist
            var matchManager = _gameServer.GetMatchManager();
            var existingMatch = matchManager.GetMatch(matchId);
            
            if (existingMatch == null)
            {
                Console.WriteLine($"[JoinRoom] Match {matchId} does not exist, creating it...");
                existingMatch = matchManager.CreateMatchWithId(matchId);
                
                if (existingMatch == null)
                {
                    Console.WriteLine($"[JoinRoom] Failed to create match {matchId}");
                    return new { success = false, message = "Failed to create match room" };
                }
            }
            
            // Remove stale connection if this user is already in the match (handles browser refresh/multiple tabs)
            var allPlayers = existingMatch.GetAllPlayers();
            var existingPlayer = allPlayers.FirstOrDefault(p => p.PlayerId == userId && p.ConnectionId != Context.ConnectionId);
            if (existingPlayer != null)
            {
                Console.WriteLine($"[JoinRoom] Removing stale connection for user {userId} (player {existingPlayer.DisplayName}) before reconnecting");
                existingMatch.RemovePlayer(existingPlayer.PlayerId);
                
                // Clean up old connection mappings
                if (!string.IsNullOrEmpty(existingPlayer.ConnectionId))
                {
                    _connectionToMatch.Remove(existingPlayer.ConnectionId);
                    _connectionToPlayer.Remove(existingPlayer.ConnectionId);
                    await Groups.RemoveFromGroupAsync(existingPlayer.ConnectionId, matchId);
                }
            }
            
            var lobbyManager = _gameServer.GetLobbyManager();
            var match = lobbyManager.JoinRoom(matchId, Context.ConnectionId, seatIndex);
            
            if (match == null)
            {
                Console.WriteLine($"[JoinRoom] Failed to join room {matchId} - room not available or seat {seatIndex} occupied");
                return new { success = false, message = "Room not available, full, or seat already occupied" };
            }
            
            Console.WriteLine($"[JoinRoom] Room validated, adding player to match...");
            
            // Add player with specific seat (playerId, displayName, connectionId, seatIndex)
            var player = match.AddPlayer(userId, name, Context.ConnectionId, seatIndex);
            
            if (player == null)
            {
                Console.WriteLine($"[JoinRoom] Failed to add player {name} to match {matchId} at seat {seatIndex}");
                return new { success = false, message = "Failed to join room - seat may have been taken" };
            }
            
            // Sync credits from JWT to player state
            player.Credits = credits;
            
            _connectionToMatch[Context.ConnectionId] = match.MatchId;
            _connectionToPlayer[Context.ConnectionId] = player.PlayerId;
            
            await Groups.AddToGroupAsync(Context.ConnectionId, match.MatchId);
            
            Console.WriteLine($"Player {name} (JWT user {userId}) joined room {matchId} at seat {seatIndex} with {credits} credits");
            
            return new
            {
                success = true,
                matchId = match.MatchId,
                playerId = player.PlayerId,
                playerSlot = player.PlayerSlot,
                credits = player.Credits,
                availableSlots = match.GetAvailableSlots(),
                isSolo = match.IsSolo()
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in JoinRoom: {ex.Message}");
            return new { success = false, message = ex.Message };
        }
    }
    
    public async Task<object> CreateSoloGame(string displayName)
    {
        try
        {
            var (userId, name, credits) = GetUserFromContext();
            var actualName = string.IsNullOrEmpty(name) ? displayName : name;
            
            var lobbyManager = _gameServer.GetLobbyManager();
            var match = lobbyManager.CreateSoloMatch(Context.ConnectionId, Context.GetHttpContext()!.RequestServices.GetRequiredService<IHubContext<GameHub>>());
            
            var player = match.AddPlayer(Context.ConnectionId, actualName, Context.ConnectionId);
            
            if (player == null)
            {
                return new { success = false, message = "Failed to create solo game" };
            }
            
            // Sync credits from JWT to player state
            player.Credits = credits;
            
            _connectionToMatch[Context.ConnectionId] = match.MatchId;
            _connectionToPlayer[Context.ConnectionId] = player.PlayerId;
            
            await Groups.AddToGroupAsync(Context.ConnectionId, match.MatchId);
            
            var availableSlots = match.GetAvailableSlots();
            
            Console.WriteLine($"Player {actualName} (JWT user {userId}) created solo game {match.MatchId} with {credits} credits");
            
            return new
            {
                success = true,
                matchId = match.MatchId,
                playerId = player.PlayerId,
                playerSlot = player.PlayerSlot,
                credits = player.Credits,
                availableSlots = availableSlots,
                isSolo = true
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in CreateSoloGame: {ex.Message}");
            return new { success = false, message = ex.Message };
        }
    }

    // Debug commands for testing fish spawning and lifecycle
    public async Task<object> ToggleDebugMode()
    {
        if (!_connectionToMatch.TryGetValue(Context.ConnectionId, out var matchId))
            return new { success = false, message = "Not in a match" };
        
        var (userId, name, credits) = GetUserFromContext();
        
        // Toggle the debug flag
        var debugEnabled = Server.Managers.FishManager.DEBUG_FISH_LIFECYCLE = !Server.Managers.FishManager.DEBUG_FISH_LIFECYCLE;
        
        Console.WriteLine($"[DEBUG] Fish lifecycle debugging {(debugEnabled ? "ENABLED" : "DISABLED")} by {name}");
        
        // Broadcast debug status to all clients in match
        await Clients.Group(matchId).SendAsync("DebugModeChanged", new
        {
            enabled = debugEnabled,
            message = $"Fish lifecycle debugging {(debugEnabled ? "enabled" : "disabled")} by {name}"
        });
        
        return new { success = true, enabled = debugEnabled };
    }
    
    public async Task<object> SpawnTestFish(int typeId, int count = 1)
    {
        if (!_connectionToMatch.TryGetValue(Context.ConnectionId, out var matchId))
            return new { success = false, message = "Not in a match" };

        if (!_connectionToPlayer.TryGetValue(Context.ConnectionId, out var playerId))
            return new { success = false, message = "Player not found" };
        
        var matchManager = _gameServer.GetMatchManager();
        var match = matchManager.GetMatch(matchId);
        
        if (match == null)
            return new { success = false, message = "Match not found" };
        
        // Validate fish type
        if (typeId < 0 || typeId > 21)
            return new { success = false, message = "Invalid fish type ID (0-21)" };
        
        // Limit count to prevent spam
        count = Math.Min(count, 10);
        
        var (userId, name, credits) = GetUserFromContext();
        Console.WriteLine($"[DEBUG] Spawning {count} test fish of type {typeId} requested by {name}");
        
        // Enqueue command to spawn test fish
        match.EnqueueCommand(new GameCommand
        {
            Type = CommandType.SpawnTestFish,
            PlayerId = playerId,
            TestFishTypeId = typeId,
            TestFishCount = count
        });
        
        // Notify all players in match
        await Clients.Group(matchId).SendAsync("TestFishSpawned", new
        {
            typeId = typeId,
            count = count,
            requestedBy = name
        });
        
        return new { success = true, typeId = typeId, count = count };
    }
    
    public async Task<object> GetDebugInfo()
    {
        if (!_connectionToMatch.TryGetValue(Context.ConnectionId, out var matchId))
            return new { success = false, message = "Not in a match" };
        
        var matchManager = _gameServer.GetMatchManager();
        var match = matchManager.GetMatch(matchId);
        
        if (match == null)
            return new { success = false, message = "Match not found" };
        
        // Get current fish count and debug status
        var fishManager = match.GetFishManager();
        var activeFish = fishManager?.GetActiveFish() ?? new List<Server.Entities.Fish>();
        
        var debugInfo = new
        {
            success = true,
            debugEnabled = Server.Managers.FishManager.DEBUG_FISH_LIFECYCLE,
            activeFishCount = activeFish.Count,
            fishByType = activeFish.GroupBy(f => f.TypeId)
                .Select(g => new { typeId = g.Key, count = g.Count() })
                .OrderBy(x => x.typeId),
            fishGroups = activeFish.GroupBy(f => f.GroupId)
                .Where(g => g.Count() > 1)
                .Select(g => new { groupId = g.Key, count = g.Count(), typeId = g.First().TypeId })
        };
        
        return debugInfo;
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        Console.WriteLine($"[OnDisconnectedAsync] Connection {Context.ConnectionId} disconnected. Exception: {(exception != null ? exception.Message : "none")}");
        
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
                    
                    // Clean up solo matches when player disconnects
                    if (match.IsSolo())
                    {
                        var lobbyManager = _gameServer.GetLobbyManager();
                        lobbyManager.RemoveSoloMatch(matchId);
                    }
                }
            }

            _connectionToMatch.Remove(Context.ConnectionId);
            _connectionToPlayer.Remove(Context.ConnectionId);
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, matchId);
        }

        await base.OnDisconnectedAsync(exception);
    }

}
