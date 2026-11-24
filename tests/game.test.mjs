// Run: node tests/game.test.mjs   (checks the rules in src/game.js)
import assert from 'node:assert';
import { newGame, play, drawCard, botMove, legal, points } from '../src/game.js';

const c = (r, s) => ({ r, s });
// Build a state: hands per player, top discard, whose turn.
const mk = (hands, top, turn = 0) => ({
  players: hands.map((h, i) => ({ name: 'P' + i, hand: h, score: 0, out: false, last: 0 })),
  draw: Array.from({ length: 20 }, () => c('3', 'D')), discard: [top], turn, pending: null, suit: null, phase: 'play', round: 1, lastWinner: 0,
});

// scoring example from the rules: A♠ + J♦ + 4♣ = 135
assert.equal([c('A', 'S'), c('J', 'D'), c('4', 'C')].reduce((t, x) => t + points(x), 0), 135);

// match by suit or value; Jack and 7♥ are wild
let s = mk([[c('5', 'H'), c('9', 'C'), c('J', 'S')], [c('4', 'D')], [c('4', 'S')]], c('5', 'D'));
assert(legal(s, c('5', 'H')) && !legal(s, c('9', 'C')) && legal(s, c('J', 'S')));

// 2s stack: 2 -> 2 -> next player draws 4
s = mk([[c('2', 'H'), c('9', 'S')], [c('2', 'D'), c('9', 'D')], [c('4', 'S'), c('5', 'S')]], c('3', 'H'));
s = play(s, c('2', 'H'));
assert.equal(s.pending.n, 2);
assert(!legal(s, c('9', 'D'))); // penalty first: can't ignore it with a normal card
s = play(s, c('2', 'D'));
assert.equal(s.pending.n, 4);
s = drawCard(s);
assert.equal(s.players[2].hand.length, 6);
assert.equal(s.pending, null);

// Ace of spades = 5, passed with any Ace, stays 5
s = mk([[c('A', 'S'), c('9', 'S')], [c('A', 'H'), c('9', 'D')], [c('4', 'S')]], c('3', 'S'));
s = play(s, c('A', 'S')); s = play(s, c('A', 'H'));
assert.equal(s.pending.n, 5);

// 8 skips the next player without drawing
s = mk([[c('8', 'H'), c('9', 'S')], [c('4', 'D'), c('5', 'D')], [c('4', 'S')]], c('3', 'H'));
s = play(s, c('8', 'H')); s = drawCard(s);
assert.equal(s.players[1].hand.length, 2);
assert.equal(s.turn, 2);

// Jack forces the named suit
s = mk([[c('J', 'S'), c('9', 'S')], [c('4', 'D'), c('4', 'H')], [c('4', 'S')]], c('3', 'H'));
s = play(s, c('J', 'S'), 'D');
assert(legal(s, c('4', 'D')) && !legal(s, c('4', 'H')));

// 7♥ ends the round at once and the winner still counts hand
s = mk([[c('7', 'H'), c('K', 'S')], [c('4', 'D')], [c('4', 'S')]], c('3', 'C'));
s = play(s, c('7', 'H'));
assert.equal(s.phase, 'roundEnd');
assert.equal(s.players[0].score, 10);
assert.equal(s.players[1].score, 5);

// going out with a 2 still makes the next player draw first
s = mk([[c('2', 'H')], [c('4', 'D')], [c('4', 'S')]], c('3', 'H'));
s = play(s, c('2', 'H'));
assert.equal(s.players[1].hand.length, 3);
assert.equal(s.players[0].score, 0);

// elimination at 502 + game over when one player is left
s = mk([[c('K', 'S')], [c('4', 'D'), c('4', 'S')], [c('4', 'H')]], c('K', 'D'));
s.players[1].score = 500;
s = play(s, c('K', 'S'));
assert(s.players[1].out);
assert.equal(s.phase, 'roundEnd');

// invalid move is ignored
s = mk([[c('9', 'C')], [c('4', 'D')]], c('5', 'D'));
assert.equal(play(s, c('9', 'C')), s);

// stability: 200 full bot-vs-bot games always terminate
for (let n = 0; n < 200; n++) {
  let g = newGame(), moves = 0;
  while (g.phase !== 'over') {
    if (g.phase === 'roundEnd') { const { nextRound } = await import('../src/game.js'); g = nextRound(g); continue; }
    g = botMove(g);
    assert(++moves < 20000, 'game did not finish');
  }
  assert(g.champ >= 0);
}
console.log('all tests passed');
