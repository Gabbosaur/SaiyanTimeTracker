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
