import { slide, spawn, canMove, newGame, isValidState } from './engine.mjs';

const $ = id => document.getElementById(id);
const storageKey = 'number-garden-2048-v1';
let state = newGame();
let best = 0;
let previous = null;
let busy = false;
let queued = null;
let touchStart = null;
let storageWorks = true;
let timer;
try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  if (Number.isSafeInteger(saved?.best) && saved.best >= 0) best = saved.best;
  if (isValidState(saved?.state)) {
    state = saved.state;
    previous = isValidState(saved.previous) ? saved.previous : null;
    best = Math.max(best, state.score);
  }
} catch { /* An unavailable or damaged save never blocks play. */ }

function save() {
  try { localStorage.setItem(storageKey, JSON.stringify({ state, best, previous })); }
  catch { storageWorks = false; }
  $('save-status').textContent = storageWorks ? '· 进度自动保存在本机' : '本次进度暂时无法保存';
}

function render({ spawned = -1, merged = [] } = {}) {
  $('tiles').replaceChildren();
  state.grid.forEach((value, index) => {
    if (!value) return;
    const tile = document.createElement('div');
    tile.className = `tile${value > 2048 ? ' large' : ''}${index === spawned ? ' new' : ''}${merged.includes(index) ? ' merged' : ''}`;
    tile.dataset.index = index;
    tile.dataset.value = value;
    tile.style.setProperty('--row', Math.floor(index / 4));
    tile.style.setProperty('--col', index % 4);
    tile.textContent = value;
    tile.setAttribute('aria-label', `第 ${Math.floor(index / 4) + 1} 行第 ${index % 4 + 1} 列：${value}`);
    $('tiles').append(tile);
  });
  $('score').textContent = state.score;
  $('best').textContent = best;
  $('moves').textContent = `第 ${state.moves} 步`;
  $('undo').disabled = !previous;
  const max = Math.max(...state.grid);
  $('game-caption').textContent = max >= 2048 ? '继续生长，突破自己' : max >= 128 ? '离目标，又近了一点' : state.moves ? '每一步，都在生长' : '新的一局，新的可能';
  const won = max >= 2048 && !state.continued;
  const lost = !canMove(state.grid);
  const wasOpen = !$('overlay').hidden;
  $('overlay').hidden = !(won || lost);
  $('board').inert = won || lost;
  if (won || lost) {
    $('overlay-icon').textContent = won ? '✦' : '❋';
    $('overlay-title').textContent = won ? '2048，达成！' : '这一局，很精彩';
    $('overlay-copy').textContent = won ? '小小的数字，也能长成大大的惊喜。' : `获得 ${state.score} 分。歇一下，再试一次吧。`;
    $('continue').hidden = !won;
    $('overlay-undo').hidden = won || !previous;
    if (!wasOpen) (won ? $('continue') : previous ? $('overlay-undo') : $('overlay-new')).focus({ preventScroll: true });
  } else if (wasOpen) $('board').focus({ preventScroll: true });
  save();
}

function move(direction) {
  if (!$('overlay').hidden) return;
  if (busy) { queued = direction; return; }
  const result = slide(state.grid, direction);
  if (!result.moved) return;
  previous = structuredClone(state);
  busy = true;
  for (const tile of $('tiles').children) {
    const index = result.destinations[tile.dataset.index];
    tile.style.setProperty('--row', Math.floor(index / 4));
    tile.style.setProperty('--col', index % 4);
  }
  const added = spawn(result.grid);
  state = { ...state, grid: added.grid, score: state.score + result.gain, moves: state.moves + 1 };
  best = Math.max(best, state.score);
  save();
  timer = setTimeout(() => {
    busy = false;
    render({ spawned: added.index, merged: result.merged });
    if (result.gain) {
      $('score-gain').classList.remove('animate');
      $('score-gain').textContent = `+${result.gain}`;
      void $('score-gain').offsetWidth;
      $('score-gain').classList.add('animate');
    }
    $('announcement').textContent = `第 ${state.moves} 步，得分 ${state.score}，最大方块 ${Math.max(...state.grid)}`;
    const next = queued;
    queued = null;
    if (next) move(next);
  }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 135);
}

function cancelAnimation() { clearTimeout(timer); busy = false; queued = null; }
function restart() {
  cancelAnimation();
  state = newGame();
  previous = null;
  render();
  $('announcement').textContent = '新的一局开始了。';
  $('board').focus({ preventScroll: true });
}
function undo() {
  if (!previous) return;
  cancelAnimation();
  state = previous;
  previous = null;
  render();
  $('announcement').textContent = '已撤销上一步。';
}
$('restart').addEventListener('click', restart);
$('overlay-new').addEventListener('click', restart);
$('undo').addEventListener('click', undo);
$('overlay-undo').addEventListener('click', undo);
$('continue').addEventListener('click', () => { state.continued = true; render(); });
document.querySelectorAll('[data-direction]').forEach(button => button.addEventListener('click', () => move(button.dataset.direction)));
document.addEventListener('keydown', event => {
  if (!$('overlay').hidden && event.key === 'Tab') {
    const buttons = [...$('overlay').querySelectorAll('button')].filter(button => !button.hidden);
    const first = buttons[0], last = buttons.at(-1);
    if (event.shiftKey && (document.activeElement === first || !buttons.includes(document.activeElement))) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || !buttons.includes(document.activeElement))) { event.preventDefault(); first.focus(); }
    return;
  }
  if (event.altKey || event.ctrlKey || event.metaKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable) return;
  const direction = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down' }[event.key];
  if (direction) { event.preventDefault(); move(direction); }
});
$('board').addEventListener('pointerdown', event => {
  if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
  touchStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
  $('board').setPointerCapture(event.pointerId);
});
$('board').addEventListener('pointerup', event => {
  if (!touchStart || event.pointerId !== touchStart.id) return;
  const dx = event.clientX - touchStart.x, dy = event.clientY - touchStart.y;
  touchStart = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
  move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
});
$('board').addEventListener('pointercancel', () => { touchStart = null; });
render();
