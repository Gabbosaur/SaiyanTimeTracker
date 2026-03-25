// ===== PROFILO =====

function getUserName() {
    return localStorage.getItem('saiyan_user_name') || '';
}

function setUserName(name) {
    localStorage.setItem('saiyan_user_name', name.trim());
}

function getGreeting() {
    const h = new Date().getHours();
    if (h < 6) return 'Buonanotte';
    if (h < 12) return 'Buongiorno';
    if (h < 14) return 'Buon pranzo';
    if (h < 18) return 'Buon pomeriggio';
    return 'Buonasera';
}

function updateGreeting() {
    const name = getUserName();
    const el = document.getElementById('greeting');
    if (name) {
        el.textContent = `${getGreeting()}, ${name} 👋`;
        el.style.cursor = 'pointer';
        el.title = 'Clicca per cambiare nome';
        el.onclick = askName;
    } else {
        el.textContent = 'Ferie & Permessi — Power Level: Over 9000';
        el.style.cursor = 'default';
        el.onclick = null;
    }
}

function askName() {
    const current = getUserName();
    const name = prompt('Come ti chiami, guerriero? 🔥', current);
    if (name !== null && name.trim()) {
        setUserName(name);
        updateGreeting();
        autoSaveToFile();
        showToast(`Benvenuto, ${name.trim()}!`, 'success');
    }
}

function initProfile() {
    if (!getUserName()) setTimeout(() => askName(), 500);
    updateGreeting();
}
