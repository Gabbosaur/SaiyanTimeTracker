// ===== UTILITY FUNCTIONS =====

const FERIE_TOTAL = 160;
const PERMESSI_TOTAL = 112;
const WORK_START_HOUR = 9;   // default inizio giornata lavorativa
const WORK_DAY_HOURS = 9;    // default ore totali (include pausa pranzo)
const MONTHS_IT = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
const DAYS_IT = ['Lu','Ma','Me','Gi','Ve','Sa','Do'];

function getWorkStartHour() {
    try {
        const s = JSON.parse(localStorage.getItem('saiyan_work_schedule') || 'null');
        return s && s.startHour != null ? s.startHour : WORK_START_HOUR;
    } catch { return WORK_START_HOUR; }
}

function getWorkDayHours() {
    try {
        const s = JSON.parse(localStorage.getItem('saiyan_work_schedule') || 'null');
        return s && s.dayHours != null ? s.dayHours : WORK_DAY_HOURS;
    } catch { return WORK_DAY_HOURS; }
}

function saveWorkSchedule(startHour, dayHours) {
    localStorage.setItem('saiyan_work_schedule', JSON.stringify({ startHour, dayHours }));
}

function fmtHour(h) {
    return `${String(h).padStart(2, '0')}:00`;
}

function formatDate(y, m, d) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function formatDateDisplay(dateStr) {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
}

function todayStr() {
    const t = new Date();
    return formatDate(t.getFullYear(), t.getMonth(), t.getDate());
}

function hToDays(h) {
    const d = Math.floor(h / 8);
    const r = h % 8;
    return r > 0 ? `${d}g ${r}h` : `${d}g`;
}

function download(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function showToast(msg, type) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 2500);
}

// Toast con pulsante Annulla. onUndo eseguito al click, onCommit se scade il tempo.
let undoToastTimer = null;
function showUndoToast(msg, onUndo, onCommit, duration = 5000) {
    const toast = document.getElementById('toast');
    clearTimeout(undoToastTimer);

    let committed = false;
    const commit = () => {
        if (committed) return;
        committed = true;
        clearTimeout(undoToastTimer);
        toast.classList.remove('show');
        toast.onclick = null;
        if (onCommit) onCommit();
    };

    toast.innerHTML = `<span>${msg}</span><button class="toast-undo">↩ Annulla (${Math.round(duration / 1000)}s)</button>`;
    toast.className = 'toast info show';

    const btn = toast.querySelector('.toast-undo');
    btn.onclick = (e) => {
        e.stopPropagation();
        if (committed) return;
        committed = true;
        clearTimeout(undoToastTimer);
        clearInterval(countdown);
        toast.classList.remove('show');
        toast.onclick = null;
        if (onUndo) onUndo();
    };

    // Countdown visivo
    let remaining = Math.round(duration / 1000);
    const countdown = setInterval(() => {
        remaining--;
        if (remaining <= 0) { clearInterval(countdown); return; }
        if (btn && !committed) btn.textContent = `↩ Annulla (${remaining}s)`;
    }, 1000);

    undoToastTimer = setTimeout(() => { clearInterval(countdown); commit(); }, duration);
}
