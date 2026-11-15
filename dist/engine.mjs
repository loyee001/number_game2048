export const SIZE = 4;

export function slide(grid, direction) {
  if (!['left', 'right', 'up', 'down'].includes(direction)) throw new Error('Invalid direction');
  const next = Array(16).fill(0);
  const merged = [];
  const destinations = {};
  let gain = 0;
  for (let line = 0; line < 4; line++) {
    const positions = Array.from({ length: 4 }, (_, offset) => {
      if (direction === 'left') return line * 4 + offset;
      if (direction === 'right') return line * 4 + 3 - offset;
      if (direction === 'up') return offset * 4 + line;
      return (3 - offset) * 4 + line;
    });
    const values = positions.filter(index => grid[index]).map(index => ({ value: grid[index], index }));
    let target = 0;
    for (let i = 0; i < values.length; i++) {
      const current = values[i];
      const destination = positions[target++];
      destinations[current.index] = destination;
      if (values[i + 1]?.value === current.value) {
        next[destination] = current.value * 2;
        gain += next[destination];
        destinations[values[++i].index] = destination;
        merged.push(destination);
      } else next[destination] = current.value;
    }
  }
  return { grid: next, gain, merged, destinations, moved: next.some((value, index) => value !== grid[index]) };
}

export function spawn(grid, random = Math.random) {
  const empty = grid.flatMap((value, index) => value === 0 ? [index] : []);
  if (!empty.length) return { grid: [...grid], index: -1 };
  const index = empty[Math.floor(random() * empty.length)];
  const next = [...grid];
  next[index] = random() < 0.9 ? 2 : 4;
  return { grid: next, index };
}

export function canMove(grid) {
  return grid.some((value, index) => value === 0 ||
    (index % 4 < 3 && value === grid[index + 1]) ||
    (index < 12 && value === grid[index + 4]));
}

export function newGame() {
  return { grid: spawn(spawn(Array(16).fill(0)).grid).grid, score: 0, moves: 0, continued: false };
}

export function isValidState(value) {
  return value && Array.isArray(value.grid) && value.grid.length === 16 &&
    value.grid.every(n => Number.isSafeInteger(n) && (n === 0 || (n >= 2 && n <= 2 ** 30 && Number.isInteger(Math.log2(n))))) &&
    value.grid.some(n => n > 0) && Number.isSafeInteger(value.score) && value.score >= 0 &&
    Number.isSafeInteger(value.moves) && value.moves >= 0 && typeof value.continued === 'boolean';
}
