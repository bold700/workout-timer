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

## Mobile App Release

### iOS (App Store)

1. Build de app met `npm run build`
2. Gebruik een tool zoals [Capacitor](https://capacitorjs.com/) of [Cordova](https://cordova.apache.org/) om een native iOS app te maken
3. Of gebruik [PWA Builder](https://www.pwabuilder.com/) om een iOS app te genereren

### Android (Play Store)

1. Build de app met `npm run build`
2. Gebruik [Capacitor](https://capacitorjs.com/) of [Cordova](https://cordova.apache.org/) om een native Android app te maken
3. Of gebruik [PWA Builder](https://www.pwabuilder.com/) om een Android app te genereren

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
