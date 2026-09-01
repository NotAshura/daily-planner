# Daily Planner

Eine lokale PWA für tägliche Checklisten, Time-Blocking, Notizen und Arbeitszeit-Erfassung.
React + TypeScript + Vite + Tailwind CSS v4.

## Features

### 1. Tägliche Checkliste

- Neue Aufgaben gelten standardmäßig **nur für den heutigen Tag**. Soll die Aufgabe jeden Tag erscheinen, im Detailfenster der Aufgabe *Als tägliche Aufgabe* ankreuzen.
- Eine Aufgabe nur für heute bleibt den ganzen Tag stehen, auch ohne Zeitblock und auch wenn das Häkchen wieder entfernt wird; am nächsten Tag ist sie weg.
- Aufgaben hinzufügen, umbenennen, löschen und abhaken.
- Klick auf eine Aufgabe öffnet ein Detailfenster mit **Notiz** (pro Tag) und **Kategorie**.
- Der Erledigt-Status wird pro Datum gespeichert, setzt sich also um Mitternacht automatisch zurück.
- Zusätzlich zu den wiederkehrenden Aufgaben erscheinen die für diesen Tag **vorgeplanten Termine** in der Liste, jeweils mit ihrer Startzeit.

### 2. Kalender / Time-Blocking

- **Heute-Tab**: Checkliste links, Tageskalender rechts. Aufgaben lassen sich direkt aus der Checkliste in den Tagesplan ziehen – ohne Tabwechsel. Der Kalender springt beim Öffnen auf die aktuelle Uhrzeit und zeigt eine Jetzt-Linie.
- **Kalender-Tab**: 7-Tage-Ansicht zum Vorplanen. Im Kalender einen Zeitraum aufziehen legt direkt einen neuen Termin an (Titel, Kategorie, optional als tägliche Aufgabe).
- Umschalter **Woche / Monat / Jahr**:
  - *Monat*: klassisches Kalenderraster von Montag bis Sonntag. Angebrochene Wochen werden mit den ausgegrauten Tagen des Vor- bzw. Folgemonats aufgefüllt, jeder Tag zeigt seine Termine als farbige Chips. Klick auf einen Tag öffnet dessen Woche, Klick auf einen Chip die Aufgabe.
  - *Jahr*: alle 12 Monate als Mini-Kalender, Punkte markieren verplante Tage. Klick auf einen Monatsnamen öffnet den Monat, Klick auf einen Tag dessen Woche.
  - Die Pfeile blättern je nach Ansicht um eine Woche, einen Monat oder ein Jahr, *Heute* springt zurück zum aktuellen Datum.
- Beide Ansichten arbeiten auf denselben Daten, sind also automatisch synchron.
- **Der Zeitblock ist die Aufgabe**: Titel und Farbe kommen aus der Aufgabe und sind im Block nicht separat änderbar.
- Block in der Mitte ziehen verschiebt (auch über Tagesgrenzen), an der Unterkante ziehen verlängert, Doppelklick öffnet die Aufgabe.
- Raster von 15 Minuten, 06:00–24:00, Maus und Touch.
- Ist die Aufgabe für den Tag erledigt, wird der Block ausgegraut und durchgestrichen.

### 3. Notizen

- Eigener Tab für **dauerhafte Notizen** – unabhängig von Tag und Datum, im Gegensatz zur Tagesnotiz einer Aufgabe.
- Übersicht wie die Checkliste: jede Notiz mit Überschrift, kurzer Vorschau und Zeitpunkt der letzten Änderung.
- Klick auf eine Überschrift öffnet die Notiz als ganzseitiges Dokument (ähnlich einer `.md`-Datei in Obsidian).
- **Markdown** wird unterstützt: `#`‑Überschriften, Aufzählungen und nummerierte Listen, Aufgabenboxen (`- [ ]` / `- [x]`), Zitate, Trennlinien, Codeblöcke sowie `**fett**`, `*kursiv*` und `` `Code` ``.
- Umschalten zwischen **Bearbeiten** und **Vorschau**; gespeichert wird laufend beim Tippen.
- Volltextsuche über Titel und Inhalt, Sortierung nach zuletzt bearbeitet.
- Notizen liegen wie alle anderen Daten lokal und sind in der JSON-Sicherung enthalten.
- Das Markdown wird zu React-Elementen gerendert, nicht zu HTML – Notizinhalte können also kein Markup einschleusen.

### 4. Arbeitszeit-Tracker

- Start / Pause / Fortsetzen / Stopp, Pausenzeit wird mitgezählt.
- Optionaler automatischer Abzug der Mittagspause (Länge und Schwelle einstellbar).
- Alle Einträge sind nachträglich in Datum, Von, Bis und Pause bearbeitbar; manuelle Einträge sind möglich.
- Auswertung für Tag, Woche, Monat sowie Urlaubs- und Krankheitstage des laufenden Jahres.
- Export als Excel-Arbeitsmappe (SpreadsheetML) mit den Blättern Zeiten, Abwesenheiten und Zusammenfassung.

### 5. Lernzeit

- Eigener Tab mit denselben Funktionen wie die Arbeitszeit: Timer, Pause, Zeitnachweis, Tages-/Wochen-/Monatsauswertung, Excel-Export.
- **Kein automatischer Pausenabzug** – abgezogen wird nur, was du selbst als Pause drückst.
- Eigene Datenablage, die Zeiten vermischen sich nicht mit der Arbeitszeit.
- Keine Urlaubs-/Krankheitstage, da es sich um private Lernzeit handelt.

### 6. Rahmenbedingungen

- **Desktop-App (Windows)**: als echte `.exe` mit eigenem Icon installierbar und an die Taskleiste anheftbar.
- **PWA**: installierbar auf Handy und Desktop, offlinefähig über Service Worker.
- **Dark Mode** und heller Modus.
- **Sprachumschalter Deutsch / Englisch.**
- Alle Daten liegen ausschließlich lokal im `localStorage` des Browsers.
- Sicherung: Einstellungen → Sicherung exportiert alle Daten als JSON und importiert sie wieder.

## Als Windows-App installieren (empfohlen)

```bash
npm install
npm run app:build
```

Danach liegen im Ordner `release/` zwei Varianten:

- **`Daily Planner Setup <version>.exe`** – Installer. Legt Startümenü- und Desktop-Verknüpfung an, die App lässt sich ganz normal per Rechtsklick an die Taskleiste anheften und erscheint dort mit eigenem Icon, nicht als Edge.
- **`DailyPlanner-portable.exe`** – läuft ohne Installation, einfach doppelklicken.

Zum schnellen Ausprobieren ohne Paketierung: `npm run app`.

Die Desktop-App braucht keinen laufenden Server. Sie lädt die gebauten Dateien über ein eigenes `app://`-Protokoll ([electron/main.cjs](electron/main.cjs)), funktioniert also komplett offline.

> Die Desktop-App hat einen **eigenen Datenspeicher**, getrennt vom Browser. Bestehende Einträge über Einstellungen › *Sicherung* aus dem Browser exportieren und in der App importieren.

Bricht `app:build` mit `EPERM: operation not permitted, rename ... win-unpacked.tmp` ab, hat der Virenscanner die frisch entpackten Dateien kurz gesperrt. `release/` löschen und den Befehl erneut ausführen.

## Automatische Updates

Die Desktop-App prüft 5 Sekunden nach dem Start und danach alle 6 Stunden, ob es eine neuere Version gibt. Gefunden heißt aber nicht installiert: In den **Einstellungen › Über** steht ein Knopf *Nach Updates suchen*. Findet er eine neue Version, erscheint *Update herunterladen* mit Fortschrittsanzeige und danach *Installieren & neu starten* – die App beendet sich, spielt das Update ein und startet neu. Schlägt die Prüfung fehl (kein Netz, kein Release), läuft die App normal weiter. Die aktuell installierte Version steht ebenfalls unter *Über*.

Im Browser und in der PWA ist der Bereich ausgeblendet, dort aktualisiert der Service Worker.

### Einmalig einrichten

Auto-Update ist **aktiv** und zeigt auf das öffentliche Repository `NotAshura/daily-planner`
(`build.publish` in [package.json](package.json), `AUTO_UPDATE_ENABLED` in [electron/main.cjs](electron/main.cjs)).
Fehlt das Repo noch, einmalig:

1. Mit dem **privaten** GitHub-Konto ein **öffentliches** Repository `daily-planner` anlegen.
2. Das Projekt hineinpushen:

   ```powershell
   git remote add origin https://github.com/NotAshura/daily-planner.git
   git push -u origin main
   ```

> **Warum öffentlich?** Nur bei einem öffentlichen Repo kommt die App ohne Zugangsdaten an die Releases. Für ein privates Repo müsste ein GitHub-Token in der App mitgeliefert werden – eine `.exe` lässt sich aber entpacken, das Token wäre für jeden lesbar. Öffentlich heißt dabei nur *lesbar*: Ändern kann das Repo weiterhin nur, wer als Collaborator eingetragen ist.
>
> Firmenkonten (Enterprise Managed Users) dürfen meist keine öffentlichen Repos anlegen, deshalb das private Konto verwenden.

Ohne Repo oder ohne Netz schlägt die Prüfung still fehl, die App läuft normal weiter.

### Neue Version veröffentlichen

```powershell
npm version patch        # 0.1.0 -> 0.1.1 (oder minor / major)
$env:GH_TOKEN = "..."    # Token nur im eigenen Terminal setzen, niemals ins Repo
npm run release
```

Das baut die App und lädt Installer, Portable-Exe und `latest.yml` als GitHub-Release hoch. `latest.yml` ist die Datei, an der die installierten Apps erkennen, dass es etwas Neues gibt – sie muss immer mit hochgeladen werden, deshalb `npm run release` statt manuellem Upload verwenden.

Die Versionsnummer **muss** vor jedem Release steigen, sonst erkennt keine installierte App das Update.

### Was nicht ins Repo gehört

- Das Token wird nur als Umgebungsvariable `GH_TOKEN` im eigenen Terminal gesetzt, nie in einer Datei. Es braucht lediglich `Contents: write` für dieses eine Repo und landet nicht im Paket – im gebauten Programm steckt nur die öffentliche Adresse des Repos.
- `.gitignore` schließt zusätzlich `.env`, `.env.*`, `*.pem`, `*.pfx` und `dev-app-update.yml` aus.
- Deine Einträge (Aufgaben, Notizen, Zeiten) liegen im `localStorage` bzw. im Benutzerprofil, nicht im Projektordner – ein Push veröffentlicht also keine persönlichen Daten. Ebenso wenig `release/`, `dist/` und `node_modules/`.

Freunde installieren die App über die `.exe` von der Releases-Seite und bekommen künftige Updates automatisch.

## Als PWA installieren

Der Service Worker ist im Dev-Server bewusst deaktiviert, die Installation funktioniert deshalb nur mit einem Produktionsbuild:

```bash
npm install
npm run build
npm run preview     # startet http://localhost:4173
```

- **Desktop (Chrome/Edge):** Seite öffnen, in der Adressleiste auf das Installations-Symbol klicken – alternativ Menü › *Apps* › *Diese Seite als App installieren*. Danach läuft die App in einem eigenen Fenster.
- **Android (Chrome):** Menü › *App installieren*.
- **iOS (Safari):** Teilen › *Zum Home-Bildschirm*.
- In den Einstellungen der App gibt es zusätzlich einen **App installieren**-Knopf, sobald der Browser die Installation anbietet.

`npm run preview` muss laufen, solange du die App benutzt. Soll sie dauerhaft ohne Terminal erreichbar sein, den Inhalt von `dist/` auf einen beliebigen statischen Webserver legen (z. B. GitHub Pages, Netlify, IIS). Nur über `http://localhost` oder `https://` ist eine PWA installierbar – ein Doppelklick auf `dist/index.html` funktioniert nicht.

Auf dem Desktop ist die PWA aus `localhost` unpraktisch: Sie braucht den laufenden `preview`-Server und Windows führt sie weiter unter der Identität des Browsers. Für eine eigenständige App auf dem Rechner deshalb den Electron-Build oben verwenden; die PWA ist vor allem für das Handy gedacht.

## Auf einen anderen Rechner umziehen

1. Ordner kopieren – `node_modules/`, `dist/`, `dev-dist/` und `release/` können weggelassen werden.
2. Auf dem Zielrechner **Node.js ≥ 20.19** installieren.
3. Im Projektordner `npm ci` ausführen. Das installiert exakt die Versionen aus `package-lock.json`, dadurch gibt es keine Versionsunterschiede zwischen den Rechnern.
4. `npm run app:build` – fertig, die `.exe` liegt in `release/`.

Alternativ reicht es, die fertige `DailyPlanner-portable.exe` auf den anderen Rechner zu kopieren. Dann braucht es dort weder Node.js noch den Projektordner.

## Entwicklung

```bash
npm install      # oder npm ci für exakt die Versionen aus package-lock.json
npm run dev      # Entwicklungsserver
npm run build    # Typprüfung + Produktionsbuild
npm run preview  # Produktionsbuild lokal testen (inkl. Service Worker)
npm run app      # Build + Desktop-App starten
npm run app:build# Windows-Installer und Portable-Exe nach release/ bauen
npm run release  # Build + Veröffentlichung als GitHub-Release
npm run lint     # ESLint
npm run icons    # Icons aus public/app-icon.svg neu generieren
```

Voraussetzung: Node.js ≥ 20.19.

**Wichtig:** Deine Einträge liegen im `localStorage`, nicht im Projektordner. Sie ziehen also nicht mit einer Ordnerkopie um. Dafür in den Einstellungen › *Sicherung* die Daten als JSON exportieren und am Zielort wieder importieren.

Die TypeScript-Version ist bewusst auf `~6.0.x` festgenagelt: `typescript-eslint` unterstützt TypeScript 7 noch nicht, ein Upgrade würde `npm run lint` brechen.

Der Service Worker ist im Dev-Server bewusst deaktiviert. Zum Testen der
Installierbarkeit `npm run build` und anschließend `npm run preview` verwenden.

## Projektstruktur

```
electron/
  main.cjs                   Desktop-Fenster, lädt dist/ über app://
  preload.cjs                Brücke für Update-Prüfung (nur diese vier Aufrufe)
scripts/
  generate-icons.mjs         Icons aus public/app-icon.svg
src/
  App.tsx                    App-Shell, Zustand und Navigation
  types.ts                   Datenmodell
  i18n.ts                    Übersetzungen (de/en)
  lib/
    date.ts                  Datums- und Zeit-Hilfsfunktionen
    storage.ts               localStorage-gebundener State
    excel.ts                 Excel-Export (SpreadsheetML)
    worktime.ts              Netto-Arbeitszeit eines Eintrags
    categories.ts            Kategorien und Farben
    markdown.tsx             Markdown-Renderer für die Notizen
  components/
    Sidebar.tsx              Navigation (Seitenleiste / Bottom-Bar)
    TodayPage.tsx            Heute: Checkliste + Tageskalender
    DailyChecklist.tsx       Tägliche Checkliste
    TaskModal.tsx            Detailfenster einer Aufgabe
    NewAppointmentDialog.tsx Termin aus einem aufgezogenen Zeitraum anlegen
    WeeklyPlanner.tsx        Kalender-Tab mit Wochen-, Monats- und Jahresansicht
    MonthGrid.tsx            Monatsraster mit Terminen
    YearGrid.tsx             Jahresübersicht mit 12 Mini-Monaten
    NotesPage.tsx            Dauerhafte Notizen (Übersicht + Editor)
    TimeTracker.tsx          Timer, Zeitnachweis, Export (Arbeits- und Lernzeit)
    SettingsPage.tsx         Einstellungen
    calendar/
      useCalendarDrag.ts     Pointer-Drag für Anlegen, Verschieben, Verlängern
      CalendarGrid.tsx       Stundenraster mit Tagesspalten und Blöcken
      DragGhost.tsx          Vorschau am Mauszeiger beim Ziehen
```

## Lizenz

[MIT](LICENSE) – nutzen, ändern und weitergeben erlaubt, ohne Gewährleistung.
