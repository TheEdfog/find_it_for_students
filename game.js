const entries = [
  { number: 1, direction: 'across', row: 0, col: 4, answer: 'CACHE', clue: 'A fast storage layer that keeps frequently used data close.' },
  { number: 2, direction: 'down', row: 0, col: 4, answer: 'CODE', clue: 'Instructions written for a computer to follow.' },
  { number: 3, direction: 'across', row: 1, col: 3, answer: 'TOKEN', clue: 'A small unit of text processed by a language model.' },
  { number: 4, direction: 'across', row: 2, col: 4, answer: 'DATA', clue: 'Facts or measurements that a computer can process.' },
  { number: 5, direction: 'across', row: 3, col: 3, answer: 'SERVER', clue: 'A computer that provides information or services to others.' },
];

const rowCount = 4;
const colCount = 9;
const board = document.querySelector('#board');
const status = document.querySelector('#status');
const cells = new Map();
const letters = new Map();
let activeEntry = entries[0];
let activeIndex = 0;
let finished = false;

function keyFor(row, col) { return `${row},${col}`; }

function position(entry, index) {
  return entry.direction === 'across'
    ? { row: entry.row, col: entry.col + index }
    : { row: entry.row + index, col: entry.col };
}

function entriesAt(row, col) {
  return entries.filter(entry => {
    const index = entry.direction === 'across' ? col - entry.col : row - entry.row;
    if (index < 0 || index >= entry.answer.length) return false;
    const cellPosition = position(entry, index);
    return keyFor(cellPosition.row, cellPosition.col) === keyFor(row, col);
  });
}

function buildPuzzle() {
  const cellInfo = new Map();
  for (const entry of entries) {
    for (let index = 0; index < entry.answer.length; index += 1) {
      const { row, col } = position(entry, index);
      const key = keyFor(row, col);
      const info = cellInfo.get(key) ?? { row, col, entries: [] };
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
      cell.setAttribute('aria-label', `Row ${row + 1}, column ${col + 1}: ${info.entries.map(entry => `${entry.direction} ${entry.number}`).join(', ')}`);
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
  document.querySelector('#clue-label').textContent = `${entry.number} ${entry.direction.toUpperCase()}`;
  document.querySelector('#clue-count').textContent = `CLUE ${entries.indexOf(entry) + 1} OF ${entries.length}`;
  document.querySelector('#current-clue').textContent = entry.clue;
  document.querySelector('#answer-length').textContent = `${entry.answer.length} LETTERS`;
  paintSelection();
  if (focus) focusActiveCell();
}

function selectCell(info, focus = true) {
  const matching = info.entries.find(entry => entry.direction === activeEntry.direction) ?? info.entries[0];
  const index = matching.direction === 'across' ? info.col - matching.col : info.row - matching.row;
  selectEntry(matching, index, false);
  if (focus) focusActiveCell();
}

function paintSelection() {
  document.querySelectorAll('.cell-wrap').forEach(wrapper => wrapper.classList.remove('selected-entry'));
  for (let index = 0; index < activeEntry.answer.length; index += 1) {
    const { row, col } = position(activeEntry, index);
    cells.get(keyFor(row, col)).parentElement.classList.add('selected-entry');
  }
  const { row, col } = position(activeEntry, activeIndex);
  const current = cells.get(keyFor(row, col));
  document.querySelectorAll('.cell').forEach(cell => { cell.tabIndex = cell === current ? 0 : -1; });
}

function focusActiveCell() {
  const { row, col } = position(activeEntry, activeIndex);
  cells.get(keyFor(row, col)).focus();
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
  cell.parentElement.classList.remove('incorrect', 'correct');
  if (activeIndex < activeEntry.answer.length - 1) activeIndex += 1;
  paintSelection();
  focusActiveCell();
  status.textContent = 'Keep going — every crossing is a clue.';
  status.className = 'status';
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
  cells.get(key).parentElement.classList.remove('incorrect', 'correct');
  paintSelection();
  focusActiveCell();
}

function handleCellInput(event) {
  const value = event.currentTarget.value.toUpperCase().replace(/[^A-Z]/g, '').slice(-1);
  event.currentTarget.value = value;
  if (value) setLetter(value);
  else {
    const { row, col } = position(activeEntry, activeIndex);
    const key = keyFor(row, col);
    letters.set(key, '');
    cells.get(key).parentElement.classList.remove('incorrect', 'correct');
  }
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
  const forward = event.key === 'ArrowRight' && activeEntry.direction === 'across'
    || event.key === 'ArrowDown' && activeEntry.direction === 'down';
  const backward = event.key === 'ArrowLeft' && activeEntry.direction === 'across'
    || event.key === 'ArrowUp' && activeEntry.direction === 'down';
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
    for (const [key, cell] of cells) {
      const expected = entries.flatMap(entry => Array.from(entry.answer, (letter, index) => ({ entry, letter, index })))
        .find(({ entry, index }) => { const p = position(entry, index); return keyFor(p.row, p.col) === key; }).letter;
      cell.parentElement.classList.add(letters.get(key) === expected ? 'correct' : 'incorrect');
    }
    status.textContent = 'Not quite — try the red squares again.';
    status.className = 'status error';
    return;
  }
  finished = true;
  status.textContent = 'You cracked it! Show this screen to the P&G team to claim your prize.';
  status.className = 'status success';
  document.querySelectorAll('.cell-wrap').forEach(wrapper => wrapper.classList.add('correct'));
}

function resetPuzzle() {
  finished = false;
  for (const [key, cell] of cells) {
    letters.set(key, '');
    cell.value = '';
    cell.parentElement.classList.remove('incorrect', 'correct');
  }
  status.textContent = 'Tap a square and type a letter. Use the arrows to move between clues.';
  status.className = 'status';
  selectEntry(entries[0]);
}

function moveClue(step) {
  const nextIndex = (entries.indexOf(activeEntry) + step + entries.length) % entries.length;
  selectEntry(entries[nextIndex]);
}

document.querySelector('#previous-clue').addEventListener('click', () => moveClue(-1));
document.querySelector('#next-clue').addEventListener('click', () => moveClue(1));
document.querySelector('#check-button').addEventListener('click', checkAnswers);
document.querySelector('#reset-button').addEventListener('click', resetPuzzle);
buildPuzzle();
