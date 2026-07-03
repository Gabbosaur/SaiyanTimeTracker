// ===== BUDGET SETTINGS =====
// Gestisce il calcolo del budget ferie/permessi:
// - Modalità automatica: pro-rata basato sulla data di assunzione
// - Modalità manuale: l'utente inserisce direttamente le ore

function getBudgetSettings() {
    try {
        return JSON.parse(localStorage.getItem('saiyan_budget_settings') || 'null');
    } catch { return null; }
}

function saveBudgetSettings(settings) {
    localStorage.setItem('saiyan_budget_settings', JSON.stringify(settings));
    setSaveStatus('saving', 'Salvataggio...');
    autoSaveToFile();
}

/**
 * Calcola il budget effettivo per ferie in un dato anno.
 * Tiene conto della data di assunzione (pro-rata) o dell'override manuale.
 */
function getEffectiveFerieTotal(year) {
    const settings = getBudgetSettings();
    if (!settings) return FERIE_TOTAL;

    if (settings.mode === 'manual') {
        return settings.ferieManual || FERIE_TOTAL;
    }

    // Modalità automatica: pro-rata
    if (settings.mode === 'auto' && settings.hireDate) {
        const hireYear = parseInt(settings.hireDate.split('-')[0]);
        const hireMonth = parseInt(settings.hireDate.split('-')[1]); // 1-12

        if (year < hireYear) return 0;
        if (year > hireYear) return FERIE_TOTAL;

        // Anno di assunzione: calcolo pro-rata
        const mesiLavorati = 12 - hireMonth + 1;
        return Math.round((FERIE_TOTAL / 12) * mesiLavorati);
    }

    return FERIE_TOTAL;
}

/**
 * Calcola il budget effettivo per permessi in un dato anno.
 * Tiene conto della data di assunzione (pro-rata) o dell'override manuale.
 */
function getEffectivePermessiTotal(year) {
    const settings = getBudgetSettings();
    if (!settings) return PERMESSI_TOTAL;

    if (settings.mode === 'manual') {
        return settings.permessiManual || PERMESSI_TOTAL;
    }

    // Modalità automatica: pro-rata
    if (settings.mode === 'auto' && settings.hireDate) {
        const hireYear = parseInt(settings.hireDate.split('-')[0]);
        const hireMonth = parseInt(settings.hireDate.split('-')[1]); // 1-12

        if (year < hireYear) return 0;
        if (year > hireYear) return PERMESSI_TOTAL;

        // Anno di assunzione: calcolo pro-rata
        const mesiLavorati = 12 - hireMonth + 1;
        return Math.round((PERMESSI_TOTAL / 12) * mesiLavorati);
    }

    return PERMESSI_TOTAL;
}

/**
 * Restituisce una descrizione leggibile del budget corrente per l'anno dato.
 */
function getBudgetExplanation(year) {
    const settings = getBudgetSettings();
    if (!settings) return null;

    if (settings.mode === 'manual') {
        return `⚙️ Budget manuale: ${settings.ferieManual}h ferie, ${settings.permessiManual}h permessi`;
    }

    if (settings.mode === 'auto' && settings.hireDate) {
        const hireYear = parseInt(settings.hireDate.split('-')[0]);
        const hireMonth = parseInt(settings.hireDate.split('-')[1]);

        if (year > hireYear) return null; // anno pieno, niente da spiegare
        if (year < hireYear) return '⚠️ Non ancora assunto in questo anno';

        const mesiLavorati = 12 - hireMonth + 1;
        const monthName = MONTHS_IT[hireMonth - 1];
        return `📅 Assunto a ${monthName} ${hireYear} → ${mesiLavorati} mesi → pro-rata`;
    }

    return null;
}

// ===== BUDGET MODAL =====

function openBudgetModal() {
    const settings = getBudgetSettings();
    const modal = document.getElementById('budgetModalOverlay');

    // Imposta lo stato corrente
    if (settings && settings.mode === 'auto') {
        document.getElementById('budgetModeAuto').checked = true;
        document.getElementById('budgetHireDate').value = settings.hireDate || '';
        document.getElementById('budgetFerieManual').value = FERIE_TOTAL;
        document.getElementById('budgetPermessiManual').value = PERMESSI_TOTAL;
    } else if (settings && settings.mode === 'manual') {
        document.getElementById('budgetModeManual').checked = true;
        document.getElementById('budgetHireDate').value = settings.hireDate || '';
        document.getElementById('budgetFerieManual').value = settings.ferieManual || FERIE_TOTAL;
        document.getElementById('budgetPermessiManual').value = settings.permessiManual || PERMESSI_TOTAL;
    } else {
        document.getElementById('budgetModeDefault').checked = true;
        document.getElementById('budgetHireDate').value = '';
        document.getElementById('budgetFerieManual').value = FERIE_TOTAL;
        document.getElementById('budgetPermessiManual').value = PERMESSI_TOTAL;
    }

    // Orario lavorativo
    document.getElementById('workStartHourSel').value = String(getWorkStartHour());
    document.getElementById('workDayHoursSel').value = String(getWorkDayHours());

    updateBudgetModalUI();
    modal.classList.add('active');
}

function closeBudgetModal() {
    document.getElementById('budgetModalOverlay').classList.remove('active');
}

function updateBudgetModalUI() {
    const mode = document.querySelector('input[name="budgetMode"]:checked').value;
    const autoSection = document.getElementById('budgetAutoSection');
    const manualSection = document.getElementById('budgetManualSection');
    const previewSection = document.getElementById('budgetPreviewSection');

    autoSection.style.display = mode === 'auto' ? 'block' : 'none';
    manualSection.style.display = mode === 'manual' ? 'block' : 'none';

    // Aggiorna preview
    updateBudgetPreviewCalc();
}

function updateBudgetPreviewCalc() {
    const mode = document.querySelector('input[name="budgetMode"]:checked').value;
    const previewEl = document.getElementById('budgetPreviewSection');

    if (mode === 'default') {
        previewEl.innerHTML = `
            <div class="budget-preview-row">
                <span>🔥 Ferie:</span>
                <strong style="color:var(--ferie-color);">${FERIE_TOTAL}h (${hToDays(FERIE_TOTAL)})</strong>
            </div>
            <div class="budget-preview-row">
                <span>⚡ Permessi:</span>
                <strong style="color:var(--permessi-color);">${PERMESSI_TOTAL}h (${hToDays(PERMESSI_TOTAL)})</strong>
            </div>
            <div class="budget-preview-note">Budget standard annuale completo.</div>
        `;
        return;
    }

    if (mode === 'auto') {
        const hireDate = document.getElementById('budgetHireDate').value;
        if (!hireDate) {
            previewEl.innerHTML = '<div class="budget-preview-note">Inserisci la data di assunzione per vedere il calcolo.</div>';
            return;
        }
        const hireYear = parseInt(hireDate.split('-')[0]);
        const hireMonth = parseInt(hireDate.split('-')[1]);
        const mesiLavorati = 12 - hireMonth + 1;
        const ferieCalc = Math.round((FERIE_TOTAL / 12) * mesiLavorati);
        const permessiCalc = Math.round((PERMESSI_TOTAL / 12) * mesiLavorati);
        const monthName = MONTHS_IT[hireMonth - 1];

        previewEl.innerHTML = `
            <div class="budget-preview-title">Calcolo per ${hireYear}:</div>
            <div class="budget-preview-note" style="margin-bottom:8px;">
                Assunzione: ${monthName} ${hireYear} → ${mesiLavorati} mesi lavorati su 12
            </div>
            <div class="budget-preview-row">
                <span>🔥 Ferie:</span>
                <strong style="color:var(--ferie-color);">${ferieCalc}h (${hToDays(ferieCalc)})</strong>
                <span class="budget-calc-detail">${FERIE_TOTAL}h ÷ 12 × ${mesiLavorati}</span>
            </div>
            <div class="budget-preview-row">
                <span>⚡ Permessi:</span>
                <strong style="color:var(--permessi-color);">${permessiCalc}h (${hToDays(permessiCalc)})</strong>
                <span class="budget-calc-detail">${PERMESSI_TOTAL}h ÷ 12 × ${mesiLavorati}</span>
            </div>
            <div class="budget-preview-note" style="margin-top:8px;">
                ℹ️ Dagli anni successivi al ${hireYear} il budget sarà pieno (${FERIE_TOTAL}h + ${PERMESSI_TOTAL}h).
            </div>
        `;
        return;
    }

    if (mode === 'manual') {
        const ferie = parseInt(document.getElementById('budgetFerieManual').value) || 0;
        const permessi = parseInt(document.getElementById('budgetPermessiManual').value) || 0;
        previewEl.innerHTML = `
            <div class="budget-preview-row">
                <span>🔥 Ferie:</span>
                <strong style="color:var(--ferie-color);">${ferie}h (${hToDays(ferie)})</strong>
            </div>
            <div class="budget-preview-row">
                <span>⚡ Permessi:</span>
                <strong style="color:var(--permessi-color);">${permessi}h (${hToDays(permessi)})</strong>
            </div>
            <div class="budget-preview-note">⚠️ Questi valori sovrascrivono il calcolo automatico per tutti gli anni.</div>
        `;
    }
}

function saveBudgetModal() {
    const mode = document.querySelector('input[name="budgetMode"]:checked').value;

    // Salva sempre l'orario lavorativo
    const workStart = parseInt(document.getElementById('workStartHourSel').value);
    const workDay = parseInt(document.getElementById('workDayHoursSel').value);
    saveWorkSchedule(workStart, workDay);

    if (mode === 'default') {
        localStorage.removeItem('saiyan_budget_settings');
        closeBudgetModal();
        render();
        showToast('Budget ripristinato a standard', 'success');
        return;
    }

    if (mode === 'auto') {
        const hireDate = document.getElementById('budgetHireDate').value;
        if (!hireDate) {
            showToast('Inserisci la data di assunzione', 'info');
            return;
        }
        saveBudgetSettings({ mode: 'auto', hireDate });
        closeBudgetModal();
        render();
        const hireMonth = parseInt(hireDate.split('-')[1]);
        const mesiLavorati = 12 - hireMonth + 1;
        showToast(`Budget calcolato: ${mesiLavorati} mesi pro-rata`, 'success');
        return;
    }

    if (mode === 'manual') {
        const ferieManual = parseInt(document.getElementById('budgetFerieManual').value);
        const permessiManual = parseInt(document.getElementById('budgetPermessiManual').value);
        if (!ferieManual || ferieManual < 0 || !permessiManual || permessiManual < 0) {
            showToast('Inserisci valori validi', 'info');
            return;
        }
        const hireDate = document.getElementById('budgetHireDate').value || null;
        saveBudgetSettings({ mode: 'manual', ferieManual, permessiManual, hireDate });
        closeBudgetModal();
        render();
        showToast(`Budget impostato: ${ferieManual}h ferie, ${permessiManual}h permessi`, 'success');
    }
}

function resetBudget() {
    if (!confirm('Vuoi ripristinare il budget standard (160h ferie + 112h permessi)?')) return;
    localStorage.removeItem('saiyan_budget_settings');
    document.getElementById('budgetModeDefault').checked = true;
    updateBudgetModalUI();
    render();
    showToast('Budget ripristinato', 'info');
}
