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

// --- CAMBIO IMPORTANTE ---
// Ahora seleccionamos el <img> que pusiste en index.html
const plantImage = document.getElementById('plant-image') as HTMLImageElement | null; 
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

interface RangoData {
    rango: number;
    nombre: string;
    meta: number;
    recompensaPts: number;
    recompensaCashback?: number; // <-- El signo '?' lo hace opcional
}
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
    if (currentRango >= 5) return; // Ya está en el rango máximo

    let proximoRangoIndex = currentRango + 1;
    let proximoRangoData = RANGOS_DATA[proximoRangoIndex];

    // --- LÓGICA DE CONDICIÓN DE RANGO ---
    let rankUpConditionMet = false;

    // --- CAMBIO CLAVE: Lógica especial para Rango 1 -> 2 ---
    if (currentRango === 1 && proximoRangoIndex === 2) {
        const metaRango2Fija = proximoRangoData.meta; // $1,000
        const metaPersonalUsuario = metaAhorro; // La que guardamos en onboarding
        
        // Tu nueva regla: Debe cumplir AMBAS condiciones
        if (totalAhorrado >= metaRango2Fija && totalAhorrado >= metaPersonalUsuario) {
            rankUpConditionMet = true;
        }
    }
    // Lógica normal para Rango 0->1 (onboarding) y Rango 2+
    else {
        if (totalAhorrado >= proximoRangoData.meta) {
            rankUpConditionMet = true;
        }
    }
    // --- FIN CAMBIO ---


    // Loop por si un depósito grande sube múltiples rangos a la vez
    // (Ej. Rango 2 -> 3 -> 4)
    while (currentRango < 5 && rankUpConditionMet) {
        
        // --- SUBIÓ DE RANGO ---
        currentRango = proximoRangoData.rango;
        
        // 1. Dar recompensas de Puntos
        if (proximoRangoData.recompensaPts > 0) {
            totalPuntos += proximoRangoData.recompensaPts;
            console.log(`¡RANGO UPGRADE! Rango ${currentRango} (${proximoRangoData.nombre}) desbloqueado. Bono de +${proximoRangoData.recompensaPts} puntos.`);
        }
        
        // 2. Dar recompensa de Cashback (si la hay)
        if (proximoRangoData.recompensaCashback) {
            console.log(`¡FELICIDADES! Rango ${currentRango} alcanzado. ¡Recibes $${proximoRangoData.recompensaCashback} de Cashback!`);
        }

        // 3. Actualizar la variable 'siguienteMetaRango' para la UI
        if (currentRango < 5) {
            siguienteMetaRango = RANGOS_DATA[currentRango + 1].meta;
        } else {
            siguienteMetaRango = proximoRangoData.meta;
        }

        // 4. Preparar el loop para checar el *siguiente* rango (por si lo alcanzó también)
        proximoRangoIndex = currentRango + 1;
        if (proximoRangoIndex <= 5) {
            proximoRangoData = RANGOS_DATA[proximoRangoIndex];
            // La condición para el siguiente loop siempre será la normal
            rankUpConditionMet = (totalAhorrado >= proximoRangoData.meta);
        } else {
            rankUpConditionMet = false; // Detiene el loop (Rango Máx)
        }
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

// --- NUEVA FUNCIÓN ---
/**
 * Actualiza la imagen de la planta basándose en el progreso.
 * El progreso es un valor de 0 a 100.
 * Asignamos 6 rangos (0-5) para las imágenes.
 */
function updatePlantImage(progress: number) {
    if (!plantImage) return;

    let imageIndex = 0; // Rango 0 por defecto (plant-0.png)

    if (progress >= 100) {
        imageIndex = 5; // Rango 5: Meta alcanzada (plant-5.png)
    } else if (progress >= 80) {
        imageIndex = 4; // Rango 4 (plant-4.png)
    } else if (progress >= 60) {
        imageIndex = 3; // Rango 3 (plant-3.png)
    } else if (progress >= 40) {
        imageIndex = 2; // Rango 2 (plant-2.png)
    } else if (progress >= 20) {
        imageIndex = 1; // Rango 1 (plant-1.png)
    } 
    // Si es < 20, se queda en imageIndex = 0

    // Cambia la fuente de la imagen
    plantImage.src = `src/Assets/fase_${imageIndex+1}.png`;
    plantImage.alt = `Planta en rango ${imageIndex+1}`;
}


/**
 * Actualiza todos los elementos visuales de la app.
 */
function actualizarUI() {
    // --- CAMBIO ---
    // Ya no actualizamos el emoji, esa lógica se movió
    // if (plantImage) {
    //     plantImage.textContent = (currentRango === 1) ? '🌱' : '🪴'; 
    // }

    if (totalAhorradoDisplay) totalAhorradoDisplay.textContent = `Has ahorrado ${formatCurrency(totalAhorrado)}`;
    if (totalPuntosDisplay) totalPuntosDisplay.textContent = Math.floor(totalPuntos).toString();

    const restante = siguienteMetaRango - totalAhorrado;
    if (metaDisplay) {
        metaDisplay.textContent = `Meta ${formatCurrency(siguienteMetaRango)} - Faltan ${formatCurrency(restante)}`;
    }

    // --- CÁLCULO DE PROGRESO ---
    let progreso = 0;
    if (siguienteMetaRango > 0) {
        progreso = Math.min((totalAhorrado / siguienteMetaRango) * 100, 100);
    }

    if (progressBarFill) {
        const progreso = (siguienteMetaRango > 0) ? Math.min((totalAhorrado / siguienteMetaRango) * 100, 100) : 0;
        progressBarFill.style.width = `${progreso}%`;
    }

    // --- NUEVA LLAMADA ---
    // Llama a la función que actualiza la imagen
    updatePlantImage(progreso);

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

    if (isNaN(montoMeta) || montoMeta < 100) {
        // (Lógica de error... se mantiene igual)
        goalAmountInput.classList.add('shake-animation');
        setTimeout(() => goalAmountInput.classList.remove('shake-animation'), 500);
        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.textContent = "Por favor, introduce una meta válida (mínimo $100 MXN).";
        goalAmountInput.parentElement?.appendChild(errorMsg);
        setTimeout(() => errorMsg.remove(), 3000);
        return;
    }

    // Success flow
    metaAhorro = montoMeta; // Guardamos la meta personal (Ej: $5,000)
    metaFrecuencia = frecuencia;
    
    // --- CAMBIO CLAVE (LÓGICA RANGO 1 -> 2) ---
    currentRango = 1; // Pasa a Rango 1 (Semilla)
    
    // Obtenemos la meta fija del Rango 2 ($1,000)
    const metaRango2 = RANGOS_DATA.find(r => r.rango === 2)!.meta; // 1000.00
    
    // Tu nueva regla: La meta visible (UI) es el MÁXIMO entre la meta Rango 2 y la meta Personal.
    siguienteMetaRango = Math.max(metaRango2, metaAhorro);
    // (Si la meta personal es $500, siguienteMetaRango = 1000)
    // (Si la meta personal es $5000, siguienteMetaRango = 5000)
    // --- FIN CAMBIO ---

    const successFeedback = document.createElement('div');
    successFeedback.className = 'success-feedback';
    successFeedback.innerHTML = `
        <div class="success-icon">✓</div>
        <p>¡Meta establecida con éxito!</p>
    `;
    
    if (goalSetupModal) {
        goalSetupModal.appendChild(successFeedback);
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
    // --- ESTE BLOQUE PARECÍA SER DE BONIFICACIONES.HTML, LO DEJO PERO COMENTADO ---
    // const pointsDisplay = document.getElementById('points-display');
    // if (pointsDisplay) {
    //     const currentPoints = Math.floor(Number(localStorage.getItem('totalPuntos')) || 0);
    //     pointsDisplay.textContent = currentPoints.toString();
    // }

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

const RANGOS_DATA: RangoData[] = [
    // Rango 0: Inactivo
    { rango: 0, nombre: "Tierra Sola", meta: 0, recompensaPts: 0 },
    // Rango 1: Se activa al poner la meta (Misión 'SET_GOAL' da los 100 Pts)
    { rango: 1, nombre: "Semilla", meta: 1, recompensaPts: 100 }, 
    // Rango 2: Se activa al llegar a $1,000
    { rango: 2, nombre: "Planta Joven", meta: 1000, recompensaPts: 500 },
    // Rango 3: Se activa al llegar a $5,000
    { rango: 3, nombre: "Arbusto", meta: 5000, recompensaPts: 1000 },
    // Rango 4: Se activa al llegar a $20,000
    { rango: 4, nombre: "Árbol Fuerte", meta: 20000, recompensaPts: 2500 },
    // Rango 5: Se activa al llegar a $50,000
    { rango: 5, nombre: "Árbol Frutal", meta: 50000, recompensaPts: 0, recompensaCashback: 100 }
];