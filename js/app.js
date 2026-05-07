// ===== SAIYAN TIME TRACKER — Main App =====

let currentYear = new Date().getFullYear();
let entries = [];
let editingId = null;
let selectedType = 'ferie';

// ===== RENDER =====

function render() {
    document.getElementById('yearDisplay').textContent = currentYear;
    loadEntries();
    updateStats();
    renderCalendar();
    renderEntries();
    updateFloatingStats();
    checkAchievements();
}

function changeYear(delta) {
    const display = document.getElementById('yearDisplay');
    display.style.transition = 'all 0.2s';
    display.style.opacity = '0';
    display.style.transform = delta > 0 ? 'translateX(20px)' : 'translateX(-20px)';
    setTimeout(() => {
        currentYear += delta;
        render();
        display.style.transform = delta > 0 ? 'translateX(-20px)' : 'translateX(20px)';
        requestAnimationFrame(() => {
            display.style.opacity = '1';
            display.style.transform = 'translateX(0)';
        });
    }, 200);
}

// ===== TABS =====

function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + tabName).classList.add('active');
    document.querySelector(`.tab[onclick*="${tabName}"]`).classList.add('active');
}

// ===== KEYBOARD =====

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
});

// ===== TODAY CLOCK =====

function updateTodayClock() {
    const el = document.querySelector('.day.today');
    if (!el) return;
    const now = new Date();
    const angle = (((now.getHours() % 12) * 60 + now.getMinutes()) / 720) * 360;
    el.style.setProperty('--hour-angle', angle + 'deg');
}

setInterval(updateTodayClock, 60000); // update every minute

// ===== INIT =====

render();
updateTodayClock();
initFloatingStats();
initProfile();
tryAutoRestore();
