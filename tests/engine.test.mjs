import test from 'node:test';
import assert from 'node:assert/strict';
import { slide, spawn, canMove, isValidState, newGame } from '../dist/engine.mjs';
const row = values => [...values, ...Array(12).fill(0)];
test('each tile merges once per turn', () => {
  const result = slide(row([2, 2, 2, 2]), 'left');
  assert.deepEqual(result.grid, row([4, 4, 0, 0]));
  assert.equal(result.gain, 8);
  assert.deepEqual(slide(row([2, 2, 4, 0]), 'left').grid, row([4, 4, 0, 0]));
});
test('compression and direction determine merge order', () => {
  assert.deepEqual(slide(row([4, 0, 4, 4]), 'left').grid, row([8, 4, 0, 0]));
  assert.deepEqual(slide(row([4, 0, 4, 4]), 'right').grid, row([0, 0, 4, 8]));
  const vertical = Array(16).fill(0); [4, 0, 4, 4].forEach((v, i) => vertical[i * 4] = v);
  assert.deepEqual(slide(vertical, 'up').grid.filter((_, i) => i % 4 === 0), [8, 4, 0, 0]);
  assert.deepEqual(slide(vertical, 'down').grid.filter((_, i) => i % 4 === 0), [0, 0, 4, 8]);
});
test('an invalid move changes nothing', () => {
  const result = slide(row([2, 4, 8, 16]), 'left');
  assert.equal(result.moved, false); assert.equal(result.gain, 0);
});
test('spawn adds exactly one tile in an empty cell, with a 90/10 split', () => {
  const grid = row([2, 4, 8, 16]);
  assert.equal(spawn(grid, () => 0).grid[4], 2);
  assert.equal(spawn(grid, () => .95).grid[15], 4);
  assert.equal(spawn(grid).grid.filter(Boolean).length, 5);
  assert.deepEqual(spawn(Array(16).fill(2)).grid, Array(16).fill(2));
  assert.equal(newGame().grid.filter(Boolean).length, 2);
});
test('only a full board without adjacent equals loses', () => {
  const grid = [2,4,2,4,4,2,4,2,2,4,2,4,4,2,4,2];
  assert.equal(canMove(grid), false);
  assert.equal(canMove(grid.with(0, 0)), true);
  assert.equal(canMove(grid.with(0, 4)), true);
  assert.equal(canMove(grid.with(4, 2)), true);
});
test('2048 can be reached and play can continue beyond it', () => {
  const result = slide(row([1024, 1024, 0, 0]), 'left');
  assert.equal(result.grid[0], 2048); assert.equal(result.gain, 2048);
  assert.equal(slide(row([2048, 2048, 0, 0]), 'left').grid[0], 4096);
});
test('save validation rejects malformed states', () => {
  const valid = newGame(); assert.ok(isValidState(valid));
  for (const bad of [null, {}, { ...valid, score: -1 }, { ...valid, grid: [] }, { ...valid, grid: Array(16).fill(3) }, { ...valid, grid: Array(16).fill(0) }, { ...valid, moves: NaN }, { ...valid, continued: 'yes' }]) assert.ok(!isValidState(bad));
});
test('randomized moves preserve tile sum and map all source tiles', () => {
  let seed = 2048;
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  for (let n = 0; n < 200; n++) {
    const grid = Array.from({ length: 16 }, () => random() < .3 ? 0 : 2 ** (1 + Math.floor(random() * 6)));
    for (const direction of ['left', 'right', 'up', 'down']) {
      const result = slide(grid, direction);
      assert.equal(result.grid.reduce((a, b) => a + b), grid.reduce((a, b) => a + b));
      assert.equal(Object.keys(result.destinations).length, grid.filter(Boolean).length);
      for (const destination of Object.values(result.destinations)) assert.ok(result.grid[destination] > 0);
    }
  }
});
