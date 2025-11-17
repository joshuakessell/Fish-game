import { deserializePathData, PathDataTuple, PathData, PathType } from '../PathData';

/**
 * Unit tests for PathData deserialization
 * Ensures MessagePack tuple format correctly converts to PathData objects
 * Catches protocol drift between C# backend and TypeScript frontend
 */

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
  }
}

function assertNotNull<T>(value: T | null, message: string): asserts value is T {
  if (value === null) {
    throw new Error(`${message}\nExpected non-null value but got null`);
  }
}

function assertNull<T>(value: T | null, message: string) {
  if (value !== null) {
    throw new Error(`${message}\nExpected null but got: ${value}`);
  }
}

function assertArrayEquals(actual: number[][], expected: number[][], message: string) {
  if (actual.length !== expected.length) {
    throw new Error(
      `${message}\nArray length mismatch - Expected: ${expected.length}, Actual: ${actual.length}`,
    );
  }

  for (let i = 0; i < actual.length; i++) {
    if (actual[i].length !== expected[i].length) {
      throw new Error(
        `${message}\nSubarray ${i} length mismatch - Expected: ${expected[i].length}, Actual: ${actual[i].length}`,
      );
    }
    for (let j = 0; j < actual[i].length; j++) {
      if (actual[i][j] !== expected[i][j]) {
        throw new Error(
          `${message}\nValue mismatch at [${i}][${j}] - Expected: ${expected[i][j]}, Actual: ${actual[i][j]}`,
        );
      }
    }
  }
}

function testLinearPathDeserialization() {
  console.log('Testing Linear path deserialization...');

  const tuple: PathDataTuple = [
    123456789, // fishId
    'Linear', // pathType
    42, // seed
    1000, // startTick
    150, // speed
    [
      [100, 200],
      [900, 700],
    ], // controlPoints
    8.5, // duration
    true, // loop
  ];

  const result = deserializePathData(tuple);

  assertNotNull(result, 'deserializePathData should return non-null for valid Linear path');
  assertEqual(result.fishId, 123456789, 'fishId should match');
  assertEqual(result.pathType, PathType.Linear, 'pathType should be Linear');
  assertEqual(result.seed, 42, 'seed should match');
  assertEqual(result.startTick, 1000, 'startTick should match');
  assertEqual(result.speed, 150, 'speed should match');
  assertArrayEquals(
    result.controlPoints,
    [
      [100, 200],
      [900, 700],
    ],
    'controlPoints should match',
  );
  assertEqual(result.duration, 8.5, 'duration should match');
  assertEqual(result.loop, true, 'loop should match');

  console.log('✓ Linear path deserialization validated');
}

function testSinePathDeserialization() {
  console.log('Testing Sine path deserialization...');

  const tuple: PathDataTuple = [
    987654321, // fishId
    'Sine', // pathType
    12345, // seed
    500, // startTick
    200, // speed
    [
      [0, 450],
      [1800, 450],
      [50, 2],
    ], // controlPoints (start, end, amplitude/frequency)
    10.0, // duration
    true, // loop
  ];

  const result = deserializePathData(tuple);

  assertNotNull(result, 'deserializePathData should return non-null for valid Sine path');
  assertEqual(result.fishId, 987654321, 'fishId should match');
  assertEqual(result.pathType, PathType.Sine, 'pathType should be Sine');
  assertEqual(result.seed, 12345, 'seed should match');
  assertEqual(result.startTick, 500, 'startTick should match');
  assertEqual(result.speed, 200, 'speed should match');
  assertArrayEquals(
    result.controlPoints,
    [
      [0, 450],
      [1800, 450],
      [50, 2],
    ],
    'controlPoints should match',
  );
  assertEqual(result.duration, 10.0, 'duration should match');
  assertEqual(result.loop, true, 'loop should match');

  console.log('✓ Sine path deserialization validated');
}

function testBezierPathDeserialization() {
  console.log('Testing Bezier path deserialization...');

  const tuple: PathDataTuple = [
    555555555, // fishId
    'Bezier', // pathType
    99999, // seed
    2000, // startTick
    120, // speed
    [
      [0, 0],
      [300, 600],
      [1500, 600],
      [1800, 0],
    ], // controlPoints (P0, P1, P2, P3)
    15.0, // duration
    false, // loop
  ];

  const result = deserializePathData(tuple);

  assertNotNull(result, 'deserializePathData should return non-null for valid Bezier path');
  assertEqual(result.fishId, 555555555, 'fishId should match');
  assertEqual(result.pathType, PathType.Bezier, 'pathType should be Bezier');
  assertEqual(result.seed, 99999, 'seed should match');
  assertEqual(result.startTick, 2000, 'startTick should match');
  assertEqual(result.speed, 120, 'speed should match');
  assertArrayEquals(
    result.controlPoints,
    [
      [0, 0],
      [300, 600],
      [1500, 600],
      [1800, 0],
    ],
    'controlPoints should match',
  );
  assertEqual(result.duration, 15.0, 'duration should match');
  assertEqual(result.loop, false, 'loop should match');

  console.log('✓ Bezier path deserialization validated');
}

function testCircularPathDeserialization() {
  console.log('Testing Circular path deserialization...');

  const tuple: PathDataTuple = [
    777777777, // fishId
    'Circular', // pathType
    54321, // seed
    1500, // startTick
    180, // speed
    [
      [900, 450],
      [400, 300],
      [0, 1],
    ], // controlPoints (center, radii, startAngle/clockwise)
    12.0, // duration
    true, // loop
  ];

  const result = deserializePathData(tuple);

  assertNotNull(result, 'deserializePathData should return non-null for valid Circular path');
  assertEqual(result.fishId, 777777777, 'fishId should match');
  assertEqual(result.pathType, PathType.Circular, 'pathType should be Circular');
  assertEqual(result.seed, 54321, 'seed should match');
  assertEqual(result.startTick, 1500, 'startTick should match');
  assertEqual(result.speed, 180, 'speed should match');
  assertArrayEquals(
    result.controlPoints,
    [
      [900, 450],
      [400, 300],
      [0, 1],
    ],
    'controlPoints should match',
  );
  assertEqual(result.duration, 12.0, 'duration should match');
  assertEqual(result.loop, true, 'loop should match');

  console.log('✓ Circular path deserialization validated');
}

function testNullInput() {
  console.log('Testing null input handling...');

  const result = deserializePathData(null);
  assertNull(result, 'deserializePathData should return null for null input');

  console.log('✓ Null input handling validated');
}

function testInvalidArrayLength() {
  console.log('Testing invalid array length handling...');

  // Array too short
  const shortTuple = [123, 'Linear', 42, 1000, 150, [[0, 0]]] as any;
  const result = deserializePathData(shortTuple);
  assertNull(result, 'deserializePathData should return null for array with < 8 elements');

  console.log('✓ Invalid array length handling validated');
}

function testUnknownPathType() {
  console.log('Testing unknown path type handling...');

  const tuple: PathDataTuple = [
    123456789,
    'UnknownPathType' as any, // Invalid path type
    42,
    1000,
    150,
    [
      [100, 200],
      [900, 700],
    ],
    8.5,
    true,
  ];

  const result = deserializePathData(tuple);
  assertNull(result, 'deserializePathData should return null for unknown path type');

  console.log('✓ Unknown path type handling validated');
}

function testMultiSegmentPathDeserialization() {
  console.log('Testing MultiSegment path deserialization...');

  const tuple: PathDataTuple = [
    111222333, // fishId
    'MultiSegment', // pathType
    67890, // seed
    3000, // startTick
    140, // speed
    [
      [0, 100],
      [500, 400],
      [1200, 300],
      [1800, 800],
    ], // controlPoints (multiple segments)
    20.0, // duration
    false, // loop
  ];

  const result = deserializePathData(tuple);

  assertNotNull(result, 'deserializePathData should return non-null for valid MultiSegment path');
  assertEqual(result.fishId, 111222333, 'fishId should match');
  assertEqual(result.pathType, PathType.MultiSegment, 'pathType should be MultiSegment');
  assertEqual(result.seed, 67890, 'seed should match');
  assertEqual(result.startTick, 3000, 'startTick should match');
  assertEqual(result.speed, 140, 'speed should match');
  assertArrayEquals(
    result.controlPoints,
    [
      [0, 100],
      [500, 400],
      [1200, 300],
      [1800, 800],
    ],
    'controlPoints should match',
  );
  assertEqual(result.duration, 20.0, 'duration should match');
  assertEqual(result.loop, false, 'loop should match');

  console.log('✓ MultiSegment path deserialization validated');
}

function testAllPathTypes() {
  console.log('Testing all PathType enum values are supported...');

  const pathTypeNames = ['Linear', 'Sine', 'Bezier', 'Circular', 'MultiSegment'];
  const expectedTypes = [
    PathType.Linear,
    PathType.Sine,
    PathType.Bezier,
    PathType.Circular,
    PathType.MultiSegment,
  ];

  for (let i = 0; i < pathTypeNames.length; i++) {
    const tuple: PathDataTuple = [
      i,
      pathTypeNames[i] as any,
      42,
      1000,
      150,
      [
        [0, 0],
        [100, 100],
      ],
      5.0,
      true,
    ];

    const result = deserializePathData(tuple);
    assertNotNull(result, `deserializePathData should handle ${pathTypeNames[i]}`);
    assertEqual(
      result.pathType,
      expectedTypes[i],
      `PathType should map correctly for ${pathTypeNames[i]}`,
    );
  }

  console.log('✓ All PathType enum values validated');
}

export function runDeserializationTests() {
  console.log('=== Running PathData Deserialization Tests ===\n');

  try {
    testLinearPathDeserialization();
    testSinePathDeserialization();
    testBezierPathDeserialization();
    testCircularPathDeserialization();
    testMultiSegmentPathDeserialization();
    testNullInput();
    testInvalidArrayLength();
    testUnknownPathType();
    testAllPathTypes();

    console.log('\n=== All Deserialization Tests Passed ✓ ===');
    return true;
  } catch (error) {
    console.error('\n=== Deserialization Test Failed ✗ ===');
    console.error(error);
    return false;
  }
}

// Run tests if executed directly (not in browser)
if (typeof window === 'undefined') {
  runDeserializationTests();
}
