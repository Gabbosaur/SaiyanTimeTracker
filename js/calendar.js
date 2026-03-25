// ===== CALENDAR =====

function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    const holidays = getHolidays(currentYear);

    for (let m = 0; m < 12; m++) {
        const card = document.createElement('div');
        card.className = 'month-card';
        const daysInMonth = new Date(currentYear, m + 1, 0).getDate();
        let startDay = new Date(currentYear, m, 1).getDay();
        startDay = startDay === 0 ? 6 : startDay - 1;

        let html = `<div class="month-name">${MONTHS_IT[m]}</div>`;
        html += `<div class="weekdays">${DAYS_IT.map(d => `<div>${d}</div>`).join('')}</div>`;
        html += `<div class="days">`;
        for (let i = 0; i < startDay; i++) html += `<div class="day empty"></div>`;

        const today = new Date();
        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(currentYear, m, d);
            const dow = date.getDay();
            const isWeekend = dow === 0 || dow === 6;
            const dateStr = formatDate(currentYear, m, d);
            const isHoliday = holidays[dateStr];
            const dayEntries = entries.filter(e => e.date === dateStr);
            const hasFerie = dayEntries.some(e => e.type === 'ferie');
            const hasPermessi = dayEntries.some(e => e.type === 'permessi');
            const isToday = date.toDateString() === today.toDateString();

            let cls = 'day';
            let inlineStyle = '';
            if (isWeekend) cls += ' weekend';
            else if (isHoliday) cls += ' festivo';
            if (isToday) cls += ' today';
            if (!isHoliday && !isWeekend) {
                if (hasFerie && hasPermessi) cls += ' both';
                else if (hasFerie) cls += ' ferie';
                else if (hasPermessi) {
                    cls += ' permessi permessi-fill';
                    const permHours = dayEntries.find(e => e.type === 'permessi').hours;
                    const fillPct = (permHours / 8) * 100;
                    inlineStyle = `style="--fill:${fillPct}%"`;
                }
            }

            let tooltip = isHoliday ? `${dateStr} — ${isHoliday}` : dateStr;
            if (!isHoliday && !isWeekend && dayEntries.length > 0) {
                tooltip = dayEntries.map(e => `${e.type === 'ferie' ? 'Ferie' : 'Permesso'} ${e.hours}h${e.note ? ' — ' + e.note : ''}`).join('\n');
            }
            const selectable = !isWeekend && !isHoliday;
            const dataAttr = selectable ? `data-date="${dateStr}"` : '';
            html += `<div class="${cls}" ${dataAttr} ${inlineStyle} title="${tooltip}">${d}</div>`;
        }

        html += `</div>`;
        card.innerHTML = html;
        grid.appendChild(card);
    }
}

function renderEntries() {
    const list = document.getElementById('entriesList');
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    if (sorted.length === 0) {
        list.innerHTML = '<div class="no-entries">Nessun inserimento per il ' + currentYear + '. Clicca su un giorno o usa il pulsante "Aggiungi".</div>';
        return;
    }
    const todayDate = todayStr();
    list.innerHTML = sorted.map(e => {
        const isPast = e.date < todayDate;
        const isToday = e.date === todayDate;
        const statusCls = isPast ? 'entry-past' : isToday ? 'entry-today' : 'entry-future';
        const statusLabel = isPast ? '✓ Usato' : isToday ? '⏳ Oggi' : '📅 Pianificato';
        return `
        <div class="entry-item ${statusCls}">
            <div class="entry-dot ${e.type}"></div>
            <div class="entry-date">${formatDateDisplay(e.date)}</div>
            <div class="entry-type ${e.type}">${e.type === 'ferie' ? '🔥 Ferie' : '⚡ Permessi'}</div>
            <div class="entry-hours">${e.hours}h</div>
            <div class="entry-status">${statusLabel}</div>
            <div class="entry-note">${e.note || ''}</div>
            <button class="entry-delete" onclick="editEntry('${e.id}')" title="Modifica">✏️</button>
            <button class="entry-delete" onclick="quickDelete('${e.id}')" title="Elimina">🗑</button>
        </div>`;
    }).join('');
}

// ===== DRAG SELECT =====

let isDragging = false;
let dragStartDate = null;
let dragCurrentDate = null;
let dragSelectedDates = [];

function getDatesBetween(d1, d2) {
    const start = new Date(Math.min(new Date(d1), new Date(d2)));
    const end = new Date(Math.max(new Date(d1), new Date(d2)));
    const holidays = getHolidays(currentYear);
    const dates = [];
    for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
        const dow = dt.getDay();
        const dateStr = formatDate(dt.getFullYear(), dt.getMonth(), dt.getDate());
        if (dow !== 0 && dow !== 6 && !holidays[dateStr]) dates.push(dateStr);
    }
    return dates;
}

function updateDragHighlight() {
    document.querySelectorAll('.day.selecting').forEach(el => el.classList.remove('selecting'));
    if (!dragStartDate || !dragCurrentDate) { hideDragInfo(); return; }
    const dates = getDatesBetween(dragStartDate, dragCurrentDate);
    dates.forEach(dateStr => {
        const el = document.querySelector(`.day[data-date="${dateStr}"]`);
        if (el) el.classList.add('selecting');
    });
    dates.length > 1 ? showDragInfo(dates) : hideDragInfo();
}

function showDragInfo(dates) {
    const el = document.getElementById('dragInfo');
    const count = dates.length;
    const ferieUsed = entries.filter(e => e.type === 'ferie').reduce((s, e) => s + e.hours, 0);
    const permessiUsed = entries.filter(e => e.type === 'permessi').reduce((s, e) => s + e.hours, 0);
    const carryover = getPermessiCarryover(currentYear);
    const ferieRemaining = FERIE_TOTAL - ferieUsed;
    const permessiRemaining = (PERMESSI_TOTAL + carryover) - permessiUsed;
    const cost = count * 8;
    const ferieAfter = ferieRemaining - cost;
    const permessiAfter = permessiRemaining - cost;

    el.innerHTML = `
        <div class="drag-title">📅 ${count} giorni selezionati (${cost}h)</div>
        <div class="drag-row">
            <span>🔥 Ferie dopo:</span>
            <span class="drag-val ${ferieAfter < 0 ? 'warning' : 'ferie'}">${ferieAfter}h (${hToDays(Math.max(0, ferieAfter))})</span>
        </div>
        <div class="drag-row">
            <span>⚡ Permessi dopo:</span>
            <span class="drag-val ${permessiAfter < 0 ? 'warning' : 'permessi'}">${permessiAfter}h (${hToDays(Math.max(0, permessiAfter))})</span>
        </div>
    `;
    el.classList.add('visible');
}

function hideDragInfo() {
    document.getElementById('dragInfo').classList.remove('visible');
}

function onDayClick(dateStr) {
    const dayEntries = entries.filter(e => e.date === dateStr);
    if (dayEntries.length >= 1) editEntry(dayEntries[0].id);
    else openModal(dateStr);
}

document.addEventListener('mousedown', e => {
    const dayEl = e.target.closest('.day[data-date]');
    if (!dayEl) return;
    e.preventDefault();
    isDragging = true;
    dragStartDate = dayEl.dataset.date;
    dragCurrentDate = dragStartDate;
    updateDragHighlight();
});

document.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const dayEl = e.target.closest('.day[data-date]');
    if (dayEl && dayEl.dataset.date !== dragCurrentDate) {
        dragCurrentDate = dayEl.dataset.date;
        updateDragHighlight();
    }
});

document.addEventListener('mouseup', e => {
    if (!isDragging) return;
    isDragging = false;
    hideDragInfo();
    const dates = getDatesBetween(dragStartDate, dragCurrentDate);
    document.querySelectorAll('.day.selecting').forEach(el => el.classList.remove('selecting'));
    if (dates.length <= 1) {
        const dateStr = dates[0] || dragStartDate;
        dragStartDate = null;
        dragCurrentDate = null;
        onDayClick(dateStr);
        return;
    }
    dragSelectedDates = dates;
    dragStartDate = null;
    dragCurrentDate = null;
    openModalMulti(dragSelectedDates);
});
