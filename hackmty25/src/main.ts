// --- 1. DEFINICIÓN DE INTERFACES ---
// (Define la "forma" de nuestros datos)

interface RangoData {
    rango: number;
    nombre: string;
    meta: number;
    recompensaPts: number;
    recompensaCashback?: number; // <-- El signo '?' lo hace opcional
}

interface Mission {
    id: string; title: string; type: 'DEPOSIT_ONCE' | 'SET_GOAL' | 'READ_TIP';
    params: { minAmount?: number };
    rewards: { points: number; water?: number; sun?: number };
    iconColor: string;
}

interface ModalState {
    isAnimating: boolean;
    activeModal: string | null;
}

// --- 2. CONSTANTES GLOBALES ---
// (Datos que no cambian)

// ¡MOVIMOS ESTO AL INICIO!
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

const missionDatabase: Mission[] = [
    { id: 'set_goal_1', title: 'Establecer tu primera meta', type: 'SET_GOAL', params: {}, rewards: { points: 100, water: 5 }, iconColor: 'bg-yellow-200' },
    { id: 'deposit_10', title: 'Deposita $10 pesos', type: 'DEPOSIT_ONCE', params: { minAmount: 10 }, rewards: { points: 2, water: 2 }, iconColor: 'bg-green-200' },
    { id: 'deposit_50', title: '¡Buen inicio! Deposita $50', type: 'DEPOSIT_ONCE', params: { minAmount: 50 }, rewards: { points: 10, water: 5 }, iconColor: 'bg-pink-200' },
    { id: 'read_tip_1', title: 'Lee un tip financiero', type: 'READ_TIP', params: {}, rewards: { points: 5 }, iconColor: 'bg-blue-200' }
];

const PUNTOS_POR_PESO = 0.1; 
const PUNTOS_BONO_RANGO_2 = 500; // (No se usa actualmente, pero lo guardamos)

// --- 3. ESTADO DE LA APLICACIÓN ---
// (Variables que cambian)

let currentRango = 0; // 0: Onboarding, 1: Semilla, etc.
let totalAhorrado = 0.0;
let totalPuntos = 0;
let metaAhorro = 0.0; // La meta personal del usuario
let metaFrecuencia: string | null = null;
let siguienteMetaRango = 1000.00; // La meta del *siguiente* rango

let activeDailyMissions: Mission[] = [];
let completedDailyMissionIds: string[] = [];

const modalState: ModalState = {
    isAnimating: false,
    activeModal: null
};

// --- 4. SELECCIÓN DE ELEMENTOS DEL DOM ---
// (Conectamos el código con el HTML)

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
const plantImage = document.getElementById('plant-image') as HTMLImageElement | null; // La imagen de la planta
const openDepositModalBtn = document.querySelector('.btn-depositar') as HTMLButtonElement | null;

// Modal de Depósito
const bottomSheetOverlay = document.getElementById('bottom-sheet-modal') as HTMLDivElement | null;
const transferFormView = document.getElementById('transfer-form-view') as HTMLDivElement | null;
const successView = document.getElementById('success-view') as HTMLDivElement | null;
const depositAmountInput = document.getElementById('deposit-amount-input') as HTMLInputElement | null;
const confirmDepositBtn = document.getElementById('confirm-deposit-btn') as HTMLButtonElement | null;
const cancelDepositBtn = document.getElementById('cancel-deposit-btn') as HTMLButtonElement | null;
const closeSuccessBtn = document.getElementById('close-success-btn') as HTMLButtonElement | null;

// Misiones
const missionListContainer = document.getElementById('mission-list-container') as HTMLDivElement | null;


// --- 5. LÓGICA DE MISIONES ---

function loadDailyMissions() {
    completedDailyMissionIds = []; 
    if (currentRango === 0) {
        const metaMission = missionDatabase.find(m => m.type === 'SET_GOAL');
        activeDailyMissions = metaMission ? [metaMission] : [];
    } else {
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
        missionCard.className = `
            mission-card flex items-center p-4 
            ${index !== activeDailyMissions.length - 1 ? 'border-b border-gray-100' : ''}
            ${isCompleted ? 'bg-gray-50' : 'hover:bg-gray-50'} 
            transition-colors duration-200 cursor-pointer
            ${isCompleted ? 'opacity-75' : ''}
        `;
        
        const iconBg = document.createElement('div');
        iconBg.className = `
            w-12 h-12 rounded-full flex items-center justify-center text-xl mr-4 
            transform transition-transform duration-200 hover:scale-110
            ${mission.iconColor} shadow-sm
        `;
        iconBg.innerHTML = isCompleted ? '✅' : (mission.type === 'SET_GOAL' ? '⭐' : '🎯');

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

        const statusIcon = document.createElement('span');
        statusIcon.className = `
            text-xl ml-4 transform transition-transform duration-200
            ${isCompleted ? 'text-green-500 scale-110' : 'text-gray-400'}
        `;
        statusIcon.innerHTML = isCompleted ? '✔️' : `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>`;

        missionCard.appendChild(iconBg);
        missionCard.appendChild(details);
        missionCard.appendChild(statusIcon);

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

// --- 6. LÓGICA DE RANGOS Y UI ---

/**
 * Revisa si el ahorro total cumple la meta para subir de rango.
 * ¡Incluye la lógica especial para Rango 1 -> 2!
 */
function checkRangoUpgrade() {
    if (currentRango >= 5) return; // Ya está en el rango máximo

    let proximoRangoIndex = currentRango + 1;
    let proximoRangoData = RANGOS_DATA[proximoRangoIndex];

    // --- LÓGICA DE CONDICIÓN DE RANGO ---
    let rankUpConditionMet = false;

    // Lógica especial para Rango 1 -> 2
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
        // (Rango 0->1 se maneja en handleConfirmGoal)
        // Esta condición es para Rango 2 -> 3, 3 -> 4, etc.
        if (totalAhorrado >= proximoRangoData.meta) {
            rankUpConditionMet = true;
        }
    }
    // --- FIN LÓGICA DE CONDICIÓN ---

    // Loop por si un depósito grande sube múltiples rangos a la vez
    while (currentRango < 5 && rankUpConditionMet) {
        
        // --- SUBIÓ DE RANGO ---
        currentRango = proximoRangoData.rango;
        
        if (proximoRangoData.recompensaPts > 0) {
            totalPuntos += proximoRangoData.recompensaPts;
            console.log(`¡RANGO UPGRADE! Rango ${currentRango} (${proximoRangoData.nombre}) desbloqueado. Bono de +${proximoRangoData.recompensaPts} puntos.`);
        }
        
        if (proximoRangoData.recompensaCashback) {
            console.log(`¡FELICIDADES! Rango ${currentRango} alcanzado. ¡Recibes $${proximoRangoData.recompensaCashback} de Cashback!`);
        }

        // Actualizar la variable 'siguienteMetaRango' para la UI
        if (currentRango < 5) {
            siguienteMetaRango = RANGOS_DATA[currentRango + 1].meta;
        } else {
            siguienteMetaRango = proximoRangoData.meta;
        }

        // Preparar el loop para checar el *siguiente* rango (por si lo alcanzó también)
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

function formatCurrency(amount: number): string {
    return amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

/**
 * Controla qué vista se muestra (Onboarding o App Principal).
 */
function checkAppState() {
    if (currentRango === 0) {
        if (onboardingSection) onboardingSection.classList.remove('hidden');
        if (mainAppContent) mainAppContent.classList.add('hidden');
        loadDailyMissions();
    } else {
        if (onboardingSection) onboardingSection.classList.add('hidden');
        if (mainAppContent) mainAppContent.classList.remove('hidden');
        actualizarUI();
    }
}

/**
 * ¡FUNCIÓN CORREGIDA!
 * Actualiza la imagen de la planta basándose en el 'currentRango' (0-5),
 * NO en el 'progreso'.
 */
function updatePlantImage() { // <-- PARÉNTESIS VACÍOS
    if (!plantImage) return;

    let imageIndex = 0; 

    switch (currentRango) { // <-- Se basa en 'currentRango'
        case 0: imageIndex = 0; break; // Rango 0: Tierra Sola (fase_0.png)
        case 1: imageIndex = 1; break; // Rango 1: Semilla (fase_1.png)
        case 2: imageIndex = 2; break; // Rango 2: Planta Joven (fase_2.png)
        case 3: imageIndex = 3; break; // Rango 3: Arbusto (fase_3.png)
        case 4: imageIndex = 4; break; // Rango 4: Árbol Fuerte (fase_4.png)
        case 5: imageIndex = 4; break; // Rango 5: Árbol Frutal (USA fase_4.png)
        default: imageIndex = 0;
    }
    
    // (Si tienes una 'fase_5.png', cambia la línea 'case 5' por 'imageIndex = 5;')

    // Asegúrate que tu ruta sea correcta. Basado en tu HTML, es "src/Assets/..."
    plantImage.src = `/Assets/fase_${imageIndex}.png`; 
    plantImage.alt = `Planta en ${RANGOS_DATA[currentRango].nombre}`;
}


/**
 * ¡FUNCIÓN CORREGIDA!
 * Actualiza todos los elementos visuales de la app.
 * Llama a 'updatePlantImage()' SIN parámetros.
 */
function actualizarUI() {
    if (totalAhorradoDisplay) totalAhorradoDisplay.textContent = `Has ahorrado ${formatCurrency(totalAhorrado)}`;
    if (totalPuntosDisplay) totalPuntosDisplay.textContent = Math.floor(totalPuntos).toString();

    // Muestra cuánto falta para la meta del siguiente rango
    const restante = siguienteMetaRango - totalAhorrado;
    if (metaDisplay) {
        if (currentRango === 5) {
            metaDisplay.textContent = `¡Meta de ${formatCurrency(siguienteMetaRango)} alcanzada!`;
        } else {
            // Lógica especial para Rango 1 -> 2
            if (currentRango === 1) {
                // La meta es la MÁXIMA entre la personal y la fija de Rango 2
                const metaVisible = Math.max(RANGOS_DATA[2].meta, metaAhorro);
                const restanteVisible = metaVisible - totalAhorrado;
                metaDisplay.textContent = `Meta ${formatCurrency(metaVisible)} - Faltan ${formatCurrency(Math.max(0, restanteVisible))}`;
            } else {
                metaDisplay.textContent = `Meta ${formatCurrency(siguienteMetaRango)} - Faltan ${formatCurrency(Math.max(0, restante))}`;
            }
        }
    }

    // --- CÁLCULO DE PROGRESO (Para la barra) ---
    let progreso = 0;
    if (siguienteMetaRango > 0) {
        if (currentRango === 5) {
            progreso = 100; // Rango máximo, barra llena
        } else {
            const metaAnterior = RANGOS_DATA[currentRango].meta;
            
            // Lógica especial para Rango 1 -> 2
            let metaVisibleSiguiente = siguienteMetaRango;
            if (currentRango === 1) {
                 metaVisibleSiguiente = Math.max(RANGOS_DATA[2].meta, metaAhorro);
            }
            
            const totalDelRango = metaVisibleSiguiente - metaAnterior;
            const ahorroEnEsteRango = totalAhorrado - metaAnterior;
            
            if (totalDelRango > 0) {
                progreso = Math.min((ahorroEnEsteRango / totalDelRango) * 100, 100);
            }
        }
    }

    if (progressBarFill) {
        progressBarFill.style.width = `${progreso}%`;
    }

    // --- LLAMADA CORREGIDA ---
    // Llama a la función SIN el 'progreso'
    updatePlantImage(); // <-- PARÉNTESIS VACÍOS

    renderMissions();
}

// --- 7. LÓGICA DE MODALES Y EVENTOS ---

function animateModal(modal: HTMLElement, opening: boolean) {
    if (modalState.isAnimating) return;
    modalState.isAnimating = true;

    modal.classList.add('modal-transition');
    modal.style.opacity = opening ? '0' : '1';
    
    if (opening) modal.classList.remove('hidden');

    requestAnimationFrame(() => {
        modal.style.opacity = opening ? '1' : '0';
        
        setTimeout(() => {
            if (!opening) modal.classList.add('hidden');
            modal.classList.remove('modal-transition');
            modalState.isAnimating = false;
        }, 300);
    });
}

function openGoalSetupModal() {
    if (!goalSetupModal || modalState.activeModal) return;
    modalState.activeModal = 'goal';
    animateModal(goalSetupModal, true);
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

function openDepositModal() {
    if (!bottomSheetOverlay || modalState.activeModal) return;
    modalState.activeModal = 'deposit';
    animateModal(bottomSheetOverlay, true);
    setTimeout(() => {
        if (depositAmountInput) {
            depositAmountInput.focus();
            depositAmountInput.select();
        }
    }, 300);
}

function closeDepositModal() {
    if (!bottomSheetOverlay || modalState.activeModal !== 'deposit') return;
    animateModal(bottomSheetOverlay, false);
    modalState.activeModal = null;
}

function openSuccessModal() {
    if (transferFormView) transferFormView.classList.add('hidden');
    if (successView) successView.classList.remove('hidden');
}

function closeSuccessModal() {
    // Cierra el modal completo
    if (bottomSheetOverlay) animateModal(bottomSheetOverlay, false);
    modalState.activeModal = null;

    // Retrasa el reinicio de las vistas para que la animación de cierre se vea
    setTimeout(() => {
        if (successView) successView.classList.add('hidden');
        if (transferFormView) transferFormView.classList.remove('hidden');
    }, 300); // 300ms (debe coincidir con la animación)
}

/**
 * Confirma la meta inicial y pasa a Rango 1.
 * Establece la meta de la UI en el valor MÁS ALTO (Meta Rango 2 o Meta Personal).
 */
function handleConfirmGoal() {
    if (!goalAmountInput || !goalFrequencySelect) return;
    
    const montoMeta = parseFloat(goalAmountInput.value);
    const frecuencia = goalFrequencySelect.value;

    if (isNaN(montoMeta) || montoMeta < 100) {
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
    
    currentRango = 1; // Pasa a Rango 1 (Semilla)
    
    const metaRango2 = RANGOS_DATA.find(r => r.rango === 2)!.meta; // 1000.00
    
    // Tu nueva regla: La meta visible (UI) es el MÁXIMO entre la meta Rango 2 y la meta Personal.
    siguienteMetaRango = Math.max(metaRango2, metaAhorro);

    const successFeedback = document.createElement('div');
    successFeedback.className = 'success-feedback';
    successFeedback.innerHTML = `
        <div class="success-icon">✓</div>
        <p>¡Meta establecida con éxito!</p>
    `;
    
    if (goalSetupModal) {
        // Muestra el feedback de éxito
        const modalContent = goalSetupModal.querySelector('.modal-content');
        if (modalContent) modalContent.appendChild(successFeedback);
        
        setTimeout(() => {
            closeGoalSetupModal();
            checkMissionProgress('SET_GOAL'); 
            loadDailyMissions();
            checkAppState();
            
            // Quita el feedback después para el próximo uso
            successFeedback.remove();
        }, 1500);
    }
}

function handleDeposit() {
    if (!depositAmountInput || currentRango === 0) {
        alert("¡Debes establecer tu meta primero!");
        return;
    }

    const montoDepositado = parseFloat(depositAmountInput.value);
    
    if (isNaN(montoDepositado) || montoDepositado <= 0) {
        // Aquí puedes poner una animación de error en el input
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
    depositAmountInput.value = "100.00"; // Reinicia al valor por defecto
    openSuccessModal();
    
    // 5. Actualizar la UI principal (ya que 'openSuccessModal' no cierra el modal)
    actualizarUI(); 
}

// --- 8. EVENT LISTENERS ---
// (Inicia la aplicación)

document.addEventListener('DOMContentLoaded', () => {

    // 1. Onboarding
    if (startGoalBtn) startGoalBtn.addEventListener('click', openGoalSetupModal);
    if (confirmGoalBtn) confirmGoalBtn.addEventListener('click', handleConfirmGoal);
    if (goalSetupModal) {
        goalSetupModal.addEventListener('click', (event) => {
            if (event.target === goalSetupModal) closeGoalSetupModal();
        });
    }

    // 2. Depósito
    if (openDepositModalBtn) openDepositModalBtn.addEventListener('click', openDepositModal);
    if (confirmDepositBtn) confirmDepositBtn.addEventListener('click', handleDeposit);
    if (cancelDepositBtn) cancelDepositBtn.addEventListener('click', closeDepositModal);
    if (closeSuccessBtn) closeSuccessBtn.addEventListener('click', closeSuccessModal);
    if (bottomSheetOverlay) {
        bottomSheetOverlay.addEventListener('click', (event) => {
            // Cierra si se da clic en el overlay, pero no en el contenido
            if (event.target === bottomSheetOverlay) {
                closeDepositModal();
            }
        });
    }

    // 3. INICIALIZACIÓN
    checkAppState();
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        if (modalState.activeModal === 'goal') closeGoalSetupModal();
        if (modalState.activeModal === 'deposit') closeDepositModal();
    }
});

// (Esta sección estaba al final de tu archivo, pero ya no es necesaria aquí)
// (La movimos a la sección 2. CONSTANTES GLOBALES)
// const RANGOS_DATA: RangoData[] = [ ... ];