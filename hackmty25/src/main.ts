// 1. Seleccionar los elementos del DOM
const openModalBtn = document.querySelector('.btn-depositar') as HTMLButtonElement;
const depositModal = document.getElementById('deposit-modal') as HTMLDivElement;
const closeModalBtn = document.getElementById('close-modal-btn') as HTMLButtonElement;

// 2. Función para ABRIR el modal
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