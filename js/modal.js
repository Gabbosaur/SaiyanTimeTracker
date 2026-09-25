// ===== MODAL =====

let multiDates = [];

// Stato selezione fascia oraria (per permessi) — multi-range con Ctrl
let timeSelectedCells = new Set(); // indici celle selezionate
let timeDragging = false;
let timeDragAnchor = 0;
let timeCtrlMode = false; // true = aggiunge range, false = sostituisce

function renderTimeStrip() {
    const strip = document.getElementById('timeStrip');
    const startH = getWorkStartHour();
    const dayH = getWorkDayHours();
    let html = '';
    for (let i = 0; i < dayH; i++) {
        const from = startH + i;
        html += `<div class="time-cell" data-idx="${i}" title="${fmtHour(from)} → ${fmtHour(from + 1)}"><span>${from}</span></div>`;
    }
    strip.innerHTML = html;
    strip.style.gridTemplateColumns = `repeat(${dayH}, 1fr)`;
    highlightTimeStrip();
}

function highlightTimeStrip() {
    const cells = document.querySelectorAll('#timeStrip .time-cell');
    cells.forEach((cell, i) => {
        cell.classList.toggle('selected', timeSelectedCells.has(i));
    });
    updateTimeRangeLabel();
}

function updateTimeRangeLabel() {
    const startH = getWorkStartHour();
    const label = document.getElementById('timeRangeLabel');
    const totalHours = timeSelectedCells.size;

    if (totalHours === 0) {
        if (label) label.textContent = '';
        return;
    }

    // Raggruppa in ranges contigui per il label
    const ranges = getTimeRanges();
    const parts = ranges.map(r => `${fmtHour(startH + r.start)}→${fmtHour(startH + r.start + r.dur)}`);
    if (label) label.textContent = `${parts.join(', ')} (${totalHours}h)`;

    // Sincronizza il campo ore hidden SOLO per i permessi (le ferie restano 8h)
    if (selectedType === 'permessi') {
        const hoursEl = document.getElementById('entryHours');
        if (hoursEl) hoursEl.value = String(totalHours);
    }
    if (multiDates.length > 0) updateBudgetPreview();
}

// Ritorna array di {start, dur} — ranges contigui dagli indici selezionati
function getTimeRanges() {
    if (timeSelectedCells.size === 0) return [];
    const sorted = [...timeSelectedCells].sort((a, b) => a - b);
    const ranges = [];
    let rStart = sorted[0], rEnd = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] === rEnd + 1) {
            rEnd = sorted[i];
        } else {
            ranges.push({ start: rStart, dur: rEnd - rStart + 1 });
            rStart = sorted[i];
            rEnd = sorted[i];
        }
    }
    ranges.push({ start: rStart, dur: rEnd - rStart + 1 });
    return ranges;
}

function setTimeSelection(startIdx, dur) {
    const dayH = getWorkDayHours();
    timeSelectedCells.clear();
    const s = Math.max(0, Math.min(startIdx, dayH - 1));
    const d = Math.max(1, Math.min(dur, dayH - s));
    for (let i = s; i < s + d; i++) timeSelectedCells.add(i);
    highlightTimeStrip();
}

function addTimeRange(startIdx, dur) {
    const dayH = getWorkDayHours();
    const s = Math.max(0, Math.min(startIdx, dayH - 1));
    const d = Math.max(1, Math.min(dur, dayH - s));
    for (let i = s; i < s + d; i++) timeSelectedCells.add(i);
    highlightTimeStrip();
}

// Drag sulla striscia oraria (con supporto Ctrl per multi-range)
document.addEventListener('mousedown', e => {
    const cell = e.target.closest('#timeStrip .time-cell');
    if (!cell) return;
    e.preventDefault();
    timeDragging = true;
    timeCtrlMode = e.ctrlKey || e.metaKey;
    timeDragAnchor = parseInt(cell.dataset.idx);
    if (!timeCtrlMode) {
        timeSelectedCells.clear();
        timeSelectedCells.add(timeDragAnchor);
    } else {
        // Ctrl+click: toggle della cella
        if (timeSelectedCells.has(timeDragAnchor)) {
            timeSelectedCells.delete(timeDragAnchor);
        } else {
            timeSelectedCells.add(timeDragAnchor);
        }
    }
    highlightTimeStrip();
});

document.addEventListener('mousemove', e => {
    if (!timeDragging) return;
    const cell = e.target.closest('#timeStrip .time-cell');
    if (!cell) return;
    const idx = parseInt(cell.dataset.idx);
    const start = Math.min(timeDragAnchor, idx);
    const end = Math.max(timeDragAnchor, idx);
    if (!timeCtrlMode) {
        timeSelectedCells.clear();
    }
    for (let i = start; i <= end; i++) timeSelectedCells.add(i);
    highlightTimeStrip();
});

document.addEventListener('mouseup', () => { timeDragging = false; });

// Supporto touch
document.addEventListener('touchstart', e => {
    const cell = e.target.closest('#timeStrip .time-cell');
    if (!cell) return;
    timeDragging = true;
    timeCtrlMode = false;
    timeDragAnchor = parseInt(cell.dataset.idx);
    timeSelectedCells.clear();
    timeSelectedCells.add(timeDragAnchor);
    highlightTimeStrip();
}, { passive: true });

document.addEventListener('touchmove', e => {
    if (!timeDragging) return;
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const cell = el && el.closest('#timeStrip .time-cell');
    if (!cell) return;
    const idx = parseInt(cell.dataset.idx);
    const start = Math.min(timeDragAnchor, idx);
    const end = Math.max(timeDragAnchor, idx);
    timeSelectedCells.clear();
    for (let i = start; i <= end; i++) timeSelectedCells.add(i);
    highlightTimeStrip();
}, { passive: true });

document.addEventListener('touchend', () => { timeDragging = false; });

function openModal(dateStr) {
    editingId = null;
    selectedType = 'ferie';
    document.getElementById('modalTitle').textContent = 'Nuovo Inserimento';
    document.getElementById('entryDate').value = dateStr || todayStr();
    document.getElementById('entryHours').value = '8';
    document.getElementById('entryHours').disabled = true;
    document.getElementById('entryNote').value = '';
    document.getElementById('entryNote').placeholder = 'es. Vacanza al mare, viaggio, riposo...';
    document.getElementById('deleteAction').style.display = 'none';
    document.getElementById('saveBtn').textContent = 'Salva';
    setTimeSelection(0, 2);
    renderTimeStrip();
    updateTypeButtons();
    updateHoursUI();
    document.getElementById('modalOverlay').classList.add('active');
}

function editEntry(id) {
    // Blocca la modifica se l'entry è in fase di eliminazione
    if (pendingDeleteId === id) return;
    const entry = entries.find(e => e.id === id);
    if (!entry) return;
    editingId = id;
    selectedType = entry.type;
    document.getElementById('modalTitle').textContent = 'Modifica Inserimento';
    document.getElementById('entryDate').value = entry.date;
    document.getElementById('entryHours').value = String(entry.hours);
    document.getElementById('entryHours').disabled = entry.type === 'ferie';
    document.getElementById('entryNote').value = entry.note || '';
    document.getElementById('entryNote').placeholder = entry.type === 'ferie'
        ? 'es. Vacanza al mare, viaggio, riposo...'
        : 'es. Visita medica, appuntamento, pratica...';
    document.getElementById('deleteAction').style.display = 'flex';
    document.getElementById('saveBtn').textContent = 'Aggiorna';
    // Ripristina fascia oraria dal permesso (supporta timeRanges e vecchio startHour)
    timeSelectedCells.clear();
    if (entry.timeRanges && entry.timeRanges.length > 0) {
        const wsH = getWorkStartHour();
        entry.timeRanges.forEach(r => {
            const startIdx = r.start - wsH;
            for (let i = startIdx; i < startIdx + r.dur; i++) timeSelectedCells.add(i);
        });
    } else {
        const startIdx = (entry.startHour != null ? entry.startHour : getWorkStartHour()) - getWorkStartHour();
        for (let i = startIdx; i < startIdx + entry.hours; i++) timeSelectedCells.add(i);
    }
    renderTimeStrip();
    updateTypeButtons();
    updateHoursUI();
    document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
    document.getElementById('entryDate').disabled = false;
    document.getElementById('entryHours').disabled = false;
    document.getElementById('modalBudget').style.display = 'none';
    multiDates = [];
}

function closeModalOutside(e) {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
}

function selectType(type) {
    selectedType = type;
    updateTypeButtons();
    const hoursEl = document.getElementById('entryHours');
    const noteEl = document.getElementById('entryNote');
    if (type === 'ferie') {
        hoursEl.value = '8';
        hoursEl.disabled = true;
        noteEl.placeholder = 'es. Vacanza al mare, viaggio, riposo...';
    } else {
        hoursEl.disabled = false;
        noteEl.placeholder = 'es. Visita medica, appuntamento, pratica...';
    }
    updateHoursUI();
    if (multiDates.length > 0) updateBudgetPreview();
}

// Mostra il dropdown ore (ferie / multi-date) o la striscia oraria (permesso singolo)
function updateHoursUI() {
    const hoursGroup = document.getElementById('hoursGroup');
    const timeRangeGroup = document.getElementById('timeRangeGroup');
    const useTimeStrip = selectedType === 'permessi' && multiDates.length === 0;
    hoursGroup.style.display = useTimeStrip ? 'none' : 'block';
    timeRangeGroup.style.display = useTimeStrip ? 'block' : 'none';
    if (useTimeStrip) {
        renderTimeStrip();
    }
}

function updateTypeButtons() {
    document.getElementById('typeFerie').classList.toggle('selected', selectedType === 'ferie');
    document.getElementById('typePermessi').classList.toggle('selected', selectedType === 'permessi');
}

// ===== MULTI-DATE MODAL =====

function openModalMulti(dates) {
    editingId = null;
    multiDates = dates;
    selectedType = 'ferie';
    const from = formatDateDisplay(dates[0]);
    const to = formatDateDisplay(dates[dates.length - 1]);
    document.getElementById('modalTitle').textContent = `${dates.length} giorni: ${from} → ${to}`;
    document.getElementById('entryDate').value = dates[0];
    document.getElementById('entryDate').disabled = true;
    document.getElementById('entryHours').value = '8';
    document.getElementById('entryHours').disabled = true;
    document.getElementById('entryNote').value = '';
    document.getElementById('entryNote').placeholder = 'es. Vacanza al mare, viaggio, riposo...';
    document.getElementById('deleteAction').style.display = 'none';
    document.getElementById('saveBtn').textContent = `Salva ${dates.length} giorni`;
    document.getElementById('modalBudget').style.display = 'block';
    updateTypeButtons();
    updateHoursUI();
    updateBudgetPreview();
    document.getElementById('modalOverlay').classList.add('active');
}

function updateBudgetPreview() {
    const budgetEl = document.getElementById('modalBudget');
    if (multiDates.length === 0) { budgetEl.style.display = 'none'; return; }
    const ferieUsed = entries.filter(e => e.type === 'ferie').reduce((s, e) => s + e.hours, 0);
    const permessiUsed = entries.filter(e => e.type === 'permessi').reduce((s, e) => s + e.hours, 0);
    const carryover = getPermessiCarryover(currentYear);
    const ferieCarryover = getFerieCarryover(currentYear);
    const ferieRemaining = (getEffectiveFerieTotal(currentYear) + ferieCarryover) - ferieUsed;
    const permessiRemaining = (getEffectivePermessiTotal(currentYear) + carryover) - permessiUsed;
    document.getElementById('budgetFerie').textContent = `${ferieRemaining}h`;
    document.getElementById('budgetPermessi').textContent = `${permessiRemaining}h`;

    const hours = parseInt(document.getElementById('entryHours').value) || 8;
    const totalCost = multiDates.length * hours;
    const remaining = selectedType === 'ferie' ? ferieRemaining : permessiRemaining;
    const after = remaining - totalCost;
    const icon = selectedType === 'ferie' ? '🔥' : '⚡';
    const previewEl = document.getElementById('budgetPreview');
    previewEl.style.color = after < 0 ? '#FF5555' : 'var(--saiyan-gold)';
    previewEl.textContent = after < 0
        ? `${icon} ${totalCost}h richieste → sfori di ${Math.abs(after)}h!`
        : `${icon} ${totalCost}h richieste → restano ${after}h`;
}

// ===== SAVE / DELETE =====

function saveEntry() {
    let hours = parseInt(document.getElementById('entryHours').value);
    const note = document.getElementById('entryNote').value.trim();
    const useTimeStrip = selectedType === 'permessi' && multiDates.length === 0;
    // Per permesso singolo: calcola ore e ranges dalla selezione
    let timeRanges = null;
    let startHour = null;
    if (useTimeStrip) {
        const ranges = getTimeRanges();
        const wsH = getWorkStartHour();
        timeRanges = ranges.map(r => ({ start: wsH + r.start, dur: r.dur }));
        hours = timeSelectedCells.size;
        startHour = timeRanges.length > 0 ? timeRanges[0].start : wsH;
    }

    if (multiDates.length > 0) {
        let added = 0;
        multiDates.forEach(dateStr => {
            const existing = entries.find(e => e.date === dateStr && e.type === selectedType);
            if (existing) { existing.hours = hours; existing.note = note; }
            else {
                entries.push({
                    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6) + Math.random().toString(36).slice(2, 4),
                    type: selectedType, date: dateStr, hours, note
                });
                added++;
            }
        });
        const updated = multiDates.length - added;
        const parts = [];
        if (added) parts.push(`${added} aggiunti`);
        if (updated) parts.push(`${updated} aggiornati`);
        showToast(parts.join(', '), 'success');
        multiDates = [];
        document.getElementById('entryDate').disabled = false;
        saveEntries(); closeModal(); render();
        return;
    }

    const date = document.getElementById('entryDate').value;
    if (!date) { showToast('Seleziona una data', 'info'); return; }
    if (parseInt(date.split('-')[0]) !== currentYear) {
        showToast(`La data deve essere nel ${currentYear}`, 'info'); return;
    }

    if (editingId) {
        const idx = entries.findIndex(e => e.id === editingId);
        if (idx >= 0) {
            const updated = { ...entries[idx], type: selectedType, date, hours, note };
            if (selectedType === 'permessi' && timeRanges) {
                updated.startHour = startHour;
                updated.timeRanges = timeRanges;
            } else {
                delete updated.startHour;
                delete updated.timeRanges;
            }
            entries[idx] = updated;
        }
        showToast('Aggiornato!', 'success');
    } else {
        const entry = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            type: selectedType, date, hours, note
        };
        if (selectedType === 'permessi' && timeRanges) {
            entry.startHour = startHour;
            entry.timeRanges = timeRanges;
        }
        entries.push(entry);
        showToast('Aggiunto!', 'success');
    }
    saveEntries(); closeModal(); render();
}

function deleteEntry() {
    if (!editingId) return;
    const id = editingId;
    closeModal();
    performDeleteWithUndo(id);
}

function quickDelete(id) {
    // Blocca se è già in eliminazione
    if (pendingDeleteId === id) return;
    performDeleteWithUndo(id);
}

// Elimina con possibilità di annullare per 5 secondi
let pendingDeleteId = null;

function performDeleteWithUndo(id) {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;

    // Marca gli elementi come "in eliminazione" senza ri-renderizzare tutto
    pendingDeleteId = id;
    setPendingDeleteClass(id, entry.date, true);

    const label = entry.type === 'ferie' ? 'Ferie' : 'Permesso';
    showUndoToast(
        `${label} in eliminazione`,
        () => {
            // UNDO: togli solo la classe, nessun re-render
            setPendingDeleteClass(id, entry.date, false);
            pendingDeleteId = null;
            showToast('Ripristinato', 'success');
        },
        () => {
            // COMMIT: rimuovi l'entry con update mirato del DOM (niente full render)
            if (pendingDeleteId) {
                const removedId = pendingDeleteId;
                const removed = entries.find(e => e.id === removedId);
                entries = entries.filter(e => e.id !== removedId);
                pendingDeleteId = null;
                saveEntries();
                removeEntryFromDOM(removedId, removed ? removed.date : null);
                // Aggiorna solo statistiche e badge (operazioni leggere)
                updateStats();
                updateFloatingStats();
            }
        }
    );
}

// Rimuove dal DOM la riga del registro e aggiorna la cella del calendario
// senza ricostruire l'intero calendario
function removeEntryFromDOM(id, dateStr) {
    // Rimuovi la riga dal registro con una piccola animazione di uscita
    document.querySelectorAll(`.entry-item[data-entry-id="${id}"]`).forEach(item => {
        item.style.transition = 'opacity 0.2s, transform 0.2s';
        item.style.opacity = '0';
        item.style.transform = 'translateX(-10px)';
        setTimeout(() => item.remove(), 200);
    });
    // Se il registro resta vuoto, mostra il placeholder
    setTimeout(() => {
        const list = document.getElementById('entriesList');
        if (list && list.querySelectorAll('.entry-item').length === 0) {
            list.innerHTML = '<div class="no-entries">Nessun inserimento per il ' + currentYear + '. Clicca su un giorno o usa il pulsante "Aggiungi".</div>';
        }
    }, 210);

    // Aggiorna solo la cella del calendario interessata
    if (dateStr) refreshCalendarDay(dateStr);
}

// Aggiunge/rimuove la classe pending-delete sugli elementi già nel DOM
function setPendingDeleteClass(id, dateStr, on) {
    const dayEl = document.querySelector(`.day[data-date="${dateStr}"]`);
    if (dayEl) dayEl.classList.toggle('pending-delete', on);
    document.querySelectorAll(`.entry-item[data-entry-id="${id}"]`).forEach(item => {
        item.classList.toggle('pending-delete', on);
        // Disabilita i bottoni di modifica/elimina della riga
        item.querySelectorAll('.entry-delete').forEach(btn => { btn.disabled = on; });
    });
}
