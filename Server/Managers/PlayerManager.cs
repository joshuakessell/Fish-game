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

            if (_players.Count >= 6)
                return null; // Match is full

            var player = new Player
            {
                PlayerId = playerId,
                DisplayName = displayName,
                ConnectionId = connectionId,
                PlayerSlot = -1, // Not assigned yet, player must select
                HasSelectedSlot = false,
                Credits = 10000m // Development: generous starting credits
            };

            _players[playerId] = player;
            return player;
        }
    }

    public List<int> GetAvailableSlots()
    {
        lock (_lock)
        {
            var occupiedSlots = _players.Values
                .Where(p => p.PlayerSlot >= 0 && p.PlayerSlot <= 5)
                .Select(p => p.PlayerSlot)
                .ToHashSet();

            var availableSlots = new List<int>();
            for (int i = 0; i < 6; i++)
            {
                if (!occupiedSlots.Contains(i))
                {
                    availableSlots.Add(i);
                }
            }

            return availableSlots;
        }
    }

    public bool AssignPlayerSlot(string playerId, int slotIndex)
    {
        lock (_lock)
        {
            if (!_players.TryGetValue(playerId, out var player))
                return false;

            if (slotIndex < 0 || slotIndex > 5)
                return false;

            var availableSlots = GetAvailableSlots();
            if (!availableSlots.Contains(slotIndex))
                return false;

            player.PlayerSlot = slotIndex;
            player.HasSelectedSlot = true;
            return true;
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
