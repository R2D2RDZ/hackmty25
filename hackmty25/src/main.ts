// --- ESTADO DE LA APLICACIÓN ---
let totalAhorrado = 1000.00;
const metaAhorro = 5000.00;
// Se calcula basado en el ahorro inicial
let totalPuntos = totalAhorrado * 0.1;

// --- REGLA DE NEGOCIO ---
// 1 punto por cada $10 MXN
const PUNTOS_POR_PESO = 0.1; 

// --- SELECCIÓN DE ELEMENTOS DEL DOM (PRINCIPALES) ---
const totalAhorradoDisplay = document.getElementById('total-ahorrado-display') as HTMLHeadingElement | null;
const metaDisplay = document.getElementById('meta-display') as HTMLParagraphElement | null;
const progressBarFill = document.getElementById('progress-bar-fill') as HTMLDivElement | null;
// +++ RESTAURADO: Selector de Puntos +++
const totalPuntosDisplay = document.getElementById('total-puntos-display') as HTMLParagraphElement | null;

// --- SELECCIÓN DE ELEMENTOS DEL DOM (MODAL) ---
// (Lógica de tu amigo)
const openDepositModalBtn = document.querySelector('.btn-depositar') as HTMLButtonElement | null;
const bottomSheetModal = document.getElementById('bottom-sheet-modal') as HTMLDivElement | null;
const transferFormView = document.getElementById('transfer-form-view') as HTMLDivElement | null;
const successView = document.getElementById('success-view') as HTMLDivElement | null;
const depositAmountInput = document.getElementById('deposit-amount-input') as HTMLInputElement | null;
const confirmDepositBtn = document.getElementById('confirm-deposit-btn') as HTMLButtonElement | null;
const cancelDepositBtn = document.getElementById('cancel-deposit-btn') as HTMLButtonElement | null;
const closeSuccessBtn = document.getElementById('close-success-btn') as HTMLButtonElement | null;

// +++ RESTAURADO: Selector del contenedor de misiones +++
const missionListContainer = document.getElementById('mission-list-container') as HTMLDivElement | null;


// --- +++ RESTAURADO: SISTEMA DE MISIONES +++ ---

interface Mission {
    id: string;
    title: string;
    type: 'DEPOSIT_ONCE' | 'READ_TIP';
    params: {
        minAmount?: number;
    };
    rewards: {
        points: number;
        water?: number;
        sun?: number;
    };
    iconColor: string;
}

// Catálogo General de Misiones
const missionDatabase: Mission[] = [
    {
        id: 'deposit_10',
        title: 'Deposita $10 pesos',
        type: 'DEPOSIT_ONCE',
        params: { minAmount: 10 },
        rewards: { points: 2, water: 2 },
        iconColor: 'bg-green'
    },
    {
        id: 'deposit_50',
        title: '¡Buen inicio! Deposita $50',
        type: 'DEPOSIT_ONCE',
        params: { minAmount: 50 },
        rewards: { points: 10, water: 5 },
        iconColor: 'bg-pink'
    },
    {
        id: 'read_tip_1',
        title: 'Lee un tip financiero',
        type: 'READ_TIP', 
        params: {},
        rewards: { points: 5 },
        iconColor: 'bg-orange'
    },
];

let activeDailyMissions: Mission[] = [];
let completedDailyMissionIds: string[] = [];

/**
 * Carga las misiones del día (toma las 3 primeras del catálogo).
 */
function loadDailyMissions() {
    activeDailyMissions = missionDatabase.slice(0, 3);
    completedDailyMissionIds = []; 
    console.log("Misiones diarias cargadas:", activeDailyMissions);
}

/**
 * Dibuja las misiones activas en el HTML.
 */
function renderMissions() {
    if (!missionListContainer) return;

    missionListContainer.innerHTML = '';

    activeDailyMissions.forEach(mission => {
        const isCompleted = completedDailyMissionIds.includes(mission.id);
        
        const missionCard = document.createElement('div');
        missionCard.className = `mission-card ${isCompleted ? 'opacity-50' : ''}`;
        
        const iconBg = document.createElement('div');
        iconBg.className = `mission-icon-bg ${mission.iconColor}`;
        iconBg.innerHTML = isCompleted ? '✅' : '🎯';
        iconBg.style.display = 'flex';
        iconBg.style.alignItems = 'center';
        iconBg.style.justifyContent = 'center';
        iconBg.style.fontSize = '1.5rem';

        const details = document.createElement('div');
        details.className = 'mission-details';
        details.innerHTML = `
            <p class="mission-title">${mission.title}</p>
            <p class="mission-rewards">
                <span>🪙 ${mission.rewards.points}</span>
                ${mission.rewards.water ? `<span>💧 ${mission.rewards.water}</span>` : ''}
                ${mission.rewards.sun ? `<span>☀️ ${mission.rewards.sun}</span>` : ''}
            </p>
        `;

        const arrow = document.createElement('span');
        arrow.className = 'mission-arrow';
        arrow.textContent = isCompleted ? '✔️' : '>';

        missionCard.appendChild(iconBg);
        missionCard.appendChild(details);
        missionCard.appendChild(arrow);

        missionListContainer.appendChild(missionCard);
    });
}

/**
 * Revisa si una acción (como un depósito) completa una misión.
 */
function checkMissionProgress(actionType: string, actionParams: any) {
    console.log(`Revisando misiones tipo: ${actionType}`, actionParams);

    const relevantMissions = activeDailyMissions.filter(
        mission => 
            mission.type === actionType && 
            !completedDailyMissionIds.includes(mission.id)
    );

    for (const mission of relevantMissions) {
        let conditionsMet = false;

        if (mission.type === 'DEPOSIT_ONCE') {
            if (actionParams.amount >= (mission.params.minAmount ?? 0)) {
                conditionsMet = true;
            }
        }
        
        if (conditionsMet) {
            completeMission(mission);
        }
    }
}

/**
 * Otorga las recompensas y marca la misión como completada.
 */
function completeMission(mission: Mission) {
    if (completedDailyMissionIds.includes(mission.id)) return;
    
    console.log(`¡Misión completada: ${mission.title}!`);
    completedDailyMissionIds.push(mission.id);

    totalPuntos += mission.rewards.points;
    console.log(`+${mission.rewards.points} puntos. Total ahora: ${totalPuntos}`);
    
    // Actualizar toda la UI (puntos y lista de misiones)
    actualizarUI();
}
// --- +++ FIN DEL SISTEMA DE MISIONES +++ ---


// --- FUNCIONES AUXILIARES Y DE UI ---

/**
 * Formatea un número como moneda MXN.
 */
function formatCurrency(amount: number): string {
    return amount.toLocaleString('es-MX', {
        style: 'currency',
        currency: 'MXN'
    });
}

/**
 * Actualiza TODOS los elementos visuales de la app.
 */
function actualizarUI() {
    if (totalAhorradoDisplay) {
        totalAhorradoDisplay.textContent = `Has ahorrado ${formatCurrency(totalAhorrado)}`;
    }

    const restante = metaAhorro - totalAhorrado;
    if (metaDisplay) {
        metaDisplay.textContent = restante > 0
            ? `Meta ${formatCurrency(metaAhorro)} - Faltan ${formatCurrency(restante)}`
            : `¡Meta de ${formatCurrency(metaAhorro)} alcanzada!`;
    }

    if (progressBarFill) {
        const progreso = Math.min((totalAhorrado / metaAhorro) * 100, 100);
        progressBarFill.style.width = `${progreso}%`;
    }

    // +++ RESTAURADO: Actualizar contador de puntos +++
    if (totalPuntosDisplay) {
        totalPuntosDisplay.textContent = Math.floor(totalPuntos).toString();
    }
    // Llama a renderMissions para actualizar la lista (ej. mostrar checks)
    renderMissions(); 
}

// --- FUNCIONES DEL MODAL Y LÓGICA DE DEPÓSITO ---
// (Lógica de tu amigo - sin cambios, solo se agrega el hook)

function openModal(viewToShow: 'transfer' | 'success') {
    if (!bottomSheetModal || !transferFormView || !successView || !depositAmountInput) return;

    bottomSheetModal.classList.add('active');
    bottomSheetModal.classList.remove('hidden');

    transferFormView.classList.add('hidden');
    successView.classList.add('hidden');

    if (viewToShow === 'transfer') {
        transferFormView.classList.remove('hidden');
        depositAmountInput.focus();
    } else if (viewToShow === 'success') {
        successView.classList.remove('hidden');
    }
}

function closeBottomSheetModal() {
    if (!bottomSheetModal) return;
    bottomSheetModal.classList.remove('active');
    bottomSheetModal.addEventListener('transitionend', () => {
        if (!bottomSheetModal.classList.contains('active')) {
            bottomSheetModal.classList.add('hidden');
        }
    }, { once: true });
}


function handleDeposit() {
    if (!depositAmountInput) {
        console.error("Campo de depósito no encontrado.");
        return;
    }

    const montoDepositado = parseFloat(depositAmountInput.value);
    
    if (isNaN(montoDepositado) || montoDepositado <= 0) {
        // Reemplazo el alert() de tu amigo por un console.error para no bloquear la app
        console.error("Por favor, introduce un monto válido.");
        depositAmountInput.value = "";
        return;
    }

    // 1. Actualizar el estado global de Ahorro y Puntos
    totalAhorrado += montoDepositado;
    totalPuntos += montoDepositado * PUNTOS_POR_PESO;

    // 2. +++ CONEXIÓN CRÍTICA: Llama al motor de misiones +++
    checkMissionProgress('DEPOSIT_ONCE', { amount: montoDepositado });

    // 3. Actualizar la pantalla principal
    actualizarUI();

    // 4. Limpiar el input y cambiar a la vista de éxito
    depositAmountInput.value = "";
    openModal('success');
}

// --- EVENT LISTENERS ---
// (Lógica de tu amigo - sin cambios)
if (openDepositModalBtn) openDepositModalBtn.addEventListener('click', () => openModal('transfer'));
if (confirmDepositBtn) confirmDepositBtn.addEventListener('click', handleDeposit);
if (cancelDepositBtn) cancelDepositBtn.addEventListener('click', closeBottomSheetModal);
if (closeSuccessBtn) closeSuccessBtn.addEventListener('click', closeBottomSheetModal);

if (bottomSheetModal) {
    bottomSheetModal.addEventListener('click', (event) => {
        if (event.target === bottomSheetModal) {
            closeBottomSheetModal();
        }
    });
}

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    // +++ RESTAURADO: Cargar misiones al iniciar +++
    loadDailyMissions();
    
    // Llama a la función una vez al cargar la página
    actualizarUI();
});