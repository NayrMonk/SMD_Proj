// The table: bots on top, piles in the middle, your hand at the bottom.
import { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Modal, Pressable, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { newGame, nextRound, play, drawCard, botMove, legal, SYM, SUITS, RANKS, LIMIT } from './game';
import { saveGame } from './firebase';
import { C, Btn, Card, font } from './ui';

const sortHand = (h) => [...h].sort((a, b) => SUITS.indexOf(a.s) - SUITS.indexOf(b.s) || RANKS.indexOf(a.r) - RANKS.indexOf(b.r));

export default function GameScreen({ onExit }) {
  const [g, setG] = useState(newGame);
  const [jack, setJack] = useState(null); // Jack waiting for a suit choice
  const [note, setNote] = useState(''); // warning for invalid taps
  const [saveErr, setSaveErr] = useState(false);
  const saved = useRef(false);
  const myTurn = g.phase === 'play' && g.turn === 0;
  const top = g.discard[g.discard.length - 1];
  const pen = g.pending;

  // Bots move automatically after a short pause.
  useEffect(() => {
    if (g.phase !== 'play' || g.turn === 0) return;
    const t = setTimeout(() => setG(botMove(g)), 1000);
    return () => clearTimeout(t);
  }, [g]);

  useEffect(() => setNote(''), [g]);

  // Save the finished game to Firebase once.
  useEffect(() => {
    if (g.phase === 'over' && !saved.current) { saved.current = true; saveGame(g).catch(() => setSaveErr(true)); }
  }, [g.phase]);

  const tap = (c) => {
    if (!myTurn) return setNote('Wait for your turn!');
    if (!legal(g, c)) return setNote(pen ? 'Answer the penalty or take it!' : "That card doesn't match!");
    c.r === 'J' ? setJack(c) : setG(play(g, c));
  };
  const restart = () => { saved.current = false; setSaveErr(false); setG(newGame()); };

  return (
    <LinearGradient colors={[C.felt, C.dark]} style={s.root}>
      <View style={s.bar}>
        <Btn label="✕" color={C.blue} onPress={onExit} style={s.small} />
        <Text style={s.title}>ROUND {g.round}</Text>
        <Text style={s.title}>/{LIMIT}</Text>
      </View>

      {/* Opponents */}
      <View style={s.row}>
        {g.players.slice(1).map((p, i) => (
          <Animatable.View key={p.name} animation={g.turn === i + 1 && g.phase === 'play' ? 'pulse' : undefined} iterationCount="infinite"
            style={[s.bot, g.turn === i + 1 && { borderColor: C.gold }, p.out && { opacity: 0.35 }]}>
            <Text style={s.name}>{p.name}</Text>
            <Card faceDown small />
            <Text style={s.sub}>{p.out ? 'OUT' : p.hand.length + ' cards'}</Text>
            <Text style={[s.sub, { color: C.gold }]}>{p.score}</Text>
          </Animatable.View>
        ))}
      </View>

      {/* Piles */}
      <View style={s.mid}>
        <View style={{ alignItems: 'center' }}>
          <Card faceDown onPress={() => myTurn && setG(drawCard(g))} />
          <Text style={s.sub}>{pen ? (pen.type === 'skip' ? 'ACCEPT SKIP' : 'TAKE ' + pen.n) : 'DRAW'}</Text>
        </View>
        <Animatable.View key={g.discard.length} animation="bounceIn" duration={600}>
          <Card card={top} />
        </Animatable.View>
        <View style={{ width: 70, alignItems: 'center' }}>
          {g.suit && <Text style={{ fontSize: 44, color: C.suit[g.suit] === C.ink ? C.cream : C.suit[g.suit] }}>{SYM[g.suit]}</Text>}
          {pen && <Animatable.Text animation="flash" iterationCount="infinite" style={s.pen}>{pen.type === 'skip' ? 'SKIP!' : '+' + pen.n}</Animatable.Text>}
        </View>
      </View>

      <Text style={s.msg}>{note || g.msg}</Text>

      {/* Your hand */}
      <Text style={[s.name, { color: myTurn ? C.gold : C.cream }]}>{myTurn ? 'YOUR TURN' : g.players[0].out ? 'YOU ARE OUT' : '…'}   score {g.players[0].score}</Text>
      <ScrollView horizontal contentContainerStyle={s.hand} showsHorizontalScrollIndicator={false}>
        {sortHand(g.players[0].hand).map((c) => (
          <Animatable.View key={c.r + c.s} animation="fadeInUp" duration={400}>
            <Card card={c} onPress={tap} playable={myTurn && legal(g, c)} style={myTurn && legal(g, c) && { marginTop: -12 }} />
          </Animatable.View>
        ))}
      </ScrollView>

      {/* Jack: choose a suit */}
      <Modal transparent visible={!!jack} animationType="fade">
        <View style={s.modal}>
          <View style={s.box}>
            <Text style={s.title}>NAME A SUIT</Text>
            <View style={s.row}>
              {SUITS.map((x) => (
                <Pressable key={x} onPress={() => { setG(play(g, jack, x)); setJack(null); }} style={s.suitBtn}>
                  <Text style={{ fontSize: 40, color: C.suit[x] }}>{SYM[x]}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Round / game end */}
      <Modal transparent visible={g.phase !== 'play'} animationType="fade">
        <View style={s.modal}>
          <Animatable.View animation="zoomIn" style={s.box}>
            {g.phase === 'over' ? (
              <Animatable.Text animation="tada" iterationCount="infinite" style={[s.title, { fontSize: 28 }]}>
                {g.champ === 0 ? '🏆 YOU WIN!' : g.players[g.champ].name + ' WINS'}
              </Animatable.Text>
            ) : <Text style={s.title}>{g.msg}</Text>}
            {g.players.map((p) => (
              <Text key={p.name} style={[s.line, p.out && { opacity: 0.4 }]}>{p.name.padEnd(8)} +{String(p.last).padEnd(4)} = {p.score}{p.out ? '  OUT' : ''}</Text>
            ))}
            {saveErr && g.phase === 'over' && <Text style={[s.sub, { color: C.red }]}>History not saved (check Firebase config)</Text>}
            {g.phase === 'over' ? (
              <>
                <Btn label="PLAY AGAIN" onPress={restart} style={s.wide} />
                <Btn label="HOME" color={C.blue} onPress={onExit} style={s.wide} />
              </>
            ) : <Btn label="NEXT ROUND" onPress={() => setG(nextRound(g))} style={s.wide} />}
          </Animatable.View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, paddingTop: 50, paddingHorizontal: 12 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  small: { paddingVertical: 6, paddingHorizontal: 14, marginRight: 'auto' },
  title: { ...font, color: C.cream, fontSize: 18, textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 12 },
  bot: { alignItems: 'center', padding: 8, borderRadius: 12, borderWidth: 3, borderColor: 'transparent', backgroundColor: 'rgba(0,0,0,0.3)', minWidth: 96 },
  name: { ...font, color: C.cream, fontSize: 13, marginBottom: 4, textAlign: 'center' },
  sub: { ...font, color: C.cream, fontSize: 12, marginTop: 4 },
  mid: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 14, borderRadius: 100, backgroundColor: 'rgba(0,0,0,0.25)', marginVertical: 8 },
  pen: { ...font, color: C.red, fontSize: 24 },
  msg: { ...font, color: C.gold, textAlign: 'center', fontSize: 15, marginVertical: 10, minHeight: 20 },
  hand: { paddingTop: 20, paddingBottom: 30, paddingHorizontal: 6, gap: -14 },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 24 },
  box: { backgroundColor: C.ink, borderRadius: 16, borderWidth: 4, borderColor: C.gold, padding: 20, gap: 8 },
  suitBtn: { backgroundColor: C.cream, borderRadius: 12, padding: 12, borderWidth: 3, borderColor: C.ink },
  line: { ...font, color: C.cream, fontSize: 15 },
  wide: { marginTop: 8 },
});
