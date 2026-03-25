// ===== STORAGE =====

function storageKey(year) { return `saiyan_tracker_${year}`; }
let fileHandle = null;

function loadEntriesForYear(year) {
    try { return JSON.parse(localStorage.getItem(storageKey(year)) || '[]'); }
    catch { return []; }
}

function loadEntries() {
    entries = loadEntriesForYear(currentYear);
}

function saveEntries() {
    localStorage.setItem(storageKey(currentYear), JSON.stringify(entries));
    setSaveStatus('saving', 'Salvataggio...');
    autoSaveToFile();
}

// ===== AUTO-SAVE FILE =====

function getAllData() {
    const allYears = {};
    for (let y = new Date().getFullYear() - 10; y <= new Date().getFullYear() + 5; y++) {
        const data = localStorage.getItem(storageKey(y));
        if (data) { try { allYears[y] = JSON.parse(data); } catch {} }
    }
    return {
        version: '1.0',
        app: 'saiyan-time-tracker',
        lastSaved: new Date().toISOString(),
        ferieTotal: FERIE_TOTAL,
        permessiTotal: PERMESSI_TOTAL,
        years: allYears,
        customHolidays: getCustomHolidays(),
        userName: getUserName()
    };
}

function setSaveStatus(state, text) {
    document.getElementById('saveDot').className = 'save-dot ' + state;
    document.getElementById('saveText').textContent = text;
}

function setSaved() {
    const now = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    setSaveStatus('ok', `Salvato alle ${now}`);
}

async function autoSaveToFile() {
    if (!window.showSaveFilePicker) { setSaved(); return; }
    if (!fileHandle) {
        try {
            fileHandle = await window.showSaveFilePicker({
                suggestedName: 'saiyan_tracker_data.json',
                types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }]
            });
        } catch (err) {
            if (err.name === 'AbortError') { setSaved(); return; }
            setSaveStatus('error', 'Errore collegamento file');
            return;
        }
    }
    try {
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(getAllData(), null, 2));
        await writable.close();
        setSaved();
    } catch (err) {
        console.warn('Auto-save fallito:', err);
        fileHandle = null;
        setSaveStatus('error', 'File perso — risalverà al prossimo cambio');
    }
}

async function tryAutoRestore() {
    if (!window.showOpenFilePicker) return;
    if (localStorage.getItem(storageKey(currentYear))) return;
    for (let y = new Date().getFullYear() - 10; y <= new Date().getFullYear() + 5; y++) {
        if (localStorage.getItem(storageKey(y))) return;
    }
    if (confirm('Nessun dato trovato. Vuoi ripristinare da un file di backup?')) {
        try {
            const [handle] = await window.showOpenFilePicker({
                types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }]
            });
            const file = await handle.getFile();
            const data = JSON.parse(await file.text());
            if (data.app === 'saiyan-time-tracker' && data.years) {
                Object.entries(data.years).forEach(([year, yearEntries]) => {
                    localStorage.setItem(storageKey(year), JSON.stringify(yearEntries));
                });
                if (data.customHolidays) localStorage.setItem('saiyan_custom_holidays', JSON.stringify(data.customHolidays));
                if (data.userName) setUserName(data.userName);
                fileHandle = handle;
                loadEntries();
                render();
                updateGreeting();
                setSaved();
                showToast('Dati ripristinati!', 'success');
            }
        } catch {}
    }
}

// ===== RIPORTO PERMESSI =====

function getPermessiCarryover(year) {
    const firstTrackedYear = getFirstTrackedYear();
    if (year <= firstTrackedYear) return 0;
    const prevEntries = loadEntriesForYear(year - 1);
    const prevUsed = prevEntries.filter(e => e.type === 'permessi').reduce((s, e) => s + e.hours, 0);
    const prevCarryover = getPermessiCarryover(year - 1);
    return (PERMESSI_TOTAL + prevCarryover) - prevUsed;
}

function getFirstTrackedYear() {
    const now = new Date().getFullYear();
    for (let y = now - 10; y <= now; y++) {
        if (localStorage.getItem(storageKey(y))) return y;
    }
    return currentYear;
}
