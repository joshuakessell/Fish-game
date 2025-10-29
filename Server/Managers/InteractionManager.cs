namespace OceanKing.Server.Managers;

public class PendingInteraction
{
    public string InteractionId { get; set; } = Guid.NewGuid().ToString();
    public string SequenceId { get; set; } = string.Empty;
    public string PlayerId { get; set; } = string.Empty;
    public int BossTypeId { get; set; }
    public string InteractionType { get; set; } = string.Empty;
    public long StartTick { get; set; }
    public long TimeoutTick { get; set; }
    public Dictionary<string, object> InteractionData { get; set; } = new();
}

public class InteractionResult
{
    public string InteractionId { get; set; } = string.Empty;
    public string SequenceId { get; set; } = string.Empty;
    public decimal PerformanceModifier { get; set; }
    public int Score { get; set; }
    public bool Success { get; set; }
}

public class InteractionManager
{
    private readonly Dictionary<string, PendingInteraction> _pendingInteractions = new();
    private const int INTERACTION_TIMEOUT_TICKS = 300; // 10 seconds at 30 TPS

    public PendingInteraction CreateInteraction(string sequenceId, string playerId, int bossTypeId, string interactionType, long currentTick)
    {
        var interaction = new PendingInteraction
        {
            SequenceId = sequenceId,
            PlayerId = playerId,
            BossTypeId = bossTypeId,
            InteractionType = interactionType,
            StartTick = currentTick,
            TimeoutTick = currentTick + INTERACTION_TIMEOUT_TICKS
        };

        if (interactionType == "QTE_TEETH")
        {
            interaction.InteractionData["teeth"] = GenerateTeethTargets();
            interaction.InteractionData["hits"] = 0;
        }
        else if (interactionType == "CHEST_CHOICE")
        {
            interaction.InteractionData["chests"] = GenerateChestOutcomes();
        }

        _pendingInteractions[interaction.InteractionId] = interaction;
        
        Console.WriteLine($"Created {interactionType} interaction for player {playerId}, boss {bossTypeId}");
        
        return interaction;
    }

    public InteractionResult? ProcessInteractionSubmission(string interactionId, Dictionary<string, object> submissionData)
    {
        if (!_pendingInteractions.TryGetValue(interactionId, out var interaction))
        {
            Console.WriteLine($"Interaction {interactionId} not found");
            return null;
        }

        InteractionResult result;

        if (interaction.InteractionType == "QTE_TEETH")
        {
            result = ProcessMegalodonQTE(interaction, submissionData);
        }
        else if (interaction.InteractionType == "CHEST_CHOICE")
        {
            result = ProcessKrakenChestChoice(interaction, submissionData);
        }
        else
        {
            Console.WriteLine($"Unknown interaction type: {interaction.InteractionType}");
            return null;
        }

        _pendingInteractions.Remove(interactionId);
        return result;
    }

    private InteractionResult ProcessMegalodonQTE(PendingInteraction interaction, Dictionary<string, object> submissionData)
    {
        var targets = (List<Dictionary<string, float>>)interaction.InteractionData["teeth"];
        var clicks = submissionData.ContainsKey("clicks") 
            ? (List<Dictionary<string, float>>)submissionData["clicks"] 
            : new List<Dictionary<string, float>>();

        int hits = 0;
        foreach (var click in clicks)
        {
            var clickX = click["x"];
            var clickY = click["y"];
            
            foreach (var target in targets)
            {
                var dx = clickX - target["x"];
                var dy = clickY - target["y"];
                var distance = Math.Sqrt(dx * dx + dy * dy);
                
                if (distance < target["radius"] && !target.ContainsKey("hit"))
                {
                    target["hit"] = 1f;
                    hits++;
                    break;
                }
            }
        }

        decimal modifier = hits switch
        {
            5 => 1.30m, // +30% for perfect
            4 => 1.20m, // +20% for 4/5
            3 => 1.10m, // +10% for 3/5
            2 => 1.00m, // No modifier for 2/5
            1 => 0.90m, // -10% for 1/5
            _ => 0.70m  // -30% for 0/5
        };

        Console.WriteLine($"Megalodon QTE completed: {hits}/5 hits, modifier: {modifier:P0}");

        return new InteractionResult
        {
            InteractionId = interaction.InteractionId,
            SequenceId = interaction.SequenceId,
            PerformanceModifier = modifier,
            Score = hits,
            Success = hits >= 3
        };
    }

    private InteractionResult ProcessKrakenChestChoice(PendingInteraction interaction, Dictionary<string, object> submissionData)
    {
        var chests = (List<decimal>)interaction.InteractionData["chests"];
        
        var choiceIndex = submissionData.ContainsKey("choice") 
            ? Convert.ToInt32(submissionData["choice"]) 
            : 0;
            
        if (choiceIndex < 0 || choiceIndex >= chests.Count)
        {
            choiceIndex = 0;
        }

        var modifier = chests[choiceIndex];
        
        Console.WriteLine($"Kraken chest choice: chest {choiceIndex}, modifier: {modifier:P0}");

        return new InteractionResult
        {
            InteractionId = interaction.InteractionId,
            SequenceId = interaction.SequenceId,
            PerformanceModifier = modifier,
            Score = choiceIndex,
            Success = modifier >= 1.0m
        };
    }

    private List<Dictionary<string, float>> GenerateTeethTargets()
    {
        var targets = new List<Dictionary<string, float>>();
        var random = Random.Shared;
        
        for (int i = 0; i < 5; i++)
        {
            targets.Add(new Dictionary<string, float>
            {
                ["x"] = 300 + random.Next(1000),
                ["y"] = 200 + random.Next(400),
                ["radius"] = 40f
            });
        }
        
        return targets;
    }

    private List<decimal> GenerateChestOutcomes()
    {
        var outcomes = new List<decimal> { 0.70m, 1.00m, 1.30m };
        
        return outcomes.OrderBy(_ => Random.Shared.Next()).ToList();
    }

    public List<PendingInteraction> CheckTimeouts(long currentTick)
    {
        var timedOut = _pendingInteractions.Values
            .Where(i => currentTick >= i.TimeoutTick)
            .ToList();

        foreach (var interaction in timedOut)
        {
            _pendingInteractions.Remove(interaction.InteractionId);
        }

        return timedOut;
    }

    public PendingInteraction? GetPendingInteraction(string playerId)
    {
        return _pendingInteractions.Values
            .FirstOrDefault(i => i.PlayerId == playerId);
    }

    public PendingInteraction? GetInteractionById(string interactionId)
    {
        _pendingInteractions.TryGetValue(interactionId, out var interaction);
        return interaction;
    }
}
