// 502 game logic. Pure functions: every move takes a state and returns a NEW state (no UI code here).
// Card = { r: rank, s: suit }  e.g. { r:'7', s:'H' }.  Suits: S H D C.
export const SUITS = ['S', 'H', 'D', 'C'];
export const SYM = { S: '♠', H: '♥', D: '♦', C: '♣' };
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const LIMIT = 502;

const clone = (s) => JSON.parse(JSON.stringify(s));
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const isSeven = (c) => c.r === '7' && c.s === 'H';
const isAceS = (c) => c.r === 'A' && c.s === 'S';

// Penalty points for a card left in hand.
export const points = (c) =>
  isSeven(c) || isAceS(c) ? 100 : ['2', '8', 'J'].includes(c.r) ? 30 : c.r === 'A' ? 20 : ['10', 'Q', 'K'].includes(c.r) ? 10 : 5;

// Index of the next player who is not eliminated.
const next = (s, from) => { let i = (from + 1) % s.players.length; while (s.players[i].out) i = (i + 1) % s.players.length; return i; };

// Draw n cards into player p. If the draw pile is empty, reshuffle the discards (keep the top card).
function take(s, p, n) {
  for (let i = 0; i < n; i++) {
    if (!s.draw.length) { const top = s.discard.pop(); s.draw = shuffle(s.discard); s.discard = [top]; }
    if (!s.draw.length) return; // nothing left anywhere
    p.hand.push(s.draw.pop());
  }
}

// Can this card be played right now?
export function legal(s, c) {
  if (s.pending) return c.r === { draw: '2', ace: 'A', skip: '8' }[s.pending.type]; // penalties come first
  if (c.r === 'J' || isSeven(c)) return true; // wild cards
  const top = s.discard[s.discard.length - 1];
  return s.suit ? c.s === s.suit : c.s === top.s || c.r === top.r; // after a Jack, only the named suit
}

function startRound(s, starter) {
  const d = shuffle(RANKS.flatMap((r) => SUITS.map((x) => ({ r, s: x }))));
  s.players.forEach((p) => { p.hand = p.out ? [] : d.splice(0, 7); p.last = 0; });
  let first = d.pop();
  while (['2', 'J', 'A'].includes(first.r) || isSeven(first)) { d.unshift(first); first = d.pop(); } // bad starters go to the bottom
  Object.assign(s, { draw: d, discard: [first], turn: starter, pending: null, suit: null, phase: 'play', round: s.round + 1, msg: 'Round ' + (s.round + 1) });
}

export function newGame() {
  const s = { players: ['You', 'Jimbo', 'Chicot', 'Perkeo'].map((name) => ({ name, hand: [], score: 0, out: false, last: 0 })), round: 0, lastWinner: 0 };
  startRound(s, 0);
  return s;
}

export function nextRound(state) {
  const s = clone(state);
  const alive = s.players.map((_, i) => i).filter((i) => !s.players[i].out);
  // Fewest points last round starts (last winner wins ties).
  let starter = alive.includes(s.lastWinner) ? s.lastWinner : alive[0];
  alive.forEach((i) => { if (s.players[i].last < s.players[starter].last) starter = i; });
  startRound(s, starter);
  return s;
}

function endRound(s, wi) {
  s.players.forEach((p) => { if (!p.out) { p.last = p.hand.reduce((t, c) => t + points(c), 0); p.score += p.last; } });
  s.lastWinner = wi;
  const alive = s.players.filter((p) => !p.out);
  if (alive.every((p) => p.score >= LIMIT)) { // everyone crossed: lowest total wins
    const best = alive.reduce((a, b) => (b.score < a.score ? b : a));
    alive.forEach((p) => { if (p !== best) p.out = true; });
  } else {
    s.players.forEach((p, i) => { if (!p.out && p.score >= LIMIT && i !== wi) p.out = true; }); // round winner is spared this round
  }
  const left = s.players.filter((p) => !p.out);
  s.phase = left.length <= 1 ? 'over' : 'roundEnd';
  if (s.phase === 'over') s.champ = s.players.indexOf(left[0]);
  s.msg = s.players[wi].name + ' won the round';
  return s;
}

// Current player plays `card` (suit = chosen suit when it is a Jack). Invalid moves return the state unchanged.
export function play(state, card, suit) {
  const s = clone(state);
  const p = s.players[s.turn];
  const i = p.hand.findIndex((c) => c.r === card.r && c.s === card.s);
  if (s.phase !== 'play' || i < 0 || !legal(s, p.hand[i])) return state;
  const [c] = p.hand.splice(i, 1);
  s.discard.push(c);
  s.suit = c.r === 'J' ? suit : null;
  if (c.r === '2') s.pending = { type: 'draw', n: (s.pending ? s.pending.n : 0) + 2 }; // 2s stack
  else if (isAceS(c)) s.pending = { type: 'ace', n: 5 }; // stays 5 even when passed on
  else if (c.r === '8') s.pending = { type: 'skip', n: 0 };
  // other Aces only matter when passing on a pending Ace penalty: pending is left as is
  const me = s.turn;
  s.turn = next(s, me);
  s.msg = p.name + ' played ' + c.r + SYM[c.s];
  if (isSeven(c) || !p.hand.length) { // round over; a final 2 / A♠ still hits the next player
    if (s.pending && s.pending.type !== 'skip') take(s, s.players[s.turn], s.pending.n);
    s.pending = null;
    return endRound(s, me);
  }
  return s;
}

// Current player draws 1 card, or accepts the pending penalty (draw n / lose turn). Either ends the turn.
export function drawCard(state) {
  if (state.phase !== 'play') return state;
  const s = clone(state);
  const p = s.players[s.turn];
  const pen = s.pending;
  if (pen) { take(s, p, pen.n); s.msg = p.name + (pen.type === 'skip' ? ' was skipped' : ' drew ' + pen.n); s.pending = null; }
  else { take(s, p, 1); s.msg = p.name + ' drew a card'; }
  s.turn = next(s, s.turn);
  return s;
}

// Simple bot: dump the most expensive playable card (keeps the 7♥ unless it is the only option).
export function botMove(s) {
  const p = s.players[s.turn];
  const options = p.hand.filter((c) => legal(s, c)).sort((a, b) => points(b) - points(a));
  if (!options.length) return drawCard(s);
  const c = options.find((x) => !isSeven(x)) || options[0];
  const count = {};
  p.hand.forEach((x) => { if (x !== c) count[x.s] = (count[x.s] || 0) + 1; });
  const suit = SUITS.reduce((a, b) => ((count[b] || 0) > (count[a] || 0) ? b : a)); // most common suit in hand
  return play(s, c, suit);
}
