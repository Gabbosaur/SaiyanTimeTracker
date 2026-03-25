# ⚡ Saiyan Time Tracker

Dashboard per tracciare ferie e permessi. Tema Saiyan. Zero dipendenze.

## Quick Start

Apri `index.html` nel browser (Chrome/Edge consigliato per auto-save su file).

## Funzionalità

**Calendario annuale** — 12 mesi, navigabile per anno. Click su un giorno per aggiungere ferie/permessi. Drag per selezionare più giorni.

**Budget ore**
- Ferie: 160h/anno (20 giorni). Scadono il 31/12, non si riportano.
- Permessi: 112h/anno (14 giorni). Le ore non usate si riportano all'anno successivo. Se sfori, il debito si sottrae dall'anno dopo.

**Festività** — Tutte le festività nazionali italiane + Pasquetta (calcolata automaticamente). Puoi aggiungere feste locali (es. Santo Patrono) dal bottone "+ Feste locali".

**Salvataggio**
- Automatico in `localStorage` ad ogni modifica.
- Auto-save su file JSON (Chrome/Edge): al primo salvataggio chiede dove creare il file, poi salva in background. Indicatore in alto a destra.
- Se cancelli i dati del browser, all'apertura propone il ripristino dal file.

**Export/Import**
- `Esporta CSV`: genera un file CSV con tutti i dati dell'anno + riepilogo. Apribile in Excel.
- `Importa`: accetta sia CSV (esportato dall'app) che JSON (backup). Riconosce il formato automaticamente.

**Profilo** — Al primo accesso chiede il nome. Saluto personalizzato in base all'ora. Il nome è incluso nei backup e nell'export CSV.

## Struttura progetto

```
index.html          → Markup HTML
css/style.css       → Stili + animazioni + responsive
js/app.js           → Init, stato globale, navigazione anno
js/utils.js         → Funzioni utility (formattazione, toast, download)
js/storage.js       → localStorage, auto-save file, riporto permessi
js/profile.js       → Nome utente, saluto
js/holidays.js      → Festività nazionali, Pasquetta, feste locali
js/stats.js         → Stat card, barre progresso, floating stats
js/calendar.js      → Rendering calendario, drag-select
js/modal.js         → Modal inserimento/modifica, multi-date
js/export.js        → Export CSV, import CSV/JSON
```

## Requisiti

Un browser moderno. Chrome o Edge per l'auto-save su file (File System Access API).

## Personalizzazione

- Ore ferie/permessi: modifica `FERIE_TOTAL` e `PERMESSI_TOTAL` in `js/app.js`
- Colori tema: modifica le variabili CSS in `:root` in `css/style.css`
- Festività fisse: modifica l'array `fixed` in `js/holidays.js`
