// Past games, loaded from Firestore (bonus task).
import { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { loadGames } from './firebase';
import { C, Btn, font } from './ui';

export default function HistoryScreen({ onExit }) {
  const [games, setGames] = useState(null);
  const [err, setErr] = useState(false);
  useEffect(() => { loadGames().then(setGames).catch(() => setErr(true)); }, []);

  return (
    <LinearGradient colors={[C.felt, C.dark]} style={s.root}>
      <Text style={s.title}>HISTORY</Text>
      {err ? <Text style={s.empty}>Could not load. Check your Firebase config.</Text>
        : !games ? <ActivityIndicator size="large" color={C.gold} style={{ marginTop: 40 }} />
        : <FlatList data={games} keyExtractor={(g) => g.id} ListEmptyComponent={<Text style={s.empty}>No games yet. Go play!</Text>}
            renderItem={({ item: g, index }) => (
              <Animatable.View animation="fadeInUp" delay={index * 60} style={[s.card, { borderColor: g.won ? C.gold : C.red }]}>
                <Text style={[s.result, { color: g.won ? C.gold : C.red }]}>{g.won ? 'WIN' : 'LOSS'} · {g.rounds} rounds</Text>
                <Text style={s.line}>{g.scores.map((p) => p.name + ' ' + p.score).join('  ·  ')}</Text>
                <Text style={s.date}>{new Date(g.at).toLocaleString()}</Text>
              </Animatable.View>
            )} />}
      <Btn label="BACK" color={C.blue} onPress={onExit} style={{ marginVertical: 16 }} />
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, paddingTop: 60, paddingHorizontal: 16 },
  title: { ...font, color: C.cream, fontSize: 30, textAlign: 'center', marginBottom: 16 },
  empty: { ...font, color: C.cream, textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: C.ink, borderRadius: 12, borderWidth: 3, padding: 14, marginBottom: 10 },
  result: { ...font, fontSize: 18 },
  line: { ...font, color: C.cream, fontSize: 12, marginTop: 6 },
  date: { ...font, color: '#8b93b8', fontSize: 11, marginTop: 6 },
});
