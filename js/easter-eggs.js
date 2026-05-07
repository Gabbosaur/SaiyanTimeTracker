// ===== EASTER EGGS =====

// --- Konami Code: Super Saiyan Mode ---
const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
let konamiIdx = 0;
let superSaiyanActive = false;

document.addEventListener('keydown', e => {
    if (e.key === KONAMI[konamiIdx]) {
        konamiIdx++;
        if (konamiIdx === KONAMI.length) {
            konamiIdx = 0;
            toggleSuperSaiyan();
        }
    } else {
        konamiIdx = 0;
    }
});

let ssAudio = null;

function fadeOutAudio(audio, duration) {
    const step = 50;
    const volumeStep = audio.volume / (duration / step);
    const fade = setInterval(() => {
        audio.volume = Math.max(0, audio.volume - volumeStep);
        if (audio.volume <= 0.01) {
            clearInterval(fade);
            audio.pause();
            audio.currentTime = 0;
        }
    }, step);
}

function toggleSuperSaiyan() {
    superSaiyanActive = !superSaiyanActive;
    document.body.classList.toggle('super-saiyan', superSaiyanActive);
    if (superSaiyanActive) {
        showToast('⚡ SUPER SAIYAN MODE ACTIVATED ⚡', 'success');
        ssAudio = new Audio('assets/super-saiyan.mp3');
        ssAudio.volume = 0.2;
        ssAudio.play().catch(() => {});
        // Fade out negli ultimi 3 secondi
        ssAudio.addEventListener('timeupdate', function() {
            if (this.duration && this.currentTime >= this.duration - 3 && this.volume > 0.01) {
                fadeOutAudio(this, 3000);
            }
        });
        const aura = document.createElement('div');
        aura.id = 'ss-aura';
        aura.className = 'ss-aura-overlay';
        document.body.appendChild(aura);
        spawnKiParticles();
    } else {
        showToast('Tornato alla forma base', 'info');
        if (ssAudio) { fadeOutAudio(ssAudio, 1000); ssAudio = null; }
        const aura = document.getElementById('ss-aura');
        if (aura) aura.remove();
        document.querySelectorAll('.ki-particle').forEach(p => p.remove());
    }
}

function spawnKiParticles() {
    for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.className = 'ki-particle';
        p.style.left = Math.random() * 100 + 'vw';
        p.style.animationDuration = (2 + Math.random() * 3) + 's';
        p.style.animationDelay = Math.random() * 2 + 's';
        p.style.fontSize = (8 + Math.random() * 14) + 'px';
        p.textContent = ['✦','⚡','🔥','✧','💫'][Math.floor(Math.random() * 5)];
        document.body.appendChild(p);
        p.addEventListener('animationend', () => p.remove());
    }
}

// --- Title click: Shenron ---
let titleClicks = 0;
let titleClickTimer = null;
const SHENRON_MSGS = [
    'Shenron dice: "Il tuo desiderio di più ferie non può essere esaudito."',
    'Shenron dice: "Hai già usato questo desiderio l\'anno scorso."',
    'Shenron dice: "Prenditi una pausa, guerriero."',
    'Shenron dice: "Le sfere del drago non coprono i permessi ROL."',
    'Shenron dice: "Il vero power-up è il work-life balance."',
    'Shenron dice: "Desiderio esaudito: +0 ore di ferie. Scusa."',
    'Shenron dice: "Nemmeno io posso battere le policy aziendali."',
];

document.addEventListener('DOMContentLoaded', () => {
    const title = document.querySelector('.header h1');
    if (title) {
        title.style.cursor = 'pointer';
        title.addEventListener('click', () => {
            titleClicks++;
            clearTimeout(titleClickTimer);
            titleClickTimer = setTimeout(() => { titleClicks = 0; }, 2000);
            if (titleClicks === 7) {
                titleClicks = 0;
                summonShenron();
            }
        });
    }
});

function summonShenron() {
    const msg = SHENRON_MSGS[Math.floor(Math.random() * SHENRON_MSGS.length)];
    const overlay = document.createElement('div');
    overlay.className = 'shenron-overlay';
    overlay.innerHTML = `
        <div class="shenron-content">
            <img class="shenron-img" src="assets/shenron.gif" alt="Shenron">
            <div class="shenron-text">${msg}</div>
        </div>
    `;
    const dismiss = () => {
        if (overlay.classList.contains('leaving')) return;
        overlay.classList.add('leaving');
        overlay.addEventListener('animationend', () => overlay.remove());
    };
    overlay.addEventListener('click', dismiss);
    document.body.appendChild(overlay);
    // Audio
    const audio = new Audio('assets/dbs shenron.mp3');
    audio.volume = 0.15;
    audio.play().catch(() => {});
    setTimeout(dismiss, 6000);
}

// --- Achievement messages on stats update ---
function checkAchievements() {
    const ferieUsed = entries.filter(e => e.type === 'ferie').reduce((s, e) => s + e.hours, 0);
    const permessiUsed = entries.filter(e => e.type === 'permessi').reduce((s, e) => s + e.hours, 0);
    const total = ferieUsed + permessiUsed;

    // Check localStorage to not repeat
    const key = `saiyan_achievements_${currentYear}`;
    const shown = JSON.parse(localStorage.getItem(key) || '[]');

    function achieve(id, msg) {
        if (shown.includes(id)) return;
        shown.push(id);
        localStorage.setItem(key, JSON.stringify(shown));
        setTimeout(() => showToast(msg, 'success'), 500);
    }

    const ferieTotal = getEffectiveFerieTotal(currentYear);
    if (ferieUsed >= ferieTotal) achieve('all-ferie', '🏆 Ultra Instinct del riposo raggiunto!');
    if (ferieUsed >= ferieTotal / 2 && ferieUsed < ferieTotal) achieve('half-ferie', '⚡ Metà ferie usate — Sei a Super Saiyan 2!');
    if (permessiUsed > 0 && ferieUsed === 0) achieve('only-permessi', '🧠 Stratega: solo permessi, zero ferie');
    if (total >= 200) achieve('over-200', '🔥 Oltre 200 ore fuori — Power Level: Leggendario');
    if (total === 0 && entries.length === 0) return; // no entries yet
    if (ferieUsed === 8) achieve('first-ferie', '🎉 Prima giornata di ferie registrata!');
}
