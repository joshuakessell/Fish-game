namespace OceanKing.Server.Systems;

public enum TableState { Cold, Neutral, Hot }

public class HotColdCycleManager
{
    private TableState _currentState;
    private DateTime _stateStartTime;
    private Random _rng;
    private int _totalShots;
    private decimal _totalWagered;
    private decimal _totalPaidOut;
    private int _currentCycleDuration;
    private DateTime? _forcedStateLockUntil;
    
    // State durations (minutes)
    private const int MIN_CYCLE_DURATION = 3;
    private const int MAX_CYCLE_DURATION = 8;
    
    // RTP thresholds for auto-correction
    private const decimal RTP_TARGET_MIN = 0.95m;
    private const decimal RTP_TARGET_MAX = 0.97m;
    private const int MIN_SHOTS_FOR_CORRECTION = 500;
    
    public HotColdCycleManager(int seed)
    {
        _rng = new Random(seed);
        _currentState = TableState.Neutral;
        _stateStartTime = DateTime.UtcNow;
        _currentCycleDuration = _rng.Next(MIN_CYCLE_DURATION, MAX_CYCLE_DURATION + 1);
        _forcedStateLockUntil = null;
    }
    
    public void Update()
    {
        var now = DateTime.UtcNow;
        
        // Check if forced state lock is active
        if (_forcedStateLockUntil.HasValue && now < _forcedStateLockUntil.Value)
        {
            return;
        }
        
        // Check if cycle duration expired
        var elapsed = (now - _stateStartTime).TotalMinutes;
        
        if (elapsed >= _currentCycleDuration)
        {
            TransitionState();
        }
        
        // Auto-correction based on RTP
        if (_totalShots >= MIN_SHOTS_FOR_CORRECTION)
        {
            var currentRTP = _totalWagered > 0 ? _totalPaidOut / _totalWagered : 0;
            
            if (currentRTP < RTP_TARGET_MIN && _currentState != TableState.Hot)
            {
                ForceState(TableState.Hot);
            }
            else if (currentRTP > RTP_TARGET_MAX && _currentState != TableState.Cold)
            {
                ForceState(TableState.Cold);
            }
        }
    }
    
    private void TransitionState()
    {
        // 70% cold, 30% hot distribution
        var roll = _rng.NextDouble();
        _currentState = roll < 0.70 ? TableState.Cold : TableState.Hot;
        _stateStartTime = DateTime.UtcNow;
        _currentCycleDuration = _rng.Next(MIN_CYCLE_DURATION, MAX_CYCLE_DURATION + 1);
        _forcedStateLockUntil = null;
    }
    
    private void ForceState(TableState state)
    {
        _currentState = state;
        _stateStartTime = DateTime.UtcNow;
        _currentCycleDuration = _rng.Next(MIN_CYCLE_DURATION, MAX_CYCLE_DURATION + 1);
        _forcedStateLockUntil = DateTime.UtcNow.AddMinutes(_currentCycleDuration);
    }
    
    public void RecordShot(decimal wagered, decimal payout)
    {
        _totalShots++;
        _totalWagered += wagered;
        _totalPaidOut += payout;
    }
    
    // Modifiers based on current state
    public float GetBossSpawnMultiplier()
    {
        return _currentState switch
        {
            TableState.Cold => 0.70f,  // 30% reduction
            TableState.Hot => 1.50f,   // 50% boost
            _ => 1.0f
        };
    }
    
    public float GetBossOddsMultiplier()
    {
        return _currentState switch
        {
            TableState.Cold => 1.0f,   // Baseline
            TableState.Hot => 3.0f,    // 3.0x better odds
            _ => 1.0f
        };
    }
    
    public float GetPayoutMultiplierBoost()
    {
        return _currentState switch
        {
            TableState.Cold => 1.0f,   // Lower end of range
            TableState.Hot => 1.8f,    // 80% boost
            _ => 1.0f
        };
    }
    
    public TableState CurrentState => _currentState;
    public decimal CurrentRTP => _totalWagered > 0 ? _totalPaidOut / _totalWagered : 0;
}
