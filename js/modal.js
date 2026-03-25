// ===== MODAL =====

let multiDates = [];

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
    updateTypeButtons();
    document.getElementById('modalOverlay').classList.add('active');
}

function editEntry(id) {
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
    updateTypeButtons();
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
        if (!editingId) {
            hoursEl.value = '1';
        }
        noteEl.placeholder = 'es. Visita medica, appuntamento, pratica...';
    }
    if (multiDates.length > 0) updateBudgetPreview();
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
    updateBudgetPreview();
    document.getElementById('modalOverlay').classList.add('active');
}

function updateBudgetPreview() {
    const budgetEl = document.getElementById('modalBudget');
    if (multiDates.length === 0) { budgetEl.style.display = 'none'; return; }
    const ferieUsed = entries.filter(e => e.type === 'ferie').reduce((s, e) => s + e.hours, 0);
    const permessiUsed = entries.filter(e => e.type === 'permessi').reduce((s, e) => s + e.hours, 0);
    const carryover = getPermessiCarryover(currentYear);
    const ferieRemaining = FERIE_TOTAL - ferieUsed;
    const permessiRemaining = (PERMESSI_TOTAL + carryover) - permessiUsed;
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
    const hours = parseInt(document.getElementById('entryHours').value);
    const note = document.getElementById('entryNote').value.trim();

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
        if (idx >= 0) entries[idx] = { ...entries[idx], type: selectedType, date, hours, note };
        showToast('Aggiornato!', 'success');
    } else {
        entries.push({
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            type: selectedType, date, hours, note
        });
        showToast('Aggiunto!', 'success');
    }
    saveEntries(); closeModal(); render();
}

function deleteEntry() {
    if (!editingId) return;
    entries = entries.filter(e => e.id !== editingId);
    saveEntries(); closeModal(); render();
    showToast('Eliminato', 'info');
}

function quickDelete(id) {
    entries = entries.filter(e => e.id !== id);
    saveEntries(); render();
    showToast('Eliminato', 'info');
}
