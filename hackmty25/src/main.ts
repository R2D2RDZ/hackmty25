// --- ESTADO DE LA APLICACIÓN ---
// Empezamos con los valores que se ven en el HTML
let totalAhorrado = 1000.00;
let totalPuntos = 100; // 100 puntos por los $1000 iniciales (1000 * 0.1)
const metaAhorro = 5000.00;

// --- REGLA DE NEGOCIO ---
// 1 punto por cada $10 MXN
const PUNTOS_POR_PESO = 0.1; 

// --- SELECCIÓN DE ELEMENTOS DEL DOM ---

// Botones del Modal
const openModalBtn = document.querySelector('.btn-depositar') as HTMLButtonElement;
const depositModal = document.getElementById('deposit-modal') as HTMLDivElement;
const closeModalBtn = document.getElementById('close-modal-btn') as HTMLButtonElement;
const confirmDepositBtn = document.getElementById('confirm-deposit-btn') as HTMLButtonElement;
const depositInput = document.getElementById('deposit-amount-input') as HTMLInputElement;

// Elementos de la UI para actualizar
const totalAhorradoDisplay = document.getElementById('total-ahorrado-display') as HTMLHeadingElement;
const metaDisplay = document.getElementById('meta-display') as HTMLParagraphElement;
const progressBarFill = document.getElementById('progress-bar-fill') as HTMLDivElement;
const totalPuntosDisplay = document.getElementById('total-puntos-display') as HTMLParagraphElement;


// --- FUNCIONES ---

/**
 * Formatea un número como moneda MXN.
 * @param amount - La cantidad numérica.
 * @returns La cantidad formateada como string (ej. $1,234.50).
 */
function formatCurrency(amount: number): string {
    return amount.toLocaleString('es-MX', {
        style: 'currency',
        currency: 'MXN'
    });
}

/**
 * Actualiza todos los elementos de la UI con los valores del estado actual.
 */
function actualizarUI() {
    // 1. Actualizar el ahorro
    totalAhorradoDisplay.textContent = `Has ahorrado ${formatCurrency(totalAhorrado)}`;
    
    // 2. Actualizar la meta
    const restante = metaAhorro - totalAhorrado;
    if (restante > 0) {
        metaDisplay.textContent = `Meta ${formatCurrency(metaAhorro)} - Faltan ${formatCurrency(restante)}`;
    } else {
        metaDisplay.textContent = `¡Meta de ${formatCurrency(metaAhorro)} alcanzada!`;
    }

    // 3. Actualizar la barra de progreso
    const progreso = Math.min((totalAhorrado / metaAhorro) * 100, 100);
    progressBarFill.style.width = `${progreso}%`;

    // 4. Actualizar los puntos
    // Usamos Math.floor para mostrar puntos enteros
    totalPuntosDisplay.textContent = Math.floor(totalPuntos).toString();
}

/**
 * Maneja la lógica de confirmar un depósito.
 */
function handleDeposit() {
    // 1. Obtener y validar el monto
    const montoDepositado = parseFloat(depositInput.value);
    
    if (isNaN(montoDepositado) || montoDepositado <= 0) {
        // Opcional: mostrar un error al usuario
        console.error("Monto inválido");
        depositInput.value = ""; // Limpiar input
        return;
    }

    // 2. Calcular puntos ganados
    const puntosGanados = montoDepositado * PUNTOS_POR_PESO;

    // 3. Actualizar el estado global
    totalAhorrado += montoDepositado;
    totalPuntos += puntosGanados;

    console.log(`Depositado: ${formatCurrency(montoDepositado)}`);
    console.log(`Puntos Ganados: ${puntosGanados}`);
    console.log(`Total Ahorrado: ${formatCurrency(totalAhorrado)}`);
    console.log(`Total Puntos: ${totalPuntos}`);

    // 4. Actualizar la UI
    actualizarUI();

    // 5. Limpiar y cerrar el modal
    depositInput.value = "";
    closeDepositModal();
}

// Funciones para abrir/cerrar modal (tu código original)
function openDepositModal() {
    depositModal.classList.remove('hidden');
    // Opcional: Poner el foco (cursor) en el input automáticamente
    const depositInput = document.getElementById('deposit-amount-input') as HTMLInputElement;
    depositInput.focus();
}

// 3. Función para CERRAR el modal
function closeDepositModal() {
    depositModal.classList.add('hidden');
}

// 4. Asignar los "escuchadores" de eventos
openModalBtn.addEventListener('click', openDepositModal);
closeModalBtn.addEventListener('click', closeDepositModal);

// 5. (Opcional) Cerrar el modal si se hace clic en el fondo oscuro
depositModal.addEventListener('click', (event) => {
    // Si el elemento en el que hicimos clic es el overlay (el fondo)...
    if (event.target === depositModal) {
        closeDepositModal();
    }
});

// ¡NUEVO! Evento para el botón de confirmar
confirmDepositBtn.addEventListener('click', handleDeposit);

// --- INICIALIZACIÓN ---
// Asegurarse de que la UI muestre los valores iniciales correctos al cargar la página
// Usamos DOMContentLoaded para asegurar que todos los elementos estén listos
document.addEventListener('DOMContentLoaded', () => {
    actualizarUI();
});
