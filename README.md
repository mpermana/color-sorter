# Color Sort — Phaser + Vite (Web-first) + Capacitor-ready

## Quick start (Web)
```bash
npm install
npm run dev
```
Open the URL shown (defaults to http://localhost:5173).

## Build for web
```bash
npm run build
npx serve dist   # or any static host
```

## Wrap with Capacitor for iOS/Android (after web build works)
```bash
npm install --save-dev @capacitor/cli @capacitor/core @capacitor/ios @capacitor/android
npx cap init ColorSort com.example.colorsort --web-dir=dist
npm run build
npx cap add ios
npx cap add android
npx cap sync

# Open native projects
npx cap open ios
npx cap open android
```

### iOS notes
- In Xcode, set Signing & Capabilities to your Apple ID/team.
- Build/Run on device or simulator.

### Android notes
- Open in Android Studio, let Gradle sync, then Run.

## Controls
- Tap a tube to select source (highlighted).
- Tap another tube to attempt a move.
- **Undo** reverts one move.
- **Restart** generates a new solvable level.

## Where to add features
- Game rules: `src/game/logic.ts`
- Level generation: `src/game/generator.ts`
- Rendering & input: `src/scenes/GameScene.ts`
- Boot & config: `src/main.ts`

## Next steps
- Add tweened ball animation on move (bezier to target slot).
- Add hint system by simulating a few moves ahead.
- Save/Load with `localStorage` (serialize `state` after each move).
- Add simple HUD buttons for levels / settings / themes.
- Add service worker for offline play (Vite plugin or Workbox).