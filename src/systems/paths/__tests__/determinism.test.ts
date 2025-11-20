import { PathComputer } from '../PathComputer';
import { PathData, PathType } from '../PathData';

/**
 * Determinism validation test
 * Verifies that PathComputer with Phaser.Curves produces deterministic positions
 */

const EPSILON = 0.01;

function assertPositionEquals(
  actual: [number, number] | null,
  expected: [number, number],
  message: string,
) {
  if (!actual) {
    throw new Error(`${message}\nActual position is null`);
  }

  const dx = Math.abs(actual[0] - expected[0]);
  const dy = Math.abs(actual[1] - expected[1]);

  if (dx > EPSILON || dy > EPSILON) {
    throw new Error(
      `${message}\nExpected: [${expected[0]}, ${expected[1]}]\nActual: [${actual[0]}, ${actual[1]}]\nDelta: [${dx}, ${dy}]`,
    );
  }
}

function testLinearPathDeterminism() {
  console.log('Testing Linear path determinism with PathComputer...');

  const pathData: PathData = {
    fishId: 1,
    pathType: PathType.Linear,
    seed: 12345,
    startTick: 0,
    speed: 100,
    controlPoints: [[0, 0], [1000, 500]],
    duration: 10,
    loop: false,
    variance: 1.0,
  };

  const testPoints = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1.0];

  // Test consistency - same input should produce same output
  for (const t of testPoints) {
    const pos1 = PathComputer.evaluatePathAtTime(pathData, t);
    const pos2 = PathComputer.evaluatePathAtTime(pathData, t);
    
    if (pos1 && pos2) {
      assertPositionEquals(pos1, pos2, `Linear path position mismatch at t=${t}`);
    }
  }

  // Test known positions
  const knownPositions = [
    [0, 0],
    [100, 50],
    [250, 125],
    [500, 250],
    [750, 375],
    [900, 450],
    [1000, 500],
  ];

  for (let i = 0; i < testPoints.length; i++) {
    const pos = PathComputer.evaluatePathAtTime(pathData, testPoints[i]);
    assertPositionEquals(
      pos,
      [knownPositions[i][0], knownPositions[i][1]],
      `Linear path expected position mismatch at t=${testPoints[i]}`,
    );
  }

  console.log('✓ Linear path determinism validated');
}

function testSinePathDeterminism() {
  console.log('Testing Sine path determinism with PathComputer...');

  const pathData: PathData = {
    fishId: 2,
    pathType: PathType.Sine,
    seed: 54321,
    startTick: 0,
    speed: 100,
    controlPoints: [[0, 0], [1000, 0], [50, 2]], // start, end, [amplitude, frequency]
    duration: 10,
    loop: false,
    variance: 1.0,
  };

  const testPoints = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1.0];

  // Test consistency
  for (const t of testPoints) {
    const pos1 = PathComputer.evaluatePathAtTime(pathData, t);
    const pos2 = PathComputer.evaluatePathAtTime(pathData, t);
    
    if (pos1 && pos2) {
      assertPositionEquals(pos1, pos2, `Sine path position mismatch at t=${t}`);
    }
  }

  // Test start and end positions
  const pos0 = PathComputer.evaluatePathAtTime(pathData, 0);
  assertPositionEquals(pos0, [0, 0], 'Sine path start position');

  const pos1 = PathComputer.evaluatePathAtTime(pathData, 1);
  assertPositionEquals(pos1, [1000, 0], 'Sine path end position');

  const posMid = PathComputer.evaluatePathAtTime(pathData, 0.5);
  if (posMid && Math.abs(posMid[0] - 500) > EPSILON) {
    throw new Error('Sine path midpoint X should be 500');
  }

  console.log('✓ Sine path determinism validated');
}

function testBezierPathDeterminism() {
  console.log('Testing Bezier path determinism with PathComputer...');

  const p0: [number, number] = [0, 0];
  const p1: [number, number] = [250, 500];
  const p2: [number, number] = [750, 500];
  const p3: [number, number] = [1000, 0];

  const pathData: PathData = {
    fishId: 3,
    pathType: PathType.Bezier,
    seed: 99999,
    startTick: 0,
    speed: 100,
    controlPoints: [p0, p1, p2, p3],
    duration: 10,
    loop: false,
    variance: 1.0,
  };

  const testPoints = [0, 0.25, 0.5, 0.75, 1.0];

  // Test consistency
  for (const t of testPoints) {
    const pos1 = PathComputer.evaluatePathAtTime(pathData, t);
    const pos2 = PathComputer.evaluatePathAtTime(pathData, t);
    
    if (pos1 && pos2) {
      assertPositionEquals(pos1, pos2, `Bezier path position mismatch at t=${t}`);
    }
  }

  // Test start and end positions
  const posStart = PathComputer.evaluatePathAtTime(pathData, 0);
  assertPositionEquals(posStart, p0, 'Bezier path start position should match P0');

  const posEnd = PathComputer.evaluatePathAtTime(pathData, 1);
  assertPositionEquals(posEnd, p3, 'Bezier path end position should match P3');

  const posMid = PathComputer.evaluatePathAtTime(pathData, 0.5);
  if (posMid && posMid[1] < 100) {
    throw new Error('Bezier path should have significant Y displacement at midpoint');
  }

  console.log('✓ Bezier path determinism validated');
}

function testCircularPathDeterminism() {
  console.log('Testing Circular path determinism with PathComputer...');

  const center: [number, number] = [500, 300];
  const radiusX = 200;
  const radiusY = 150;
  const startAngle = 0;

  const pathData: PathData = {
    fishId: 4,
    pathType: PathType.Circular,
    seed: 11111,
    startTick: 0,
    speed: 100,
    controlPoints: [center, [radiusX, radiusY], [startAngle, 0]], // clockwise=false
    duration: 10,
    loop: true,
    variance: 1.0,
  };

  const testPoints = [0, 0.25, 0.5, 0.75, 1.0];

  // Test consistency
  for (const t of testPoints) {
    const pos1 = PathComputer.evaluatePathAtTime(pathData, t);
    const pos2 = PathComputer.evaluatePathAtTime(pathData, t);
    
    if (pos1 && pos2) {
      assertPositionEquals(pos1, pos2, `Circular path position mismatch at t=${t}`);
    }
  }

  // Test known positions
  const posStart = PathComputer.evaluatePathAtTime(pathData, 0);
  assertPositionEquals(posStart, [center[0] + radiusX, center[1]], 'Circular path start position');

  const posQuarter = PathComputer.evaluatePathAtTime(pathData, 0.25);
  assertPositionEquals(
    posQuarter,
    [center[0], center[1] + radiusY],
    'Circular path quarter position',
  );

  const posHalf = PathComputer.evaluatePathAtTime(pathData, 0.5);
  assertPositionEquals(posHalf, [center[0] - radiusX, center[1]], 'Circular path half position');

  console.log('✓ Circular path determinism validated');
}

function testPathComputerIntegration() {
  console.log('Testing PathComputer integration...');

  const linearPathData: PathData = {
    fishId: 100,
    pathType: PathType.Linear,
    seed: 42,
    startTick: 100,
    speed: 100,
    controlPoints: [
      [0, 0],
      [1000, 500],
    ],
    duration: 10,
    loop: false,
    variance: 1.0,
  };

  const pos1 = PathComputer.evaluatePathAtTime(linearPathData, 0.5);
  if (!pos1) {
    throw new Error('PathComputer failed to compute position');
  }
  assertPositionEquals(pos1, [500, 250], 'PathComputer linear path midpoint');

  const pos2 = PathComputer.computePosition(linearPathData, 200);
  if (!pos2) {
    throw new Error('PathComputer failed to compute position from tick');
  }
  assertPositionEquals(pos2, [500, 250], 'PathComputer tick-based position');

  console.log('✓ PathComputer integration validated');
}

export function runDeterminismTests() {
  console.log('=== Running Determinism Validation Tests ===\n');

  try {
    testLinearPathDeterminism();
    testSinePathDeterminism();
    testBezierPathDeterminism();
    testCircularPathDeterminism();
    testPathComputerIntegration();

    console.log('\n=== All Tests Passed ✓ ===');
    return true;
  } catch (error) {
    console.error('\n=== Test Failed ✗ ===');
    console.error(error);
    return false;
  }
}

if (typeof window === 'undefined') {
  runDeterminismTests();
}
