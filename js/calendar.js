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
                    const permEntries = dayEntries.filter(e => e.type === 'permessi');
                    const dayH = getWorkDayHours();
                    const wsH = getWorkStartHour();
                    // Raccogli tutte le barre da tutte le entry permesso del giorno
                    const allBars = [];
                    permEntries.forEach(pe => {
                        if (pe.timeRanges && pe.timeRanges.length > 0) {
                            pe.timeRanges.forEach(r => {
                                const startIdx = r.start - wsH;
                                allBars.push({ top: (startIdx / dayH) * 100, h: (r.dur / dayH) * 100 });
                            });
                        } else {
                            const startIdx = (pe.startHour != null ? pe.startHour : wsH) - wsH;
                            allBars.push({ top: (startIdx / dayH) * 100, h: (pe.hours / dayH) * 100 });
                        }
                    });
                    if (allBars.length === 1) {
                        cls += ' permessi permessi-fill';
                        inlineStyle = `style="--fill:${allBars[0].h}%; --fill-top:${allBars[0].top}%"`;
                    } else {
                        cls += ' permessi permessi-multi';
                        inlineStyle = `data-bars='${JSON.stringify(allBars)}'`;
                    }
                }
            }

            let tooltip = isHoliday ? `${dateStr} — ${isHoliday}` : dateStr;
            if (!isHoliday && !isWeekend && dayEntries.length > 0) {
                tooltip = dayEntries.map(e => {
                    if (e.type === 'ferie') return `Ferie ${e.hours}h${e.note ? ' — ' + e.note : ''}`;
                    let range = '';
                    if (e.timeRanges && e.timeRanges.length > 0) {
                        range = ' (' + e.timeRanges.map(r => `${fmtHour(r.start)}→${fmtHour(r.start + r.dur)}`).join(', ') + ')';
                    } else if (e.startHour != null) {
                        range = ` (${fmtHour(e.startHour)}→${fmtHour(e.startHour + e.hours)})`;
                    }
                    return `Permesso ${e.hours}h${range}${e.note ? ' — ' + e.note : ''}`;
                }).join('\n');
            }
            const selectable = !isWeekend && !isHoliday;
            const dataAttr = selectable ? `data-date="${dateStr}"` : '';
            html += `<div class="${cls}" ${dataAttr} ${inlineStyle} title="${tooltip}">${d}</div>`;
        }

        html += `</div>`;
        card.innerHTML = html;
        grid.appendChild(card);
    }

    // Render barre multiple per permessi-multi
    document.querySelectorAll('.day.permessi-multi[data-bars]').forEach(dayEl => {
        try {
            const bars = JSON.parse(dayEl.dataset.bars);
            bars.forEach(bar => {
                const barDiv = document.createElement('div');
                barDiv.className = 'permessi-bar-segment';
                barDiv.style.top = bar.top + '%';
                barDiv.style.height = bar.h + '%';
                dayEl.appendChild(barDiv);
            });
        } catch {}
    });
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
            <div class="entry-hours">${e.hours}h${e.type === 'permessi' && e.timeRanges && e.timeRanges.length > 0 ? ` <span style="color:var(--saiyan-muted); font-size:0.78rem;">${e.timeRanges.map(r => fmtHour(r.start) + '→' + fmtHour(r.start + r.dur)).join(', ')}</span>` : e.type === 'permessi' && e.startHour != null ? ` <span style="color:var(--saiyan-muted); font-size:0.78rem;">${fmtHour(e.startHour)}→${fmtHour(e.startHour + e.hours)}</span>` : ''}</div>
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
    const ferieCarryover = getFerieCarryover(currentYear);
    const ferieRemaining = (getEffectiveFerieTotal(currentYear) + ferieCarryover) - ferieUsed;
    const permessiRemaining = (getEffectivePermessiTotal(currentYear) + carryover) - permessiUsed;
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
    if (dayEntries.length === 0) {
        openModal(dateStr);
    } else {
        // Se c'è una ferie, apri direttamente la modifica (copre tutta la giornata)
        const ferieEntry = dayEntries.find(e => e.type === 'ferie');
        if (ferieEntry) {
            editEntry(ferieEntry.id);
        } else {
            // Solo permessi: mostra opzioni per modificare o aggiungerne un altro
            showDayActions(dateStr, dayEntries);
        }
    }
}

function showDayActions(dateStr, dayEntries) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.style.zIndex = '110';
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.maxWidth = '360px';

    let html = `<button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>`;
    html += `<h3>📅 ${formatDateDisplay(dateStr)}</h3>`;
    html += `<div style="display:flex; flex-direction:column; gap:6px; margin-bottom:16px;">`;
    dayEntries.forEach(e => {
        const icon = e.type === 'ferie' ? '🔥' : '⚡';
        const typeLabel = e.type === 'ferie' ? 'Ferie' : 'Permesso';
        const range = (e.type === 'permessi' && e.startHour != null) ? ` (${fmtHour(e.startHour)}→${fmtHour(e.startHour + e.hours)})` : '';
        html += `<button class="btn" style="justify-content:flex-start; width:100%;" onclick="this.closest('.modal-overlay').remove(); editEntry('${e.id}')">
            ${icon} ${typeLabel} ${e.hours}h${range}${e.note ? ' — ' + e.note : ''} <span style="margin-left:auto; color:var(--saiyan-muted); font-size:0.75rem;">✏️ Modifica</span>
        </button>`;
    });
    html += `</div>`;
    html += `<button class="btn primary" style="width:100%;" onclick="this.closest('.modal-overlay').remove(); openModal('${dateStr}')">＋ Aggiungi nuovo</button>`;

    modal.innerHTML = html;
    overlay.appendChild(modal);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
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
