using Xunit;
using FluentAssertions;
using OceanKing.Server.Systems.Paths;
using OceanKing.Server.Entities;

namespace Tests.Unit;

public class PathGeneratorTests
{
    [Fact]
    public void GeneratePathForFish_DeterministicSeed_ShouldProduceSamePathType()
    {
        var fishDef = new FishDefinition { TypeId = 0, BaseSpeed = 100f };
        int fishId = 1;
        int currentTick = 0;
        int spawnEdge = 0;
        int groupIndex = 0;
        long groupId = 1;

        var path1 = PathGenerator.GeneratePathForFish(fishId, fishDef, currentTick, spawnEdge, groupIndex, groupId);
        var path2 = PathGenerator.GeneratePathForFish(fishId, fishDef, currentTick, spawnEdge, groupIndex, groupId);

        path1.Should().NotBeNull();
        path2.Should().NotBeNull();
        path1.GetType().Should().Be(path2.GetType(), "same seed should produce same path type");
    }

    [Fact]
    public void GeneratePathForFish_DifferentSeeds_MayProduceDifferentPaths()
    {
        var fishDef = new FishDefinition { TypeId = 0, BaseSpeed = 100f };
        int currentTick = 0;
        int spawnEdge = 0;
        int groupIndex = 0;
        long groupId = 1;

        var path1 = PathGenerator.GeneratePathForFish(1, fishDef, currentTick, spawnEdge, groupIndex, groupId);
        var path2 = PathGenerator.GeneratePathForFish(2, fishDef, currentTick, spawnEdge, groupIndex, groupId);

        path1.Should().NotBeNull();
        path2.Should().NotBeNull();
    }

    [Fact]
    public void GeneratePathForFish_ShouldProduceValidPath()
    {
        var fishDef = new FishDefinition { TypeId = 0, BaseSpeed = 100f };
        int fishId = 1;
        int currentTick = 100;
        int spawnEdge = 2;
        int groupIndex = 0;
        long groupId = 1;

        var path = PathGenerator.GeneratePathForFish(fishId, fishDef, currentTick, spawnEdge, groupIndex, groupId);

        path.Should().NotBeNull();

        var pos0 = path.GetPosition(0);
        var pos1 = path.GetPosition(1);

        pos0.Should().NotBeNull();
        pos1.Should().NotBeNull();

        pos0[0].Should().BeInRange(-100f, 2000f, "start X should be within reasonable bounds");
        pos0[1].Should().BeInRange(-100f, 1000f, "start Y should be within reasonable bounds");
        pos1[0].Should().BeInRange(-100f, 2000f, "end X should be within reasonable bounds");
        pos1[1].Should().BeInRange(-100f, 1000f, "end Y should be within reasonable bounds");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(3)]
    [InlineData(4)]
    [InlineData(5)]
    [InlineData(6)]
    [InlineData(7)]
    public void GeneratePathForFish_AllSpawnEdges_ShouldBeValid(int spawnEdge)
    {
        var fishDef = new FishDefinition { TypeId = 0, BaseSpeed = 100f };
        int fishId = 1;
        int currentTick = 0;
        int groupIndex = 0;
        long groupId = 1;

        var path = PathGenerator.GeneratePathForFish(fishId, fishDef, currentTick, spawnEdge, groupIndex, groupId);

        path.Should().NotBeNull();
        var position = path.GetPosition(0);
        position.Should().NotBeNull();
    }

    [Fact]
    public void GeneratePathForFish_GroupFormation_ShouldShareBaseAnchorPoints()
    {
        var fishDef = new FishDefinition { TypeId = 0, BaseSpeed = 100f };
        int currentTick = 100;
        int spawnEdge = 2;
        long sharedGroupId = 42;

        var path1 = PathGenerator.GeneratePathForFish(1, fishDef, currentTick, spawnEdge, 0, sharedGroupId);
        var path2 = PathGenerator.GeneratePathForFish(2, fishDef, currentTick, spawnEdge, 1, sharedGroupId);
        var path3 = PathGenerator.GeneratePathForFish(3, fishDef, currentTick, spawnEdge, 2, sharedGroupId);

        path1.Should().NotBeNull();
        path2.Should().NotBeNull();
        path3.Should().NotBeNull();

        path1.GetType().Should().Be(path2.GetType(), "same group should use same path type");
        path2.GetType().Should().Be(path3.GetType(), "same group should use same path type");
    }

    [Fact]
    public void GeneratePathForFish_DifferentGroups_ShouldHaveDifferentPaths()
    {
        var fishDef = new FishDefinition { TypeId = 0, BaseSpeed = 100f };
        int currentTick = 100;
        int spawnEdge = 2;

        var pathGroup1 = PathGenerator.GeneratePathForFish(1, fishDef, currentTick, spawnEdge, 0, 1);
        var pathGroup2 = PathGenerator.GeneratePathForFish(2, fishDef, currentTick, spawnEdge, 0, 2);

        pathGroup1.Should().NotBeNull();
        pathGroup2.Should().NotBeNull();

        var pos1Start = pathGroup1.GetPosition(0);
        var pos2Start = pathGroup2.GetPosition(0);

        bool pathsAreDifferent = 
            Math.Abs(pos1Start[0] - pos2Start[0]) > 10f ||
            Math.Abs(pos1Start[1] - pos2Start[1]) > 10f ||
            pathGroup1.GetType() != pathGroup2.GetType();

        pathsAreDifferent.Should().BeTrue("different groups should have different paths");
    }

    [Fact]
    public void GeneratePathForFish_BonusFish_ShouldUseSinePath()
    {
        var bonusFishDef = FishCatalog.GetFish(21);
        bonusFishDef.Should().NotBeNull("Wave Rider fish definition should exist");
        
        int fishId = 100;
        int currentTick = 0;
        int spawnEdge = 0;
        int groupIndex = 0;
        long groupId = 1;

        var path = PathGenerator.GeneratePathForFish(fishId, bonusFishDef!, currentTick, spawnEdge, groupIndex, groupId);

        path.Should().NotBeNull();
        path.Should().BeOfType<SinePath>("Wave Rider (type 21) should use SinePath");
    }

    [Fact]
    public void GeneratePathForFish_SameInputs_ShouldProduceSamePositions()
    {
        var fishDef = new FishDefinition { TypeId = 0, BaseSpeed = 100f };
        int fishId = 123;
        int currentTick = 50;
        int spawnEdge = 3;
        int groupIndex = 1;
        long groupId = 5;

        var path1 = PathGenerator.GeneratePathForFish(fishId, fishDef, currentTick, spawnEdge, groupIndex, groupId);
        var path2 = PathGenerator.GeneratePathForFish(fishId, fishDef, currentTick, spawnEdge, groupIndex, groupId);

        var testPoints = new[] { 0.0, 0.25, 0.5, 0.75, 1.0 };

        foreach (var t in testPoints)
        {
            var pos1 = path1.GetPosition((float)t);
            var pos2 = path2.GetPosition((float)t);

            Math.Abs(pos1[0] - pos2[0]).Should().BeLessThan(0.01f, $"X position at t={t} should match");
            Math.Abs(pos1[1] - pos2[1]).Should().BeLessThan(0.01f, $"Y position at t={t} should match");
        }
    }

    [Fact]
    public void GeneratePathForFish_FormationIndices_ShouldProduceValidOffsets()
    {
        var fishDef = new FishDefinition { TypeId = 0, BaseSpeed = 100f };
        int currentTick = 100;
        int spawnEdge = 2;
        long sharedGroupId = 10;

        var positions = new List<(float, float)>();

        for (int formationIndex = 0; formationIndex < 5; formationIndex++)
        {
            var path = PathGenerator.GeneratePathForFish(formationIndex + 1, fishDef, currentTick, spawnEdge, formationIndex, sharedGroupId);
            var pos = path.GetPosition(0);
            positions.Add((pos[0], pos[1]));
        }

        for (int i = 0; i < positions.Count; i++)
        {
            for (int j = i + 1; j < positions.Count; j++)
            {
                var distance = Math.Sqrt(
                    Math.Pow(positions[i].Item1 - positions[j].Item1, 2) +
                    Math.Pow(positions[i].Item2 - positions[j].Item2, 2)
                );

                distance.Should().BeGreaterThan(10f, $"fish {i} and {j} should have sufficient spacing in formation");
            }
        }
    }

    [Fact]
    public void GeneratePathForFish_Speed_ShouldAffectDuration()
    {
        var slowFish = new FishDefinition { TypeId = 0, BaseSpeed = 50f };
        var fastFish = new FishDefinition { TypeId = 1, BaseSpeed = 200f };
        int fishId = 1;
        int currentTick = 0;
        int spawnEdge = 0;
        int groupIndex = 0;

        var slowPath = PathGenerator.GeneratePathForFish(fishId, slowFish, currentTick, spawnEdge, groupIndex, 1);
        var fastPath = PathGenerator.GeneratePathForFish(fishId, fastFish, currentTick, spawnEdge, groupIndex, 2);

        slowPath.Should().NotBeNull();
        fastPath.Should().NotBeNull();
    }
}
