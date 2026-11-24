# 502 — Balatro-themed card game (React Native / Expo)

Play the 502 card game (2–6 player rules from the reference site) against three bots. Hitting 502 points eliminates you; last player standing wins.

## Run
```
npm install
npx expo start      # scan the QR code with Expo Go
node tests/game.test.mjs   # rules tests
```

## Firebase (score history)
1. Create a Firebase project and a web app, then enable Firestore (test mode).
2. Paste the web config into `src/firebase.js`.

## Structure
| File | Purpose |
|---|---|
| `src/game.js` | All rules/scoring as pure functions + simple bot |
| `src/GameScreen.js` | Table UI |
| `src/HistoryScreen.js` | Past games from Firestore |
| `src/firebase.js` | Save / load history |
| `src/ui.js` | Shared colours, button, card |
| `App.js` | Home screen + screen switching |
