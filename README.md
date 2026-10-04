# P&G IT Tech Grid

A static student crossword prototype using P&G's corporate blue, cyan, white, and Montserrat typography. It is designed to work from touchscreens and desktop keyboards.

## Change the puzzle

Edit the `entries` array at the top of `game.js`. Each entry has a clue number, direction (`across` or `down`), starting row and column, answer, and clue text. The current test grid is 4 rows by 9 columns. The vertical answer is `CODE`; it crosses `CACHE`, `TOKEN`, `DATA`, and `SERVER`.

If you change the grid dimensions or entry positions, update `rowCount` and `colCount` in `game.js`. Then copy `index.html`, `styles.css`, and `game.js` into `dist/` before publishing.

The puzzle checks answers in the browser. It does not save names, record scores, or validate prize claims on a server.
