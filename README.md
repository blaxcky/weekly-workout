# Weekly Workout 💪

Eine PWA zum Tracken von wöchentlichem Krafttraining und Physio-Übungen. Optimiert für ADHD – keine starren Trainingspläne, sondern eine flexible Wochenvorlage.

## Features

- 📋 **Wochenvorlage** – Definiere welche Übungen du pro Woche machen willst
- ✅ **Übungen abhaken** – Erledige Übungen wann immer du Bock hast
- 🏋️ **Gewicht & Band Tracking** – Gewicht (kg) oder Bandwiderstand pro Übung
- 🔥 **Kalorien Tracking** – kcal pro Übung + extra Cardio-Einträge
- 📊 **Wochenstatistik** – Fortschritt und kcal-Übersicht
- 📱 **Installierbare PWA** – Funktioniert offline wie eine native App
- 🌙 **Dark/Light Mode** – Umschaltbar
- 💾 **Import/Export** – Daten als JSON sichern und wiederherstellen
- 🔄 **Cache-Reset** – Service Worker zurücksetzen ohne Datenverlust

## Tech-Stack

- React 18 + TypeScript + Vite
- MUI (Material UI) v7 – Material Design
- Dexie.js (IndexedDB)
- vite-plugin-pwa (Workbox)
- GitHub Pages

## Entwicklung

```bash
npm install --legacy-peer-deps
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deployment

Push auf main → GitHub Actions baut und deployt automatisch auf GitHub Pages.
