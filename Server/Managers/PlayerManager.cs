using OceanKing.Server.Entities;

namespace OceanKing.Server.Managers;

public class PlayerManager
{
    private readonly Dictionary<string, Player> _players = new();
    private readonly object _lock = new();

    public Player? AddPlayer(string playerId, string displayName, string connectionId)
    {
        lock (_lock)
        {
            if (_players.ContainsKey(playerId))
                return _players[playerId];

            if (_players.Count >= 8)
                return null; // Match is full

            var player = new Player
            {
                PlayerId = playerId,
                DisplayName = displayName,
                ConnectionId = connectionId,
                PlayerSlot = _players.Count,
                Credits = 10000m // Development: generous starting credits
            };

            _players[playerId] = player;
            return player;
        }
    }

    public void RemovePlayer(string playerId)
    {
        lock (_lock)
        {
            _players.Remove(playerId);
        }
    }

    public Player? GetPlayer(string playerId)
    {
        lock (_lock)
        {
            _players.TryGetValue(playerId, out var player);
            return player;
        }
    }

    public List<Player> GetAllPlayers()
    {
        lock (_lock)
        {
            return _players.Values.ToList();
        }
    }

    public int GetPlayerCount()
    {
        lock (_lock)
        {
            return _players.Count;
        }
    }
}
