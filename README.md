# Workout Timer - Boxing & Kickboxing

Een professionele timer app voor kickboks en boks trainers. Beschikbaar als web app, iOS app en Android app.

## Features

- ⏱️ **Stopwatch** - Eenvoudige stopwatch functionaliteit
- ⏰ **Countdown Timer** - Afteltimer met instelbare tijd
- 🔄 **Interval Timer** - Work & Rest intervallen met meerdere rounds
- 🥊 **Tabata Timer** - Tabata/HIIT stijl training timer
- 🔊 **Geluiden** - Ring/box alarm geluiden bij elke fase overgang
- 📱 **PWA** - Installeerbaar als app op iOS, Android en desktop
- 🎨 **Grote Display** - Duidelijke, grote timer display voor tijdens trainingen

## Installatie

```bash
npm install
```

## Development

```bash
npm run dev
```

De app draait op `http://localhost:3000`

## Build

```bash
npm run build
```

## GitHub Pages Deployment

De app wordt automatisch geüpdatet naar GitHub Pages wanneer er wordt gepusht naar de `main` branch.

De app is beschikbaar op: https://bold700.github.io/workout-timer/

### Handmatige Deployment

1. Build de app: `npm run build`
2. Ga naar repository Settings → Pages
3. Selecteer "GitHub Actions" als source
4. De workflow zal automatisch draaien bij elke push naar main

## Mobile App Release

De app gebruikt **Capacitor** voor native iOS en Android builds. In de native app werkt volume ducking voor alle audio (Spotify, YouTube, etc.)!

### Vereisten

- Node.js 20+
- Xcode (voor iOS)
- Android Studio (voor Android)

### iOS (App Store)

1. Build de web app: `npm run build`
2. Sync met Capacitor: `npx cap sync ios`
3. Open in Xcode: `npx cap open ios`
4. Configureer je app ID en signing in Xcode
5. Build en test in Xcode
6. Submit naar App Store via Xcode

**Belangrijk:** De native iOS app kan het volume van andere apps tijdelijk verlagen via AVAudioSession ducking.

### Android (Play Store)

1. Build de web app: `npm run build`
2. Sync met Capacitor: `npx cap sync android`
3. Open in Android Studio: `npx cap open android`
4. Configureer je app in Android Studio
5. Build en test in Android Studio
6. Generate signed APK/AAB voor Play Store

**Belangrijk:** De native Android app kan het volume van andere apps tijdelijk verlagen via AudioFocus ducking.

### Native Features

- ✅ **Volume Ducking**: Werkt voor alle audio (Spotify, YouTube, Apple Music, etc.)
- ✅ **Hold to Talk**: Verlaagt automatisch alle audio tijdens het praten
- ✅ **Sonos Integratie**: Werkt ook in native apps

## PWA Installatie

De app kan geïnstalleerd worden als Progressive Web App (PWA) op:
- **iOS**: Open in Safari, tap op "Deel" → "Voeg toe aan beginscherm"
- **Android**: Chrome zal automatisch een installatie prompt tonen
- **Desktop**: Chrome/Edge tonen een installatie icoon in de adresbalk

## Technologie

- React 18
- TypeScript
- Vite
- PWA (Progressive Web App)
- Web Audio API voor geluiden

## Licentie

MIT
