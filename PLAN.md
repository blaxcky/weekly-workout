# Umbau: Trainingstag-Modus

## Problem
Die App verteilt Übungen aktuell über die ganze Woche (Mo-Fr), was unübersichtlich ist. Der Nutzer arbeitet 2 Tage/Woche im Homeoffice (nicht immer die gleichen Tage) und will an diesen Tagen trainieren. Physio soll separat und flexibler sein.

## Neues Konzept

### Kernidee: "Heute ist Trainingstag"-Toggle
- Morgens entscheidet der Nutzer: Ist heute Trainingstag? → Toggle auf dem Dashboard
- **Trainingstag**: Alle Kraft-Übungen erscheinen als einfache Checkliste (1x pro Übung abhaken)
- **Kein Trainingstag**: Nur Physio-Sektion sichtbar
- **Physio**: Eigene Sektion, erscheint an ALLEN Tagen, hat eigenes Wochen-Target (z.B. 5x/Woche)
- Kein fixes Limit für Trainingstage – komplett flexibel

### Dashboard-Layout (neu)

```
┌─────────────────────────────┐
│  KW 14 · 30.03. – 05.04.   │
│  [📊 Wochenübersicht ▼]    │  ← einklappbar
├─────────────────────────────┤
│                             │
│  ┌─ Trainingstag Toggle ──┐ │
│  │ 💪 Heute ist           │ │
│  │    Trainingstag  [ON]  │ │
│  │ (2 diese Woche)        │ │
│  └────────────────────────┘ │
│                             │
│  ── Kraft-Übungen ───────── │  ← nur wenn Toggle ON
│  ☐ Klimmzüge        ✓     │
│  ☐ Liegestütz              │
│  ☐ Kniebeugen              │
│  ...                        │
│                             │
│  ── Physio ──────────────── │  ← immer sichtbar
│  ☐ Dehnung Hüfte    3/5   │
│  ☐ Schulter-Rotation 2/5  │
│  ...                        │
│                             │
│  [📊 kcal: 120 heute]      │
└─────────────────────────────┘
```

### Trainingstag-Logik
- Toggle wird pro Tag gespeichert (neue DB-Tabelle `trainingDays`)
- Kraft-Übungen: Ziel = 1x pro Trainingstag abhaken
- Grün = heute erledigt, ausgegraut wenn fertig
- Wochenübersicht zeigt: welche Tage waren Trainingstage, Physio-Fortschritt

### Physio-Logik
- Eigenes Wochen-Target pro Übung (konfigurierbar im Template, z.B. 5x/Woche)
- Fortschrittsanzeige: "3/5 diese Woche"
- Erscheint jeden Tag, egal ob Trainingstag oder nicht
- Wenn Wochen-Target erreicht → grün/erledigt

## Technische Umsetzung

### Phase 1: Datenbank-Änderungen
**Datei: `src/db/database.ts`**
- Neue Tabelle `trainingDays`: `{ id, weekId, date, createdAt }`
  - Ein Eintrag = dieser Tag ist Trainingstag (kein Boolean, Existenz = true)
- `WeeklyTemplateEntry` anpassen:
  - `scheduledDays` entfernen (nicht mehr nötig für Kraft)
  - `targetCount` bleibt NUR für Physio-Übungen relevant (Wochen-Target)
  - Für Kraft-Übungen wird `targetCount` ignoriert (immer 1x pro Trainingstag)
- DB Version bump (v2) mit Migration

**Datei: `src/db/hooks.ts`**
- Neue Hooks:
  - `useTrainingDays(weekId)` – gibt Trainingstage der Woche zurück
  - `useIsTrainingDay(date)` – ist heute ein Trainingstag?
  - `toggleTrainingDay(date, weekId)` – Toggle für heute
- Bestehende Hooks anpassen:
  - `useCompletions()` bleibt, wird aber anders genutzt
  - Completion-Logik: Für Kraft = pro Trainingstag, für Physio = pro Woche

### Phase 2: Scheduling-Logik vereinfachen
**Datei: `src/utils/schedule.ts`**
- Komplette Auto-Distribution-Logik entfernen (`buildScheduledDaysMap`, `computeBalancedAutoDays`)
- Neue Funktionen:
  - `categorizeTrainingDay()`: Kategorisiert Kraft-Übungen für Trainingstag-Ansicht
  - `categorizePhysio()`: Kategorisiert Physio-Übungen mit Wochen-Fortschritt
  - `getTrainingDayCount(weekId)`: Anzahl Trainingstage diese Woche
- `getWeekDayStats()` anpassen: Zeigt Trainingstage statt scheduled/completed per day

### Phase 3: Dashboard komplett neu
**Datei: `src/pages/Dashboard.tsx`**
- Trainingstag-Toggle prominent oben
- Konditionelle Anzeige:
  - **Toggle ON**: Kraft-Checkliste + Physio-Sektion
  - **Toggle OFF**: Nur Physio-Sektion
- Kraft-Übungen: Einfache Liste, jede 1x abhaken, grün wenn erledigt
- Physio-Übungen: Mit Wochen-Fortschritt (3/5), immer sichtbar
- Wochenübersicht einklappbar (default eingeklappt)
- kcal-Zusammenfassung kompakter

**Datei: `src/components/ExerciseCard.tsx`**
- Vereinfachen: Keine 7-Tage-Dots mehr
- Kraft-Modus: Einfacher Haken/nicht-Haken für heute
- Physio-Modus: Fortschrittsbalken (3/5 diese Woche)

**Datei: `src/components/WeekOverview.tsx`**
- Anpassen: Zeigt Trainingstage (💪) vs. normale Tage
- Physio-Fortschritt pro Tag optional

### Phase 4: Template-Seite anpassen
**Datei: `src/pages/Template.tsx`**
- Tages-Zuordnung (Mo-So) entfernen für Kraft
- Kraft-Übungen: Nur Reihenfolge + Pflicht/Optional
- Physio-Übungen: Wochen-Target editierbar (z.B. 5x/Woche)
- Klarere visuelle Trennung Kraft vs. Physio

### Phase 5: Stats anpassen
**Datei: `src/pages/Stats.tsx`**
- Trainingstage-Übersicht: "2 von _ Trainingstagen diese Woche"
- Kraft: Pro Übung – an wie vielen Trainingstagen erledigt
- Physio: Pro Übung – Wochen-Fortschritt vs. Target
- kcal-Übersicht bleibt

### Phase 6: Export/Import erweitern
**Datei: `src/db/export-import.ts`**
- `trainingDays`-Tabelle in Export/Import aufnehmen
- Version bump auf v2

## Entscheidungen & Notizen
- **Kein fixes Limit** für Trainingstage pro Woche – komplett flexibel
- **scheduledDays wird entfernt** – die Verteilung auf bestimmte Wochentage ist nicht mehr nötig, weil der Nutzer täglich entscheidet
- **targetCount semantik ändert sich**: Für Kraft wird es ignoriert (immer 1x/Trainingstag), für Physio bleibt es als Wochen-Target
- **Migration**: Bestehende Daten bleiben erhalten, scheduledDays wird einfach ignoriert
- **Cardio** bleibt wie gehabt (FAB zum Hinzufügen)

## Reihenfolge
1. DB-Änderungen + neue Hooks (Fundament)
2. Scheduling-Logik vereinfachen
3. Dashboard neu bauen (Hauptarbeit)
4. Template-Seite anpassen
5. Stats anpassen
6. Export/Import
7. Lint + Build + manuelle Tests
