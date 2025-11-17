import { LinearPath } from '../LinearPath';
import { SinePath } from '../SinePath';
import { BezierPath } from '../BezierPath';
import { CircularPath } from '../CircularPath';
import { PathComputer } from '../PathComputer';
import { PathData, PathType } from '../PathData';

/**
 * Determinism validation test
 * Verifies that same seed produces same positions across different path types
 */

const EPSILON = 0.01;

function assertPositionEquals(
  actual: [number, number],
  expected: [number, number],
  message: string,
) {
  const dx = Math.abs(actual[0] - expected[0]);
  const dy = Math.abs(actual[1] - expected[1]);

  if (dx > EPSILON || dy > EPSILON) {
    throw new Error(
      `${message}\nExpected: [${expected[0]}, ${expected[1]}]\nActual: [${actual[0]}, ${actual[1]}]\nDelta: [${dx}, ${dy}]`,
    );
  }
}

function testLinearPathDeterminism() {
  console.log('Testing LinearPath determinism...');

  const path1 = new LinearPath(1, 12345, 0, 100, [0, 0], [1000, 500]);
  const path2 = new LinearPath(1, 12345, 0, 100, [0, 0], [1000, 500]);

  const testPoints = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1.0];

  for (const t of testPoints) {
    const pos1 = path1.getPosition(t);
    const pos2 = path2.getPosition(t);
    assertPositionEquals(pos1, pos2, `LinearPath position mismatch at t=${t}`);
  }

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
    const pos = path1.getPosition(testPoints[i]);
    assertPositionEquals(
      pos,
      [knownPositions[i][0], knownPositions[i][1]],
      `LinearPath expected position mismatch at t=${testPoints[i]}`,
    );
  }

  console.log('✓ LinearPath determinism validated');
}

function testSinePathDeterminism() {
  console.log('Testing SinePath determinism...');

  const path1 = new SinePath(2, 54321, 0, 100, [0, 0], [1000, 0], 50, 2);
  const path2 = new SinePath(2, 54321, 0, 100, [0, 0], [1000, 0], 50, 2);

  const testPoints = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1.0];

  for (const t of testPoints) {
    const pos1 = path1.getPosition(t);
    const pos2 = path2.getPosition(t);
    assertPositionEquals(pos1, pos2, `SinePath position mismatch at t=${t}`);
  }

  const pos0 = path1.getPosition(0);
  assertPositionEquals(pos0, [0, 0], 'SinePath start position');

  const pos1 = path1.getPosition(1);
  assertPositionEquals(pos1, [1000, 0], 'SinePath end position');

  const posMid = path1.getPosition(0.5);
  if (Math.abs(posMid[0] - 500) > EPSILON) {
    throw new Error('SinePath midpoint X should be 500');
  }

  console.log('✓ SinePath determinism validated');
}

function testBezierPathDeterminism() {
  console.log('Testing BezierPath determinism...');

  const p0: [number, number] = [0, 0];
  const p1: [number, number] = [250, 500];
  const p2: [number, number] = [750, 500];
  const p3: [number, number] = [1000, 0];

  const path1 = new BezierPath(3, 99999, 0, 100, p0, p1, p2, p3);
  const path2 = new BezierPath(3, 99999, 0, 100, p0, p1, p2, p3);

  const testPoints = [0, 0.25, 0.5, 0.75, 1.0];

  for (const t of testPoints) {
    const pos1 = path1.getPosition(t);
    const pos2 = path2.getPosition(t);
    assertPositionEquals(pos1, pos2, `BezierPath position mismatch at t=${t}`);
  }

  const posStart = path1.getPosition(0);
  assertPositionEquals(posStart, p0, 'BezierPath start position should match P0');

  const posEnd = path1.getPosition(1);
  assertPositionEquals(posEnd, p3, 'BezierPath end position should match P3');

  const posMid = path1.getPosition(0.5);
  if (posMid[1] < 100) {
    throw new Error('BezierPath should have significant Y displacement at midpoint');
  }

  console.log('✓ BezierPath determinism validated');
}

function testCircularPathDeterminism() {
  console.log('Testing CircularPath determinism...');

  const center: [number, number] = [500, 300];
  const radiusX = 200;
  const radiusY = 150;
  const startAngle = 0;

  const path1 = new CircularPath(4, 11111, 0, 100, center, radiusX, radiusY, startAngle, false);
  const path2 = new CircularPath(4, 11111, 0, 100, center, radiusX, radiusY, startAngle, false);

  const testPoints = [0, 0.25, 0.5, 0.75, 1.0];

  for (const t of testPoints) {
    const pos1 = path1.getPosition(t);
    const pos2 = path2.getPosition(t);
    assertPositionEquals(pos1, pos2, `CircularPath position mismatch at t=${t}`);
  }

  const posStart = path1.getPosition(0);
  assertPositionEquals(posStart, [center[0] + radiusX, center[1]], 'CircularPath start position');

  const posQuarter = path1.getPosition(0.25);
  assertPositionEquals(
    posQuarter,
    [center[0], center[1] + radiusY],
    'CircularPath quarter position',
  );

  const posHalf = path1.getPosition(0.5);
  assertPositionEquals(posHalf, [center[0] - radiusX, center[1]], 'CircularPath half position');

  console.log('✓ CircularPath determinism validated');
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
