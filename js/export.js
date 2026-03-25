// ===== EXPORT =====

function exportCSV() {
    if (entries.length === 0) { showToast('Nessun dato da esportare', 'info'); return; }
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    const userName = getUserName();
    let csv = userName ? `Tracker di: ${userName}\n\n` : '';
    csv += 'Data,Tipo,Ore,Note\n';
    sorted.forEach(e => {
        csv += `${e.date},${e.type},${e.hours},"${(e.note || '').replace(/"/g, '""')}"\n`;
    });

    const ferieUsed = entries.filter(e => e.type === 'ferie').reduce((s, e) => s + e.hours, 0);
    const permessiUsed = entries.filter(e => e.type === 'permessi').reduce((s, e) => s + e.hours, 0);
    const carryover = getPermessiCarryover(currentYear);
    const permessiTotal = PERMESSI_TOTAL + carryover;
    csv += `\nRiepilogo ${currentYear}\n`;
    csv += `Ferie usate,${ferieUsed}h su ${FERIE_TOTAL}h,Rimanenti: ${FERIE_TOTAL - ferieUsed}h,Scadono il 31/12/${currentYear}\n`;
    csv += `Permessi usati,${permessiUsed}h su ${permessiTotal}h,Rimanenti: ${permessiTotal - permessiUsed}h\n`;
    if (carryover > 0) csv += `Riporto da ${currentYear - 1},${carryover}h\n`;

    download(`ferie_permessi_${currentYear}.csv`, csv, 'text/csv');
    showToast('CSV esportato!', 'success');
}

// ===== IMPORT =====

function importFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result.trim();
        if (file.name.endsWith('.json')) importJSON(text);
        else if (file.name.endsWith('.csv')) importCSV(text);
        else showToast('Formato non supportato. Usa CSV o JSON.', 'info');
    };
    reader.readAsText(file);
    event.target.value = '';
}

function importJSON(text) {
    try {
        const data = JSON.parse(text);
        if (data.app === 'saiyan-time-tracker' && data.years) {
            Object.entries(data.years).forEach(([year, yearEntries]) => {
                localStorage.setItem(storageKey(year), JSON.stringify(yearEntries));
            });
            if (data.customHolidays) localStorage.setItem('saiyan_custom_holidays', JSON.stringify(data.customHolidays));
            if (data.userName) { setUserName(data.userName); updateGreeting(); }
            loadEntries(); render();
            showToast('Dati ripristinati da backup!', 'success');
        } else if (data.entries && Array.isArray(data.entries)) {
            if (data.year) currentYear = data.year;
            entries = data.entries;
            saveEntries(); render();
            showToast(`Importati ${entries.length} inserimenti!`, 'success');
        } else {
            showToast('File JSON non riconosciuto', 'info');
        }
    } catch { showToast('Errore nel file JSON', 'info'); }
}

function importCSV(text) {
    try {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l);
        const nameLine = lines.find(l => l.toLowerCase().startsWith('tracker di:'));
        if (nameLine) {
            const name = nameLine.replace(/^tracker di:\s*/i, '').trim();
            if (name && !getUserName()) { setUserName(name); updateGreeting(); }
        }
        const headerIdx = lines.findIndex(l => l.toLowerCase().startsWith('data,tipo,ore'));
        if (headerIdx < 0) { showToast('CSV non riconosciuto. Serve: Data,Tipo,Ore,Note', 'info'); return; }

        const imported = [];
        for (let i = headerIdx + 1; i < lines.length; i++) {
            const line = lines[i];
            if (line.toLowerCase().startsWith('riepilogo') || line === '') break;
            const match = line.match(/^(\d{4}-\d{2}-\d{2}),(ferie|permessi),(\d+),(.*)$/i);
            if (!match) continue;
            const [, date, type, hours, noteRaw] = match;
            const note = noteRaw.replace(/^"|"$/g, '').replace(/""/g, '"').trim();
            const year = parseInt(date.split('-')[0]);
            if (year !== currentYear) {
                currentYear = year;
                document.getElementById('yearDisplay').textContent = currentYear;
            }
            imported.push({
                id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
                type: type.toLowerCase(), date, hours: parseInt(hours), note
            });
        }
        if (imported.length === 0) { showToast('Nessun dato trovato nel CSV', 'info'); return; }

        loadEntries();
        let added = 0, updated = 0;
        imported.forEach(imp => {
            const existing = entries.find(e => e.date === imp.date && e.type === imp.type);
            if (existing) { existing.hours = imp.hours; existing.note = imp.note; updated++; }
            else { entries.push(imp); added++; }
        });
        saveEntries(); render();
        const parts = [];
        if (added) parts.push(`${added} aggiunti`);
        if (updated) parts.push(`${updated} aggiornati`);
        showToast(`CSV importato: ${parts.join(', ')}`, 'success');
    } catch { showToast('Errore nella lettura del CSV', 'info'); }
}
