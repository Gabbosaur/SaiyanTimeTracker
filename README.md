# ⚡ Saiyan Time Tracker

**Your PTO hours. Your rules. Dragon Ball Z aesthetics.**

A zero-dependency, client-side dashboard to track vacation days and personal leave — built for workers who get a fixed annual hour budget and want a dead-simple way to see what's left.

> 🇮🇹 **Built for the Italian employment system** — where employees typically receive 160h/year of *ferie* (vacation) and 112h/year of *permessi* (paid personal leave / ROL). Holidays, carryover rules, and defaults reflect Italian labor norms. That said, the budget is fully configurable, so it can work for anyone with a fixed-hour PTO model.

---

## Why this exists

Corporate HR portals are slow, confusing, and never open when you need them. Spreadsheets get messy. This app gives you a single glance at your remaining hours, a calendar to plan ahead, and zero friction to log time off.

Also: it looks cool.

---

## Features

🗓 **Annual calendar** — 12-month grid, click or drag-select multiple days, instant visual feedback.

📊 **Live budget tracking** — Progress bars, remaining hours, floating stats that follow you as you scroll.

⚙️ **Flexible budget settings** — Three modes:
- **Standard** — Full annual budget (160h + 112h)
- **Pro-rata (automatic)** — Enter your hire date, get your proportional budget calculated transparently
- **Manual** — Type your exact hours. No arguments with HR.

🎌 **Italian holidays built-in** — All national holidays + Easter Monday (algorithmically computed). Add local holidays (patron saint day, etc.) with one click.

🔄 **Permessi carryover** — Unused personal leave hours roll over to the next year automatically. Overspending creates debt. Multi-year chains handled.

💾 **Auto-save** — localStorage by default. On Chrome/Edge, optionally syncs to a local JSON file via File System Access API. Restore from backup if you clear browser data.

📥 **Export / Import** — CSV (Excel-friendly) or JSON backup. Import recognizes both formats automatically.

🏆 **Easter eggs** — Konami code, Shenron, achievements. Because why not.

---

## Quick Start

Open `index.html` in your browser. That's it. No build step, no server, no dependencies.

> Chrome or Edge recommended for the auto-save-to-file feature.

---

## Who is this for?

- Italian employees (or anyone with a fixed annual PTO hour budget)
- People who joined mid-year and need pro-rata calculations
- Anyone tired of checking the HR portal just to know how many days they have left
- Dragon Ball fans who want their time tracker to have an aura

---

## Tech

Pure HTML + CSS + vanilla JS. No frameworks, no bundler, no npm. Opens from the filesystem, works offline, runs forever.

---

## Customization

| What | Where |
|------|-------|
| Default hours (ferie/permessi) | `js/utils.js` → `FERIE_TOTAL`, `PERMESSI_TOTAL` |
| Theme colors | `css/style.css` → `:root` variables |
| National holidays | `js/holidays.js` → `fixed` array |
| Budget mode | In-app: click ⚙️ Budget |

---

## Project Structure

```
index.html        → Markup
css/style.css     → Styles + animations + responsive
js/utils.js       → Constants, date formatting, toast, download
js/profile.js     → User name, greeting
js/holidays.js    → National holidays, Easter Monday, custom holidays
js/budget.js      → Budget calculation (pro-rata, manual, standard)
js/storage.js     → localStorage, file auto-save, permessi carryover
js/stats.js       → Stat cards, progress bars, floating stats
js/calendar.js    → Calendar rendering, drag-select
js/modal.js       → Entry create/edit/delete, multi-date
js/export.js      → CSV export, CSV/JSON import
js/easter-eggs.js → Konami code, Shenron, achievements
js/app.js         → Init, global state, year navigation, tabs
```

---

## License

Do whatever you want with it. Track your time off. Go Super Saiyan.
