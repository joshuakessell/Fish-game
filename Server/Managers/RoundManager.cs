namespace OceanKing.Server.Managers;

public class RoundState
{
    public int RoundNumber { get; set; }
    public long RoundStartTick { get; set; }
    public long RoundEndTick { get; set; }
    public List<int> EligibleUltraRareBosses { get; set; } = new();
    public List<int> EligibleRareMidBosses { get; set; } = new();
}

public class RoundManager
{
    private const int ROUND_DURATION_TICKS = 18000; // 10 minutes at 30 TPS
    private const int ULTRA_RARE_BOSSES_PER_ROUND = 4;
    private const int RARE_MID_BOSSES_PER_ROUND = 5;
    
    private RoundState _currentRound;

    public RoundManager()
    {
        _currentRound = new RoundState
        {
            RoundNumber = 1,
            RoundStartTick = 0,
            RoundEndTick = ROUND_DURATION_TICKS
        };
        
        SelectBossesForRound();
    }

    public void Initialize(long currentTick)
    {
        _currentRound.RoundStartTick = currentTick;
        _currentRound.RoundEndTick = currentTick + ROUND_DURATION_TICKS;
        SelectBossesForRound();
        
        Console.WriteLine($"Round {_currentRound.RoundNumber} initialized");
        Console.WriteLine($"  Ultra-rare bosses: {string.Join(", ", _currentRound.EligibleUltraRareBosses)}");
        Console.WriteLine($"  Rare mid-bosses: {string.Join(", ", _currentRound.EligibleRareMidBosses)}");
    }

    public void Update(long currentTick, int activeFishCount)
    {
        // Seamlessly rotate bosses every 10 minutes without interrupting gameplay
        if (currentTick >= _currentRound.RoundEndTick)
        {
            _currentRound.RoundNumber++;
            _currentRound.RoundStartTick = currentTick;
            _currentRound.RoundEndTick = currentTick + ROUND_DURATION_TICKS;
            
            SelectBossesForRound();
            
            Console.WriteLine($"Round {_currentRound.RoundNumber} started - boss rotation complete");
            Console.WriteLine($"  Ultra-rare bosses: {string.Join(", ", _currentRound.EligibleUltraRareBosses)}");
            Console.WriteLine($"  Rare mid-bosses: {string.Join(", ", _currentRound.EligibleRareMidBosses)}");
        }
    }

    private void SelectBossesForRound()
    {
        var ultraRarePool = Entities.BossCatalog.GetUltraRareBossTypes();
        var rareMidPool = Entities.BossCatalog.GetRareMidBossTypes();
        
        _currentRound.EligibleUltraRareBosses = ultraRarePool
            .OrderBy(_ => Random.Shared.Next())
            .Take(ULTRA_RARE_BOSSES_PER_ROUND)
            .ToList();
        
        _currentRound.EligibleRareMidBosses = rareMidPool
            .OrderBy(_ => Random.Shared.Next())
            .Take(Math.Min(RARE_MID_BOSSES_PER_ROUND, rareMidPool.Count))
            .ToList();
    }

    public List<int> GetEligibleBosses()
    {
        var eligible = new List<int>();
        eligible.AddRange(_currentRound.EligibleUltraRareBosses);
        eligible.AddRange(_currentRound.EligibleRareMidBosses);
        return eligible;
    }

    public bool IsBossEligible(int typeId)
    {
        return _currentRound.EligibleUltraRareBosses.Contains(typeId) ||
               _currentRound.EligibleRareMidBosses.Contains(typeId);
    }

    public RoundState GetRoundState()
    {
        return _currentRound;
    }

    public int GetRoundNumber()
    {
        return _currentRound.RoundNumber;
    }

    public long GetTimeRemainingTicks(long currentTick)
    {
        return Math.Max(0, _currentRound.RoundEndTick - currentTick);
    }
}
