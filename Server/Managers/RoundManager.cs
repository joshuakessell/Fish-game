namespace OceanKing.Server.Managers;

public class RoundState
{
    public int RoundNumber { get; set; }
    public long RoundStartTick { get; set; }
    public long RoundEndTick { get; set; }
    public List<int> EligibleUltraRareBosses { get; set; } = new();
    public List<int> EligibleRareMidBosses { get; set; } = new();
    public bool IsTransitioning { get; set; }
}

public class RoundManager
{
    private const int ROUND_DURATION_TICKS = 18000; // 10 minutes at 30 TPS
    private const int ULTRA_RARE_BOSSES_PER_ROUND = 4;
    private const int RARE_MID_BOSSES_PER_ROUND = 5;
    private const int TRANSITION_DURATION_TICKS = 90; // 3 seconds at 30 TPS
    
    private RoundState _currentRound;
    private long _transitionStartTick;

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
        if (_currentRound.IsTransitioning)
        {
            if (currentTick >= _transitionStartTick + TRANSITION_DURATION_TICKS)
            {
                EndTransition(currentTick);
            }
        }
        else if (currentTick >= _currentRound.RoundEndTick)
        {
            // Once round time expires, stop spawning new fish immediately
            // Transition starts when all fish clear the screen
            if (activeFishCount == 0)
            {
                StartTransition(currentTick);
            }
        }
    }
    
    public bool ShouldSuppressSpawns(long currentTick)
    {
        // Suppress spawns during transition OR after round end time
        return _currentRound.IsTransitioning || currentTick >= _currentRound.RoundEndTick;
    }

    private void StartTransition(long currentTick)
    {
        _currentRound.IsTransitioning = true;
        _transitionStartTick = currentTick;
        
        Console.WriteLine($"Round {_currentRound.RoundNumber} ending - transition started");
    }

    private void EndTransition(long currentTick)
    {
        _currentRound.IsTransitioning = false;
        _currentRound.RoundNumber++;
        _currentRound.RoundStartTick = currentTick;
        _currentRound.RoundEndTick = currentTick + ROUND_DURATION_TICKS;
        
        SelectBossesForRound();
        
        Console.WriteLine($"Round {_currentRound.RoundNumber} started");
        Console.WriteLine($"  Ultra-rare bosses: {string.Join(", ", _currentRound.EligibleUltraRareBosses)}");
        Console.WriteLine($"  Rare mid-bosses: {string.Join(", ", _currentRound.EligibleRareMidBosses)}");
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
        if (_currentRound.IsTransitioning)
            return 0;
            
        return Math.Max(0, _currentRound.RoundEndTick - currentTick);
    }

    public bool IsTransitioning()
    {
        return _currentRound.IsTransitioning;
    }
}
