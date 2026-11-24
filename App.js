// Entry point: tiny screen switcher (home / game / history), no navigation library needed.
import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import GameScreen from './src/GameScreen';
import HistoryScreen from './src/HistoryScreen';
import { C, Btn, font } from './src/ui';

export default function App() {
  const [screen, setScreen] = useState('home');
  const home = () => setScreen('home');
  return (
    <>
      <StatusBar style="light" />
      {screen === 'game' ? <GameScreen onExit={home} />
        : screen === 'history' ? <HistoryScreen onExit={home} />
        : (
          <LinearGradient colors={[C.felt, C.dark]} style={s.root}>
            <View style={s.suits}>
              {['♠', '♥', '♣', '♦'].map((x, i) => (
                <Animatable.Text key={x} animation="bounce" iterationCount="infinite" duration={2400} delay={i * 300}
                  style={[s.suit, { color: i % 2 ? C.red : C.cream }]}>{x}</Animatable.Text>
              ))}
            </View>
            <Animatable.Text animation="swing" iterationCount="infinite" duration={4000} style={s.logo}>502</Animatable.Text>
            <Text style={s.tag}>DON'T HIT THE LIMIT</Text>
            <Animatable.View animation="fadeInUp" delay={300} style={{ gap: 16, marginTop: 50, width: 240 }}>
              <Btn label="PLAY" onPress={() => setScreen('game')} />
              <Btn label="HISTORY" color={C.blue} onPress={() => setScreen('history')} />
            </Animatable.View>
          </LinearGradient>
        )}
    </>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  suits: { flexDirection: 'row', gap: 20 },
  suit: { fontSize: 40 },
  logo: { ...font, fontSize: 110, color: C.gold, textShadowColor: C.red, textShadowOffset: { width: 6, height: 6 }, textShadowRadius: 0 },
  tag: { ...font, color: C.cream, letterSpacing: 3 },
});
