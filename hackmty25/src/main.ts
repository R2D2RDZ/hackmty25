// --- ESTADO INICIAL DE LA APLICACIÓN (RANGO 0) ---
let currentRango = 0; // 0: Onboarding, 1: Semilla, 2: Árbol (Meta Alcanzada)
let totalAhorrado = 0.0;
let totalPuntos = 0;
let metaAhorro = 0.0; // El usuario define esto en el onboarding
let metaFrecuencia: string | null = null;
let siguienteMetaRango = 1000.00; // Valor de la primera meta para subir de Rango (ej. $1,000 MXN)

// --- REGLA DE NEGOCIO ---
const PUNTOS_POR_PESO = 0.1; 
const PUNTOS_BONO_RANGO_2 = 500; // Bono por subir al Rango 2 (Árbol)

// --- SELECCIÓN DE ELEMENTOS DEL DOM ---
const mainAppContent = document.getElementById('main-app-content') as HTMLDivElement | null;
const onboardingSection = document.getElementById('onboarding-section') as HTMLDivElement | null;

// Modal de Meta
const startGoalBtn = document.getElementById('start-goal-btn') as HTMLButtonElement | null;
const goalSetupModal = document.getElementById('goal-setup-modal') as HTMLDivElement | null;
const confirmGoalBtn = document.getElementById('confirm-goal-btn') as HTMLButtonElement | null;
const goalAmountInput = document.getElementById('goal-amount-input') as HTMLInputElement | null;
const goalFrequencySelect = document.getElementById('goal-frequency-select') as HTMLSelectElement | null;

// UI Principal
const totalAhorradoDisplay = document.getElementById('total-ahorrado-display') as HTMLHeadingElement | null;
const metaDisplay = document.getElementById('meta-display') as HTMLParagraphElement | null;
const progressBarFill = document.getElementById('progress-bar-fill') as HTMLDivElement | null;
const totalPuntosDisplay = document.getElementById('total-puntos-display') as HTMLParagraphElement | null;
const plantImage = document.getElementById('plant-image') as HTMLDivElement | null; // Placeholder de la imagen
const openDepositModalBtn = document.querySelector('.btn-depositar') as HTMLButtonElement | null;

// Modal de Depósito (adaptado al bottom-sheet de index.html)
const bottomSheetOverlay = document.getElementById('bottom-sheet-modal') as HTMLDivElement | null;
const transferFormView = document.getElementById('transfer-form-view') as HTMLDivElement | null;
const successView = document.getElementById('success-view') as HTMLDivElement | null;
const depositAmountInput = document.getElementById('deposit-amount-input') as HTMLInputElement | null;
const confirmDepositBtn = document.getElementById('confirm-deposit-btn') as HTMLButtonElement | null;
const cancelDepositBtn = document.getElementById('cancel-deposit-btn') as HTMLButtonElement | null;
const closeSuccessBtn = document.getElementById('close-success-btn') as HTMLButtonElement | null;

// Misiones
const missionListContainer = document.getElementById('mission-list-container') as HTMLDivElement | null;


// --- SISTEMA DE MISIONES ---
interface Mission {
    id: string; title: string; type: 'DEPOSIT_ONCE' | 'SET_GOAL' | 'READ_TIP';
    params: { minAmount?: number };
    rewards: { points: number; water?: number; sun?: number };
    iconColor: string;
}

// Catálogo de Misiones
const missionDatabase: Mission[] = [
    { id: 'set_goal_1', title: 'Establecer tu primera meta', type: 'SET_GOAL', params: {}, rewards: { points: 100, water: 5 }, iconColor: 'bg-yellow-200' },
    { id: 'deposit_10', title: 'Deposita $10 pesos', type: 'DEPOSIT_ONCE', params: { minAmount: 10 }, rewards: { points: 2, water: 2 }, iconColor: 'bg-green-200' },
    { id: 'deposit_50', title: '¡Buen inicio! Deposita $50', type: 'DEPOSIT_ONCE', params: { minAmount: 50 }, rewards: { points: 10, water: 5 }, iconColor: 'bg-pink-200' },
    { id: 'read_tip_1', title: 'Lee un tip financiero', type: 'READ_TIP', params: {}, rewards: { points: 5 }, iconColor: 'bg-blue-200' }
];

let activeDailyMissions: Mission[] = [];
let completedDailyMissionIds: string[] = [];

/**
 * Carga las misiones basadas en el Rango actual.
 * - Rango 0: Solo la misión de establecer meta.
 * - Rango 1+: Misiones diarias normales (depósito, etc.).
 */
function loadDailyMissions() {
    completedDailyMissionIds = []; 
    if (currentRango === 0) {
        // Rango 0: Solo la misión de establecer meta
        const metaMission = missionDatabase.find(m => m.type === 'SET_GOAL');
        activeDailyMissions = metaMission ? [metaMission] : [];
    } else {
        // Rango 1+: Cargar misiones diarias
        activeDailyMissions = missionDatabase.filter(m => m.type !== 'SET_GOAL').slice(0, 3);
    }
}

function renderMissions() {
    if (!missionListContainer) return;

    missionListContainer.innerHTML = '';
    
    if (activeDailyMissions.length === 0 && currentRango > 0) {
        missionListContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center p-6">
                <span class="text-4xl mb-2">🎯</span>
                <p class="text-gray-500 text-sm text-center">
                    No hay misiones disponibles por ahora.<br>
                    ¡Vuelve mañana para más desafíos!
                </p>
            </div>`;
        return;
    }

    activeDailyMissions.forEach((mission, index) => {
        const isCompleted = completedDailyMissionIds.includes(mission.id);
        
        const missionCard = document.createElement('div');
        // Añadimos efectos de hover y transición
        missionCard.className = `
            mission-card flex items-center p-4 
            ${index !== activeDailyMissions.length - 1 ? 'border-b border-gray-100' : ''}
            ${isCompleted ? 'bg-gray-50' : 'hover:bg-gray-50'} 
            transition-colors duration-200 cursor-pointer
            ${isCompleted ? 'opacity-75' : ''}
        `;
        
        // Ícono con animación al hacer hover
        const iconBg = document.createElement('div');
        iconBg.className = `
            w-12 h-12 rounded-full flex items-center justify-center text-xl mr-4 
            transform transition-transform duration-200 hover:scale-110
            ${mission.iconColor} shadow-sm
        `;
        iconBg.innerHTML = isCompleted ? '✅' : (mission.type === 'SET_GOAL' ? '⭐' : '🎯');

        // Contenido con mejor espaciado y tipografía
        const details = document.createElement('div');
        details.className = 'flex-grow';
        details.innerHTML = `
            <p class="font-semibold text-gray-800 text-base mb-1">${mission.title}</p>
            <div class="mission-rewards flex items-center text-sm space-x-3">
                <span class="flex items-center text-amber-600">
                    <span class="mr-1">🪙</span>${mission.rewards.points}
                </span>
                ${mission.rewards.water ? `
                    <span class="flex items-center text-blue-600">
                        <span class="mr-1">💧</span>${mission.rewards.water}
                    </span>
                ` : ''}
                ${mission.rewards.sun ? `
                    <span class="flex items-center text-yellow-600">
                        <span class="mr-1">☀️</span>${mission.rewards.sun}
                    </span>
                ` : ''}
            </div>
        `;

        // Estado con animación
        const statusIcon = document.createElement('span');
        statusIcon.className = `
            text-xl ml-4 transform transition-transform duration-200
            ${isCompleted ? 'text-green-500 scale-110' : 'text-gray-400'}
        `;
        statusIcon.innerHTML = isCompleted ? '✔️' : `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>`;

        // Ensamblamos la tarjeta
        missionCard.appendChild(iconBg);
        missionCard.appendChild(details);
        missionCard.appendChild(statusIcon);

        // Efecto de clic
        missionCard.addEventListener('click', () => {
            if (!isCompleted) missionCard.classList.add('active');
        });

        missionListContainer.appendChild(missionCard);
    });
}

function checkMissionProgress(actionType: string, actionParams: any = {}) {
    const relevantMissions = activeDailyMissions.filter(
        mission => mission.type === actionType && !completedDailyMissionIds.includes(mission.id)
    );

    for (const mission of relevantMissions) {
        let conditionsMet = false;
        if (mission.type === 'DEPOSIT_ONCE') {
            if (actionParams.amount >= (mission.params.minAmount ?? 0)) conditionsMet = true;
        } else if (mission.type === 'SET_GOAL') {
            conditionsMet = true; 
        }
        
        if (conditionsMet) completeMission(mission);
    }
}

function completeMission(mission: Mission) {
    if (completedDailyMissionIds.includes(mission.id)) return;
    
    completedDailyMissionIds.push(mission.id);
    totalPuntos += mission.rewards.points;
    console.log(`¡Misión completada: ${mission.title}! +${mission.rewards.points} puntos.`);
    
    actualizarUI();
}

// --- GESTIÓN DE RANGOS ---

/**
 * Revisa si el ahorro total cumple la meta para subir de rango.
 */
function checkRangoUpgrade() {
    // Solo aplica para el salto de Rango 1 a Rango 2 (Semilla a Árbol)
    if (currentRango === 1 && totalAhorrado >= siguienteMetaRango) {
        
        // Simular subir a Rango 2 (Árbol)
        currentRango = 2;
        
        // 1. Bonificación por Rango
        totalPuntos += PUNTOS_BONO_RANGO_2;
        console.log(`¡RANGO UPGRADE! Árbol desbloqueado. Bono de +${PUNTOS_BONO_RANGO_2} puntos.`);

        // 2. Nueva Meta para el siguiente rango
        // Reiniciamos el progreso visual y establecemos una meta mayor
        totalAhorrado = 0.00; 
        siguienteMetaRango = 5000.00; // Siguiente meta de $5,000

        // 3. Recargar misiones (en caso de que hayan nuevos tipos para el Rango 2)
        loadDailyMissions();
        actualizarUI();
    }
}

// --- FLUJO PRINCIPAL DE ONBOARDING Y ESTADO ---

function formatCurrency(amount: number): string {
    return amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

/**
 * Controla qué vista se muestra (Onboarding o App Principal).
 */
function checkAppState() {
    if (currentRango === 0) {
        // RANGO 0: Mostrar Onboarding
        if (onboardingSection) onboardingSection.classList.remove('hidden');
        if (mainAppContent) mainAppContent.classList.add('hidden');
        loadDailyMissions(); // Carga solo la misión de "Establecer Meta"
    } else {
        // RANGO 1 o 2: Mostrar App Principal
        if (onboardingSection) onboardingSection.classList.add('hidden');
        if (mainAppContent) mainAppContent.classList.remove('hidden');
        // Si acabamos de pasar de Rango 0, loadDailyMissions ya se llamó en handleConfirmGoal
        actualizarUI();
    }
}

/**
 * Actualiza todos los elementos visuales de la app.
 */
function actualizarUI() {
    // Si la imagen existe, actualiza el emoji según el rango
    if (plantImage) {
        plantImage.textContent = (currentRango === 1) ? '🌱' : '🪴'; 
    }

    if (totalAhorradoDisplay) totalAhorradoDisplay.textContent = `Has ahorrado ${formatCurrency(totalAhorrado)}`;
    if (totalPuntosDisplay) totalPuntosDisplay.textContent = Math.floor(totalPuntos).toString();

    const restante = siguienteMetaRango - totalAhorrado;
    if (metaDisplay) {
        metaDisplay.textContent = `Meta ${formatCurrency(siguienteMetaRango)} - Faltan ${formatCurrency(restante)}`;
    }

    if (progressBarFill) {
        const progreso = (siguienteMetaRango > 0) ? Math.min((totalAhorrado / siguienteMetaRango) * 100, 100) : 0;
        progressBarFill.style.width = `${progreso}%`;
    }

    renderMissions();
}

// --- LÓGICA DEL MODAL DE META (Onboarding) ---

interface ModalState {
    isAnimating: boolean;
    activeModal: string | null;
}

const modalState: ModalState = {
    isAnimating: false,
    activeModal: null
};

function animateModal(modal: HTMLElement, opening: boolean) {
    if (modalState.isAnimating) return;
    modalState.isAnimating = true;

    // Add transition classes
    modal.classList.add('modal-transition');
    modal.style.opacity = opening ? '0' : '1';
    
    // Show modal immediately for animation
    if (opening) {
        modal.classList.remove('hidden');
    }

    // Start animation in next frame
    requestAnimationFrame(() => {
        modal.style.opacity = opening ? '1' : '0';
        
        // Wait for animation to complete
        setTimeout(() => {
            if (!opening) {
                modal.classList.add('hidden');
            }
            modal.classList.remove('modal-transition');
            modalState.isAnimating = false;
        }, 300); // Match CSS transition duration
    });
}

function openGoalSetupModal() {
    if (!goalSetupModal || modalState.activeModal) return;
    
    modalState.activeModal = 'goal';
    animateModal(goalSetupModal, true);
    
    // Focus input after animation
    setTimeout(() => {
        if (goalAmountInput) {
            goalAmountInput.focus();
            goalAmountInput.select();
        }
    }, 300);
}

function closeGoalSetupModal() {
    if (!goalSetupModal || modalState.activeModal !== 'goal') return;
    
    animateModal(goalSetupModal, false);
    modalState.activeModal = null;
}

// --- LÓGICA DEL MODAL DE DEPÓSITO (Conectado) ---

function openDepositModal() {
    if (!openDepositModal || modalState.activeModal) return;
    
    modalState.activeModal = 'deposit';
    if (bottomSheetOverlay) animateModal(bottomSheetOverlay, true);
    
    // Focus input after animation
    setTimeout(() => {
        if (depositAmountInput) {
            depositAmountInput.focus();
            depositAmountInput.select();
        }
    }, 300);
}

function closeDepositModal() {
    if (!openDepositModal || modalState.activeModal !== 'deposit') return;
    
    if (bottomSheetOverlay) animateModal(bottomSheetOverlay, false);
    modalState.activeModal = null;
}

function openSuccessModal() {
    if (transferFormView) transferFormView.classList.add('hidden');
    if (successView) successView.classList.remove('hidden');
}

function closeSuccessModal() {
    // cerrar todo y volver al estado inicial
    if (bottomSheetOverlay) bottomSheetOverlay.classList.remove('active');
    if (successView) successView.classList.add('hidden');
    if (transferFormView) transferFormView.classList.remove('hidden');
}

// Improved form handling
function handleConfirmGoal() {
    if (!goalAmountInput || !goalFrequencySelect) return;
    
    const montoMeta = parseFloat(goalAmountInput.value);
    const frecuencia = goalFrequencySelect.value;

    // Validation with better feedback
    if (isNaN(montoMeta) || montoMeta < 100) {
        // Shake animation on error
        goalAmountInput.classList.add('shake-animation');
        setTimeout(() => goalAmountInput.classList.remove('shake-animation'), 500);
        
        // Error message with style
        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.textContent = "Por favor, introduce una meta válida (mínimo $100 MXN).";
        goalAmountInput.parentElement?.appendChild(errorMsg);
        
        // Remove error after 3 seconds
        setTimeout(() => errorMsg.remove(), 3000);
        return;
    }

    // Success flow
    metaAhorro = montoMeta;
    metaFrecuencia = frecuencia;
    currentRango = 1;
    siguienteMetaRango = 1000.00;

    // Show success feedback before closing
    const successFeedback = document.createElement('div');
    successFeedback.className = 'success-feedback';
    successFeedback.innerHTML = `
        <div class="success-icon">✓</div>
        <p>¡Meta establecida con éxito!</p>
    `;
    
    if (goalSetupModal) {
        goalSetupModal.appendChild(successFeedback);
        
        // Close after showing success
        setTimeout(() => {
            closeGoalSetupModal();
            checkMissionProgress('SET_GOAL');
            loadDailyMissions();
            checkAppState();
        }, 1500);
    }
}

// --- LÓGICA DEL MODAL DE DEPÓSITO (Conectado) ---

function handleDeposit() {
    if (!depositAmountInput || currentRango === 0) {
        alert("¡Debes establecer tu meta primero!");
        return;
    }

    const montoDepositado = parseFloat(depositAmountInput.value);
    
    if (isNaN(montoDepositado) || montoDepositado <= 0) {
        console.error("Monto inválido.");
        return;
    }

    // 1. Actualizar el estado global de Ahorro y Puntos
    totalAhorrado += montoDepositado;
    totalPuntos += montoDepositado * PUNTOS_POR_PESO;

    // 2. Conectar al motor de misiones
    checkMissionProgress('DEPOSIT_ONCE', { amount: montoDepositado });

    // 3. Revisar si sube de rango
    checkRangoUpgrade();

    // 4. Limpiar y mostrar éxito
    depositAmountInput.value = "";
    closeDepositModal();
    openSuccessModal();
    
    // Si no hubo subida de rango, asegura la actualización
    if (currentRango < 2) actualizarUI(); 
}

// --- EVENT LISTENERS ---

document.addEventListener('DOMContentLoaded', () => {
    const pointsDisplay = document.getElementById('points-display');
    
    // Get points from localStorage (set by main app)
    const currentPoints = Math.floor(Number(localStorage.getItem('totalPuntos')) || 0);
    
    // Update display
    if (pointsDisplay) {
        pointsDisplay.textContent = currentPoints.toString();
    }

    // 1. Onboarding
    if (startGoalBtn) startGoalBtn.addEventListener('click', openGoalSetupModal);
    if (confirmGoalBtn) confirmGoalBtn.addEventListener('click', handleConfirmGoal);
    if (goalSetupModal) {
        goalSetupModal.addEventListener('click', (event) => {
            if (event.target === goalSetupModal) closeGoalSetupModal();
        });
    }

    // 2. Depósito (Conexión de la lógica de tu amigo)
    if (openDepositModalBtn) openDepositModalBtn.addEventListener('click', openDepositModal);
    if (confirmDepositBtn) confirmDepositBtn.addEventListener('click', handleDeposit);
    if (cancelDepositBtn) cancelDepositBtn.addEventListener('click', closeDepositModal);
    if (closeSuccessBtn) closeSuccessBtn.addEventListener('click', closeSuccessModal);

    // 3. INICIALIZACIÓN
    checkAppState();
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        if (modalState.activeModal === 'goal') closeGoalSetupModal();
        if (modalState.activeModal === 'deposit') closeDepositModal();
    }
});

document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    
    if (modalState.activeModal === 'goal' && target.classList.contains('modal-overlay')) {
        closeGoalSetupModal();
    }
    
    if (modalState.activeModal === 'deposit' && target.classList.contains('modal-overlay')) {
        closeDepositModal();
    }
});