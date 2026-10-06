const entries = [
  { number: 1, direction: 'down', row: 6, col: 1, answer: 'FAIRY', clue: 'A single drop of this green liquid cuts through impossible grease for sparkling dishes.' },
  { number: 2, direction: 'across', row: 18, col: 7, answer: 'ARIEL', clue: 'Achieve brilliant cleaning results and exceptional stain removal, even in a cold wash.' },
  { number: 3, direction: 'down', row: 3, col: 13, answer: 'HEADANDSHOULDERS', clue: 'Wear black with confidence: promises a 100% flake-free scalp and itch relief.' },
  { number: 4, direction: 'down', row: 4, col: 11, answer: 'PANTENE', clue: 'Transforms dull, damaged hair into strong, healthy-looking locks with its Pro-V boost.' },
  { number: 5, direction: 'down', row: 2, col: 7, answer: 'BRAUN', clue: 'German precision technology for efficient grooming and smooth results.' },
  { number: 6, direction: 'down', row: 0, col: 4, answer: 'OLDSPICE', clue: 'The scent of legendary confidence that blocks body odor all day long.' },
  { number: 7, direction: 'across', row: 7, col: 0, answer: 'PAMPERS', clue: 'The secret to a full night’s sleep for parent and baby alike through superior dryness.' },
  { number: 8, direction: 'down', row: 3, col: 9, answer: 'TAMPAX', clue: 'Freedom to move and stay active during your cycle with leak-free confidence.' },
  { number: 9, direction: 'across', row: 3, col: 4, answer: 'SECRET', clue: 'Clinical-strength wetness and odor protection designed specifically for her confidence.' },
  { number: 10, direction: 'down', row: 9, col: 6, answer: 'CLEARBLUE', clue: 'Delivers unrivaled clarity and accuracy when you need to know for sure if you are expecting.' },
  { number: 11, direction: 'down', row: 11, col: 10, answer: 'GILLETTE', clue: 'Precision engineering for the smoothest, closest shave a man can get.' },
  { number: 12, direction: 'down', row: 14, col: 8, answer: 'LENOR', clue: 'Adds a touch of luxurious softness and long-lasting freshness to your laundry load.' },
  { number: 13, direction: 'across', row: 7, col: 9, answer: 'ASTRA', clue: 'Classic double-edge blades delivering a sharp, traditional shave.' },
  { number: 14, direction: 'across', row: 12, col: 6, answer: 'AUSSIE', clue: 'Get that “miracle” bounce, intense hydration, and amazing scent for thirsty hair, mate!' },
  { number: 15, direction: 'across', row: 16, col: 10, answer: 'TIDE', clue: 'Your go-to for keeping whites brilliant and colors vibrant, even against tough stains.' },
];

const rowCount = 19;
const colCount = 14;
const board = document.querySelector('#board');
const status = document.querySelector('#status');
const cells = new Map();
const letters = new Map();
let activeEntry = entries[0];
let activeIndex = 0;
let finished = false;

function keyFor(row, col) { return row + ',' + col; }

function position(entry, index) {
  return entry.direction === 'across'
    ? { row: entry.row, col: entry.col + index }
    : { row: entry.row + index, col: entry.col };
}

function entriesAt(row, col) {
  return entries.filter(entry => {
    const index = entry.direction === 'across' ? col - entry.col : row - entry.row;
    return index >= 0 && index < entry.answer.length &&
      keyFor(position(entry, index).row, position(entry, index).col) === keyFor(row, col);
  });
}

function clearIncorrect() {
  document.querySelectorAll('.cell-wrap').forEach(wrapper => wrapper.classList.remove('incorrect'));
}

function buildPuzzle() {
  board.style.gridTemplateColumns = 'repeat(' + colCount + ', minmax(0, 1fr))';
  board.setAttribute('aria-rowcount', rowCount);
  board.setAttribute('aria-colcount', colCount);
  const cellInfo = new Map();
  for (const entry of entries) {
    for (let index = 0; index < entry.answer.length; index += 1) {
      const { row, col } = position(entry, index);
      const key = keyFor(row, col);
      const info = cellInfo.get(key) || { row, col, entries: [] };
      info.entries.push(entry);
      cellInfo.set(key, info);
    }
  }

  for (let row = 0; row < rowCount; row += 1) {
    for (let col = 0; col < colCount; col += 1) {
      const key = keyFor(row, col);
      const info = cellInfo.get(key);
      if (!info) {
        const block = document.createElement('span');
        block.className = 'block';
        block.setAttribute('aria-hidden', 'true');
        board.append(block);
        continue;
      }
      const wrapper = document.createElement('div');
      wrapper.className = 'cell-wrap';
      const start = entries.find(entry => entry.row === row && entry.col === col);
      if (start) {
        const number = document.createElement('span');
        number.className = 'cell-number';
        number.textContent = start.number;
        wrapper.append(number);
      }
      const cell = document.createElement('input');
      cell.className = 'cell';
      cell.type = 'text';
      cell.maxLength = 1;
      cell.autocomplete = 'off';
      cell.autocapitalize = 'characters';
      cell.spellcheck = false;
      cell.inputMode = 'text';
      cell.tabIndex = -1;
      cell.dataset.row = row;
      cell.dataset.col = col;
      cell.setAttribute('aria-label', 'Row ' + (row + 1) + ', column ' + (col + 1) + ': ' +
        info.entries.map(entry => entry.direction + ' ' + entry.number).join(', '));
      cell.addEventListener('focus', () => selectCell(info, false));
      cell.addEventListener('input', handleCellInput);
      cell.addEventListener('keydown', handleCellKey);
      wrapper.append(cell);
      board.append(wrapper);
      cells.set(key, cell);
      letters.set(key, '');
    }
  }
  selectEntry(entries[0], 0, false);
}

function selectEntry(entry, index = 0, focus = true) {
  activeEntry = entry;
  activeIndex = Math.max(0, Math.min(index, entry.answer.length - 1));
  document.querySelector('#clue-label').textContent = entry.number + ' ' + entry.direction.toUpperCase();
  document.querySelector('#clue-count').textContent = 'CLUE ' + (entries.indexOf(entry) + 1) + ' OF ' + entries.length;
  document.querySelector('#current-clue').textContent = entry.clue;
  document.querySelector('#answer-length').textContent = entry.answer.length + ' LETTERS';
  paintSelection();
  syncWordInput(true);
  if (focus) focusActiveCell();
}

function selectCell(info, focus = true) {
  const matching = info.entries.find(entry => entry.direction === activeEntry.direction) || info.entries[0];
  const index = matching.direction === 'across' ? info.col - matching.col : info.row - matching.row;
  selectEntry(matching, index, false);
  if (focus) focusActiveCell();
}

function paintSelection() {
  document.querySelectorAll('.cell-wrap').forEach(wrapper => wrapper.classList.remove('selected-entry'));
  for (let index = 0; index < activeEntry.answer.length; index += 1) {
    const { row, col } = position(activeEntry, index);
    const cell = cells.get(keyFor(row, col));
    if (cell) cell.parentElement.classList.add('selected-entry');
  }
  const { row, col } = position(activeEntry, activeIndex);
  const current = cells.get(keyFor(row, col));
  document.querySelectorAll('.cell').forEach(cell => { cell.tabIndex = cell === current ? 0 : -1; });
}

function focusActiveCell() {
  if ((document.querySelector('.grid-details') && !document.querySelector('.grid-details').open) || (typeof matchMedia === 'function' && matchMedia('(max-width: 900px)').matches)) {
    const input = document.querySelector('#word-input');
    input.focus({ preventScroll: true });
    input.select();
    return;
  }
  const { row, col } = position(activeEntry, activeIndex);
  const cell = cells.get(keyFor(row, col));
  if (cell) cell.focus();
}

function setLetter(value) {
  if (finished) return;
  const letter = value.toUpperCase().replace(/[^A-Z]/g, '').slice(-1);
  if (!letter) return;
  const { row, col } = position(activeEntry, activeIndex);
  const key = keyFor(row, col);
  letters.set(key, letter);
  const cell = cells.get(key);
  cell.value = letter;
  clearIncorrect();
  cell.parentElement.classList.remove('correct');
  if (activeIndex < activeEntry.answer.length - 1) activeIndex += 1;
  paintSelection();
  focusActiveCell();
  status.textContent = 'Keep going — every crossing is a clue.';
  status.className = 'status';
  syncWordInput(true);
  saveProgress();
}

function clearLetter(moveBack = false) {
  if (finished) return;
  let { row, col } = position(activeEntry, activeIndex);
  let key = keyFor(row, col);
  if (!letters.get(key) && moveBack && activeIndex > 0) {
    activeIndex -= 1;
    ({ row, col } = position(activeEntry, activeIndex));
    key = keyFor(row, col);
  }
  letters.set(key, '');
  cells.get(key).value = '';
  clearIncorrect();
  cells.get(key).parentElement.classList.remove('correct');
  paintSelection();
  focusActiveCell();
  syncWordInput(true);
  saveProgress();
}

function handleCellInput(event) {
  const value = event.currentTarget.value.toUpperCase().replace(/[^A-Z]/g, '').slice(-1);
  event.currentTarget.value = value;
  if (value) setLetter(value);
  else clearLetter();
}

function handleCellKey(event) {
  if (/^[a-zA-Z]$/.test(event.key)) {
    event.preventDefault();
    setLetter(event.key);
    return;
  }
  if (event.key === 'Backspace' || event.key === 'Delete') {
    event.preventDefault();
    clearLetter(event.key === 'Backspace');
    return;
  }
  const forward = (event.key === 'ArrowRight' && activeEntry.direction === 'across') ||
    (event.key === 'ArrowDown' && activeEntry.direction === 'down');
  const backward = (event.key === 'ArrowLeft' && activeEntry.direction === 'across') ||
    (event.key === 'ArrowUp' && activeEntry.direction === 'down');
  if (forward || backward) {
    event.preventDefault();
    activeIndex = Math.max(0, Math.min(activeIndex + (forward ? 1 : -1), activeEntry.answer.length - 1));
    paintSelection();
    focusActiveCell();
    return;
  }
  if (event.key === ' ' || event.key === 'Enter') {
    const { row, col } = position(activeEntry, activeIndex);
    const alternative = entriesAt(row, col).find(entry => entry.direction !== activeEntry.direction);
    if (alternative) {
      event.preventDefault();
      selectEntry(alternative, alternative.direction === 'across' ? col - alternative.col : row - alternative.row);
    }
  }
}

function checkAnswers() {
  const allLettersPresent = [...letters.values()].every(Boolean);
  const allCorrect = entries.every(entry => Array.from(entry.answer, (_, index) => {
    const { row, col } = position(entry, index);
    return letters.get(keyFor(row, col));
  }).join('') === entry.answer);

  document.querySelectorAll('.cell-wrap').forEach(wrapper => wrapper.classList.remove('incorrect', 'correct'));
  if (!allLettersPresent) {
    status.textContent = 'A few squares are still empty. Fill them in, then check again.';
    status.className = 'status error';
    return;
  }
  if (!allCorrect) {
    for (const entry of entries) {
      const word = Array.from(entry.answer, (_, index) => {
        const { row, col } = position(entry, index);
        return letters.get(keyFor(row, col));
      }).join('');
      if (word === entry.answer) continue;
      for (let index = 0; index < entry.answer.length; index += 1) {
        const { row, col } = position(entry, index);
        cells.get(keyFor(row, col)).parentElement.classList.add('incorrect');
      }
    }
    status.textContent = 'Not quite — review the highlighted word(s).';
    status.className = 'status error';
    return;
  }
  finished = true;
  for (const cell of cells.values()) cell.readOnly = true;
  document.querySelector('#word-input').readOnly = true;
  status.textContent = 'You cracked it! Show this screen to the P&G team to claim your prize.';
  status.className = 'status success';
  document.querySelectorAll('.cell-wrap').forEach(wrapper => wrapper.classList.add('correct'));
}

function resetPuzzle() {
  finished = false;
  document.querySelector('#word-input').readOnly = false;
  for (const [key, cell] of cells) {
    letters.set(key, '');
    cell.value = '';
    cell.readOnly = false;
    cell.parentElement.classList.remove('incorrect', 'correct');
  }
  status.textContent = 'Choose a clue, tap a square and type. Use the arrows to move between clues.';
  status.className = 'status';
  selectEntry(entries[0]);
  saveProgress();
}

function moveClue(step) {
  const nextIndex = (entries.indexOf(activeEntry) + step + entries.length) % entries.length;
  selectEntry(entries[nextIndex]);
}

document.querySelector('#previous-clue').addEventListener('click', () => moveClue(-1));
document.querySelector('#next-clue').addEventListener('click', () => moveClue(1));
document.querySelector('#check-button').addEventListener('click', checkAnswers);
document.querySelector('#reset-button').addEventListener('click', () => { if (![...letters.values()].some(Boolean) || confirm('Clear all your answers and start again?')) resetPuzzle(); });

const wordInput = document.querySelector('#word-input');
const cluePicker = document.querySelector('#clue-picker');
for (const entry of entries) {
  const option = document.createElement('option');
  option.value = entry.number;
  option.textContent = entry.number + ' · ' + entry.direction + ' · ' + entry.answer.length + ' letters';
  cluePicker.append(option);
}
cluePicker.addEventListener('change', () => selectEntry(entries.find(entry => entry.number === Number(cluePicker.value))));
wordInput.addEventListener('focus', () => wordInput.select());
wordInput.addEventListener('input', () => {
  if (finished) return;
  const cursor = wordInput.selectionStart;
  const raw = wordInput.value;
  const value = raw.toUpperCase().replace(/[^A-Z_]/g, '').slice(0, activeEntry.answer.length);
  wordInput.value = value;
  for (let i = 0; i < activeEntry.answer.length; i++) {
    const p = position(activeEntry, i);
    const key = keyFor(p.row, p.col);
    const letter = value[i] && value[i] !== '_' ? value[i] : '';
    letters.set(key, letter);
    cells.get(key).value = letter;
  }
  clearIncorrect();
  status.textContent = 'Your progress is saved. Check when all the squares are filled.';
  status.className = 'status';
  const nextCursor = raw.slice(0, cursor).replace(/[^a-zA-Z_]/g, '').length;
  wordInput.setSelectionRange(nextCursor, nextCursor);
  saveProgress();
});
wordInput.addEventListener('keydown', event => {
  if (event.key === 'Enter') { event.preventDefault(); moveClue(1); }
});
function syncWordInput(force = false) {
  const input = document.querySelector('#word-input');
  if (!force && document.activeElement === input) return;
  input.maxLength = activeEntry.answer.length;
  input.value = Array.from(activeEntry.answer, (_, i) => {
    const p = position(activeEntry, i);
    return letters.get(keyFor(p.row, p.col)) || '_';
  }).join('');
  document.querySelector('#clue-picker').value = activeEntry.number;
  updateProgress();
}
function updateProgress() {
  const count = [...letters.values()].filter(Boolean).length;
  document.querySelector('#progress').textContent = count + ' / ' + letters.size + ' squares filled';
}
function saveProgress() {
  updateProgress();
  try { localStorage.setItem('pg-product-grid-v1', JSON.stringify([...letters])); } catch (_) {}
}
buildPuzzle();
try {
  const saved = JSON.parse(localStorage.getItem('pg-product-grid-v1') || '[]');
  for (const [key, value] of saved) {
    if (cells.has(key) && /^[A-Z]$/.test(value)) { letters.set(key, value); cells.get(key).value = value; }
  }
} catch (_) {}
syncWordInput(true);

