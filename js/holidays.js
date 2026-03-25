// ===== FESTIVITÀ =====

function getEasterMonday(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    const easter = new Date(year, month, day);
    easter.setDate(easter.getDate() + 1);
    return { month: easter.getMonth(), day: easter.getDate() };
}

function getHolidays(year) {
    const holidays = {};
    const fixed = [
        { m: 0, d: 1, name: 'Capodanno' },
        { m: 0, d: 6, name: 'Epifania' },
        { m: 3, d: 25, name: 'Liberazione' },
        { m: 4, d: 1, name: 'Festa dei Lavoratori' },
        { m: 5, d: 2, name: 'Festa della Repubblica' },
        { m: 7, d: 15, name: 'Ferragosto' },
        { m: 10, d: 1, name: 'Ognissanti' },
        { m: 11, d: 8, name: 'Immacolata' },
        { m: 11, d: 25, name: 'Natale' },
        { m: 11, d: 26, name: 'Santo Stefano' },
    ];
    fixed.forEach(h => {
        holidays[formatDate(year, h.m, h.d)] = h.name;
    });
    const em = getEasterMonday(year);
    holidays[formatDate(year, em.month, em.day)] = 'Pasquetta';
    getCustomHolidays().forEach(h => {
        holidays[formatDate(year, h.month, h.day)] = h.name;
    });
    return holidays;
}

// ===== FESTIVITÀ PERSONALIZZATE =====

function getCustomHolidays() {
    try { return JSON.parse(localStorage.getItem('saiyan_custom_holidays') || '[]'); }
    catch { return []; }
}

function saveCustomHolidays(list) {
    localStorage.setItem('saiyan_custom_holidays', JSON.stringify(list));
    setSaveStatus('saving', 'Salvataggio...');
    autoSaveToFile();
}

function openCustomHolidaysModal() {
    renderCustomHolidaysList();
    document.getElementById('holidayModalOverlay').classList.add('active');
}

function closeHolidayModal() {
    document.getElementById('holidayModalOverlay').classList.remove('active');
}

function renderCustomHolidaysList() {
    const list = getCustomHolidays();
    const container = document.getElementById('customHolidaysList');
    if (list.length === 0) {
        container.innerHTML = '<div style="color:var(--saiyan-muted); font-size:0.85rem; text-align:center; padding:10px;">Nessuna festività locale aggiunta</div>';
        return;
    }
    container.innerHTML = list.map((h, i) => `
        <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 10px; background:var(--saiyan-darker); border-radius:8px; margin-bottom:4px;">
            <span style="color:#E040FB; font-weight:600;">${String(h.day).padStart(2,'0')}/${String(h.month + 1).padStart(2,'0')} — ${h.name}</span>
            <button onclick="removeCustomHoliday(${i})" style="background:none; border:none; color:var(--saiyan-muted); cursor:pointer; font-size:1rem;" title="Rimuovi">✕</button>
        </div>
    `).join('');
}

function addCustomHoliday() {
    const dateVal = document.getElementById('customHolidayDate').value;
    const name = document.getElementById('customHolidayName').value.trim();
    if (!dateVal || !name) { showToast('Inserisci data e nome', 'info'); return; }
    const [, m, d] = dateVal.split('-').map(Number);
    const list = getCustomHolidays();
    if (list.some(h => h.month === m - 1 && h.day === d)) {
        showToast('Questa data è già presente', 'info');
        return;
    }
    list.push({ month: m - 1, day: d, name });
    list.sort((a, b) => a.month !== b.month ? a.month - b.month : a.day - b.day);
    saveCustomHolidays(list);
    document.getElementById('customHolidayDate').value = '';
    document.getElementById('customHolidayName').value = '';
    renderCustomHolidaysList();
    render();
    showToast(`${name} aggiunto!`, 'success');
}

function removeCustomHoliday(index) {
    const list = getCustomHolidays();
    const removed = list.splice(index, 1)[0];
    saveCustomHolidays(list);
    renderCustomHolidaysList();
    render();
    showToast(`${removed.name} rimosso`, 'info');
}
