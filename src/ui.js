// Shared Balatro-style look: colours, chunky 3D button, playing card.
import { useRef } from 'react';
import { Text, View, Pressable, StyleSheet, Platform } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { SYM } from './game';

export const C = {
  felt: '#0f5a42', dark: '#06261c', cream: '#f4ecd8', ink: '#1b1f3b', red: '#e5484d', blue: '#3b82f6', orange: '#f59e0b', gold: '#fbbf24',
  suit: { S: '#1b1f3b', H: '#e5484d', D: '#f59e0b', C: '#2563eb' },
};
export const font = { fontFamily: Platform.select({ ios: 'Courier New', default: 'monospace' }), fontWeight: '900' };

// Chunky button that "presses down" like Balatro's Play / Discard buttons.
export const Btn = ({ label, color = C.red, onPress, style }) => (
  <Pressable onPress={onPress} style={({ pressed }) => [s.btn, { backgroundColor: color, borderBottomWidth: pressed ? 2 : 6, marginTop: pressed ? 4 : 0 }, style]}>
    <Text style={s.btnTxt}>{label}</Text>
  </Pressable>
);

// Playing card. faceDown = red card back. playable=false dims it and shakes when tapped.
export function Card({ card, onPress, playable = true, faceDown, small, style }) {
  const ref = useRef(null);
  const w = small ? 36 : 64, h = small ? 52 : 92;
  const tap = () => { if (!playable) ref.current?.shake(400); onPress?.(card); };
  const color = card ? C.suit[card.s] : C.red;
  return (
    <Pressable onPress={tap} disabled={!onPress}>
      <Animatable.View ref={ref} style={[s.card, { width: w, height: h, backgroundColor: faceDown ? C.red : C.cream, opacity: playable ? 1 : 0.5 }, style]}>
        {faceDown ? (
          <View style={s.back}><Text style={{ color: C.cream, fontSize: small ? 14 : 26 }}>♦</Text></View>
        ) : (
          <>
            <Text style={[s.rank, { color, fontSize: small ? 11 : 17 }]}>{card.r}</Text>
            <Text style={{ color, fontSize: small ? 18 : 34, textAlign: 'center' }}>{SYM[card.s]}</Text>
          </>
        )}
      </Animatable.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: { paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12, borderBottomColor: 'rgba(0,0,0,0.4)', alignItems: 'center' },
  btnTxt: { ...font, color: '#fff', fontSize: 18, letterSpacing: 1 },
  card: { borderRadius: 8, borderWidth: 3, borderColor: C.ink, padding: 3, justifyContent: 'space-between', elevation: 4 },
  rank: { ...font },
  back: { flex: 1, borderWidth: 2, borderColor: C.cream, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
});
