// --- ESTADO DE LA APLICACIÓN ---
let totalAhorrado = 1000.00;
const metaAhorro = 5000.00;
// Aunque no se muestren, podemos seguir calculando los puntos
let totalPuntos = totalAhorrado * 0.1;

// --- REGLA DE NEGOCIO ---
// 1 punto por cada $10 MXN
const PUNTOS_POR_PESO = 0.1; 

// --- SELECCIÓN DE ELEMENTOS DEL DOM (PRINCIPALES) ---
// --- SELECCIÓN DE ELEMENTOS DEL DOM (PRINCIPALES) ---
const totalAhorradoDisplay = document.getElementById('total-ahorrado-display') as HTMLHeadingElement;
const metaDisplay = document.getElementById('meta-display') as HTMLParagraphElement;
const progressBarFill = document.getElementById('progress-bar-fill') as HTMLDivElement;

// --- SELECCIÓN DE ELEMENTOS DEL DOM (MODAL) ---
const openDepositModalBtn = document.querySelector('.btn-depositar') as HTMLButtonElement;
const bottomSheetModal = document.getElementById('bottom-sheet-modal') as HTMLDivElement;
const transferFormView = document.getElementById('transfer-form-view') as HTMLDivElement;
const successView = document.getElementById('success-view') as HTMLDivElement;
const depositAmountInput = document.getElementById('deposit-amount-input') as HTMLInputElement;
const confirmDepositBtn = document.getElementById('confirm-deposit-btn') as HTMLButtonElement;
const cancelDepositBtn = document.getElementById('cancel-deposit-btn') as HTMLButtonElement;
const closeSuccessBtn = document.getElementById('close-success-btn') as HTMLButtonElement;


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

function actualizarUI() {
    if (totalAhorradoDisplay) {
        totalAhorradoDisplay.textContent = `Has ahorrado ${formatCurrency(totalAhorrado)}`;
    }

    const restante = metaAhorro - totalAhorrado;
    metaDisplay.textContent = restante > 0
        ? `Meta ${formatCurrency(metaAhorro)} - Faltan ${formatCurrency(restante)}`
        : `¡Meta de ${formatCurrency(metaAhorro)} alcanzada!`;
    metaDisplay.textContent = restante > 0
        ? `Meta ${formatCurrency(metaAhorro)} - Faltan ${formatCurrency(restante)}`
        : `¡Meta de ${formatCurrency(metaAhorro)} alcanzada!`;

    if (progressBarFill) {
        const progreso = Math.min((totalAhorrado / metaAhorro) * 100, 100);
        progressBarFill.style.width = `${progreso}%`;
    }

    // No actualizamos los puntos en la UI porque no hay un elemento para ellos.
}

// --- FUNCIONES DEL MODAL Y LÓGICA DE DEPÓSITO ---

/**
 * Abre el modal deslizable y muestra la vista especificada.
 * @param viewToShow - 'transfer' o 'success'
 */
function openModal(viewToShow: 'transfer' | 'success') {
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

/**
 * Cierra el modal deslizable con animación.
 */
function closeBottomSheetModal() {
    bottomSheetModal.classList.remove('active');
    bottomSheetModal.addEventListener('transitionend', () => {
        if (!bottomSheetModal.classList.contains('active')) {
            bottomSheetModal.classList.add('hidden');
        }
    }, { once: true });
}


function handleDeposit() {
    const montoDepositado = parseFloat(depositAmountInput.value);
    
    if (isNaN(montoDepositado) || montoDepositado <= 0) {
        alert("Por favor, introduce un monto válido.");
        depositAmountInput.value = "";
        return;
    }

    // Actualizar el estado global
    totalAhorrado += montoDepositado;
    totalPuntos += montoDepositado * PUNTOS_POR_PESO;

    // Actualizar la pantalla principal
    actualizarUI();

    // Limpiar el input y cambiar a la vista de éxito
    depositAmountInput.value = "";
    openModal('success'); // <-- ¡Cambio clave!
}

// --- EVENT LISTENERS ---

// Abrir el modal en la vista de transferencia
openDepositModalBtn.addEventListener('click', () => openModal('transfer'));

// Confirmar el depósito desde el modal
confirmDepositBtn.addEventListener('click', handleDeposit);

// Cerrar el modal desde los botones "Cancelar" y "Cerrar"
cancelDepositBtn.addEventListener('click', closeBottomSheetModal);
closeSuccessBtn.addEventListener('click', closeBottomSheetModal);

// Cerrar el modal al hacer clic en el fondo oscuro
bottomSheetModal.addEventListener('click', (event) => {
    if (event.target === bottomSheetModal) {
        closeBottomSheetModal();
    }
});

// --- INICIALIZACIÓN ---
// Llama a la función una vez al cargar la página para asegurar que los
// valores iniciales se muestren formateados correctamente.
document.addEventListener('DOMContentLoaded', actualizarUI);