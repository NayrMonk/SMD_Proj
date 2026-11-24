// Firestore score history (bonus task). Paste YOUR Firebase web-app config below.
// Firebase console > Project settings > Your apps > Web app. Then enable Firestore (test mode).
import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';

const app = initializeApp({
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT',
  appId: 'YOUR_APP_ID',
});
const db = initializeFirestore(app, { experimentalForceLongPolling: true }); // long-polling is the reliable mode in React Native

export const saveGame = (g) =>
  addDoc(collection(db, 'games'), {
    won: g.champ === 0,
    champion: g.players[g.champ].name,
    rounds: g.round,
    scores: g.players.map((p) => ({ name: p.name, score: p.score })),
    at: Date.now(),
  });

export const loadGames = async () =>
  (await getDocs(query(collection(db, 'games'), orderBy('at', 'desc'), limit(30)))).docs.map((d) => ({ id: d.id, ...d.data() }));
