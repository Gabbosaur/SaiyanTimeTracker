// ===== STATS =====

function updateStats() {
    const ferieUsed = entries.filter(e => e.type === 'ferie').reduce((s, e) => s + e.hours, 0);
    const permessiUsed = entries.filter(e => e.type === 'permessi').reduce((s, e) => s + e.hours, 0);

    // Ferie
    const ferieRemaining = FERIE_TOTAL - ferieUsed;
    document.getElementById('ferieUsed').textContent = `${ferieUsed} / ${FERIE_TOTAL}h (${hToDays(FERIE_TOTAL)})`;
    document.getElementById('ferieBar').style.width = Math.min((ferieUsed / FERIE_TOTAL) * 100, 100) + '%';
    document.getElementById('ferieDetail').textContent = `${ferieRemaining}h rimanenti (${hToDays(ferieRemaining)})`;

    const ferieWarningEl = document.getElementById('ferieWarning');
    if (currentYear === new Date().getFullYear() && ferieRemaining > 0) {
        ferieWarningEl.textContent = `⚠ Da usare entro il 31/12/${currentYear}`;
    } else if (ferieRemaining < 0) {
        ferieWarningEl.textContent = `⚠ Superato il limite di ${Math.abs(ferieRemaining)}h`;
    } else {
        ferieWarningEl.textContent = '';
    }

    // Permessi
    const carryover = getPermessiCarryover(currentYear);
    const permessiTotal = PERMESSI_TOTAL + carryover;
    const permessiRemaining = permessiTotal - permessiUsed;

    document.getElementById('permessiUsed').textContent = `${permessiUsed} / ${permessiTotal}h (${hToDays(permessiTotal)})`;
    document.getElementById('permessiBar').style.width = Math.min((permessiUsed / permessiTotal) * 100, 100) + '%';
    document.getElementById('permessiDetail').textContent = `${permessiRemaining}h rimanenti (${hToDays(permessiRemaining)})`;

    const carryoverEl = document.getElementById('permessiCarryover');
    if (carryover > 0) {
        carryoverEl.style.color = '#E040FB';
        carryoverEl.textContent = `↪ +${carryover}h riportate da ${currentYear - 1}`;
    } else if (carryover < 0) {
        carryoverEl.style.color = '#FF5555';
        carryoverEl.textContent = `⚠ ${carryover}h debito da ${currentYear - 1}`;
    } else {
        carryoverEl.textContent = '';
    }
}

// ===== FLOATING STATS =====

function initFloatingStats() {
    const statsObserver = new IntersectionObserver(([entry]) => {
        const el = document.getElementById('floatingStats');
        el.classList.toggle('visible', !entry.isIntersecting);
    }, { threshold: 0 });
    statsObserver.observe(document.getElementById('statsSection'));
}

function updateFloatingStats() {
    const ferieUsed = entries.filter(e => e.type === 'ferie').reduce((s, e) => s + e.hours, 0);
    const permessiUsed = entries.filter(e => e.type === 'permessi').reduce((s, e) => s + e.hours, 0);
    const carryover = getPermessiCarryover(currentYear);
    const ferieLeft = FERIE_TOTAL - ferieUsed;
    const permessiLeft = (PERMESSI_TOTAL + carryover) - permessiUsed;
    document.getElementById('floatFerie').textContent = `${ferieLeft}h (${hToDays(ferieLeft)})`;
    document.getElementById('floatPermessi').textContent = `${permessiLeft}h (${hToDays(permessiLeft)})`;
}
