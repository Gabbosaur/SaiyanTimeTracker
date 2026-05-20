// ===== STATS =====

function updateStats() {
    const ferieUsed = entries.filter(e => e.type === 'ferie').reduce((s, e) => s + e.hours, 0);
    const permessiUsed = entries.filter(e => e.type === 'permessi').reduce((s, e) => s + e.hours, 0);

    // Ferie (usa budget effettivo + debito da anno precedente)
    const ferieBase = getEffectiveFerieTotal(currentYear);
    const ferieCarryover = getFerieCarryover(currentYear);
    const ferieTotal = ferieBase + ferieCarryover;
    const ferieRemaining = ferieTotal - ferieUsed;
    document.getElementById('ferieUsed').textContent = `${ferieUsed} / ${ferieTotal}h (${hToDays(ferieTotal)})`;
    document.getElementById('ferieBar').style.width = Math.min((ferieUsed / ferieTotal) * 100, 100) + '%';
    document.getElementById('ferieDetail').textContent = `${ferieRemaining}h rimanenti (${hToDays(ferieRemaining)})`;

    const ferieWarningEl = document.getElementById('ferieWarning');
    if (ferieCarryover < 0) {
        ferieWarningEl.textContent = `⚠ ${ferieCarryover}h debito da ${currentYear - 1}`;
    } else if (currentYear === new Date().getFullYear() && ferieRemaining > 0) {
        ferieWarningEl.textContent = `⚠ Da usare entro il 31/12/${currentYear}`;
    } else if (ferieRemaining < 0) {
        ferieWarningEl.textContent = `⚠ Superato il limite di ${Math.abs(ferieRemaining)}h`;
    } else {
        ferieWarningEl.textContent = '';
    }

    // Permessi (usa budget effettivo)
    const permessiBase = getEffectivePermessiTotal(currentYear);
    const carryover = getPermessiCarryover(currentYear);
    const permessiTotal = permessiBase + carryover;
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

    // Mostra spiegazione budget se pro-rata o manuale
    const budgetExpl = getBudgetExplanation(currentYear);
    const budgetExplEl = document.getElementById('budgetExplanation');
    if (budgetExplEl) {
        budgetExplEl.textContent = budgetExpl || '';
        budgetExplEl.style.display = budgetExpl ? 'block' : 'none';
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
    const ferieCarryover = getFerieCarryover(currentYear);
    const ferieLeft = (getEffectiveFerieTotal(currentYear) + ferieCarryover) - ferieUsed;
    const permessiLeft = (getEffectivePermessiTotal(currentYear) + carryover) - permessiUsed;

    const floatFerieEl = document.getElementById('floatFerie');
    const floatPermessiEl = document.getElementById('floatPermessi');

    if (ferieLeft <= 0) {
        floatFerieEl.textContent = '✓ Tutto allocato';
        floatFerieEl.classList.add('done');
    } else {
        floatFerieEl.textContent = `${ferieLeft}h da allocare`;
        floatFerieEl.classList.remove('done');
    }

    if (permessiLeft <= 0) {
        floatPermessiEl.textContent = '✓ Tutto allocato';
        floatPermessiEl.classList.add('done');
    } else {
        floatPermessiEl.textContent = `${permessiLeft}h da allocare`;
        floatPermessiEl.classList.remove('done');
    }
}
