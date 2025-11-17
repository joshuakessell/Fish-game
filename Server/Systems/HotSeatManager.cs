namespace OceanKing.Server.Systems;

/// <summary>
/// Manages the Hot Seat feature, which randomly activates bonus multipliers for player slots.
/// Cooldown period measures from slot expiration (not activation) to prevent
/// back-to-back hot seat activations and maintain balanced RTP variance.
/// </summary>
public class HotSeatManager
{
    private int? _currentHotSeatSlot;
    private float _multiplier;
    private long _expiresAtTick;
    private long _lastActivationTick;
    private readonly Random _random;
    
    private const int DURATION_TICKS = 900;
    private const int COOLDOWN_TICKS = 1800;
    private const float ACTIVATION_CHANCE = 0.02f;
    
    private static readonly float[] MULTIPLIER_POOL = { 1.05f, 1.08f, 1.10f, 1.15f };
    private static readonly float[] MULTIPLIER_WEIGHTS = { 50f, 30f, 15f, 5f };
    
    public HotSeatManager(Random? random = null)
    {
        _currentHotSeatSlot = null;
        _multiplier = 1.0f;
        _expiresAtTick = 0;
        _lastActivationTick = -COOLDOWN_TICKS;
        _random = random ?? Random.Shared;
    }
    
    public void Update(int currentTick)
    {
        if (_currentHotSeatSlot.HasValue && currentTick >= _expiresAtTick)
        {
            Console.WriteLine($"[HotSeat] Expired for slot {_currentHotSeatSlot.Value} (multiplier was {_multiplier:F2}x)");
            _currentHotSeatSlot = null;
            _multiplier = 1.0f;
            _lastActivationTick = currentTick;
        }
        
        if (!_currentHotSeatSlot.HasValue && 
            currentTick - _lastActivationTick >= COOLDOWN_TICKS &&
            _random.NextSingle() < ACTIVATION_CHANCE)
        {
            ActivateRandomHotSeat(currentTick);
        }
    }
    
    private void ActivateRandomHotSeat(int currentTick)
    {
        int slot = _random.Next(0, 6);
        
        float totalWeight = MULTIPLIER_WEIGHTS.Sum();
        float randomValue = _random.NextSingle() * totalWeight;
        float cumulativeWeight = 0f;
        float selectedMultiplier = MULTIPLIER_POOL[0];
        
        for (int i = 0; i < MULTIPLIER_POOL.Length; i++)
        {
            cumulativeWeight += MULTIPLIER_WEIGHTS[i];
            if (randomValue < cumulativeWeight)
            {
                selectedMultiplier = MULTIPLIER_POOL[i];
                break;
            }
        }
        
        _currentHotSeatSlot = slot;
        _multiplier = selectedMultiplier;
        _expiresAtTick = currentTick + DURATION_TICKS;
        _lastActivationTick = currentTick;
        
        Console.WriteLine($"[HotSeat] 🔥 ACTIVATED for slot {slot} with {_multiplier:F2}x multiplier (expires at tick {_expiresAtTick})");
    }
    
    public float GetMultiplier(int playerSlot)
    {
        if (_currentHotSeatSlot.HasValue && _currentHotSeatSlot.Value == playerSlot)
        {
            return _multiplier;
        }
        return 1.0f;
    }
    
    public bool IsHotSeat(int playerSlot)
    {
        return _currentHotSeatSlot.HasValue && _currentHotSeatSlot.Value == playerSlot;
    }
}
