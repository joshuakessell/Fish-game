export function getPlayerBankPosition(playerSlot: number): { x: number; y: number } {
  const positions = [
    { x: 0.12 * 1800, y: 870 },
    { x: 0.5 * 1800, y: 870 },
    { x: 0.88 * 1800, y: 870 },
    { x: 0.12 * 1800, y: 30 },
    { x: 0.5 * 1800, y: 30 },
    { x: 0.88 * 1800, y: 30 },
  ];

  if (playerSlot >= 0 && playerSlot < positions.length) {
    return positions[playerSlot];
  }

  console.warn(`Invalid player slot ${playerSlot}, returning default position`);
  return { x: 900, y: 450 };
}
