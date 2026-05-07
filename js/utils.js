// ===== UTILITY FUNCTIONS =====

const FERIE_TOTAL = 160;
const PERMESSI_TOTAL = 112;
const MONTHS_IT = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
const DAYS_IT = ['Lu','Ma','Me','Gi','Ve','Sa','Do'];

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
