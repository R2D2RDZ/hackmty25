// 1. Seleccionamos los elementos del DOM
// Usamos 'as' para decirle a TypeScript qué tipo de elemento esperamos
const input = document.getElementById('increment-input') as HTMLInputElement;
const button = document.getElementById('add-button') as HTMLButtonElement;
const countDisplay = document.getElementById('count-display') as HTMLSpanElement;

// 2. Variable (estado) para llevar la cuenta
let count = 0;

// 3. Función que maneja la lógica
function addFromInput() {
  // 4. Leemos el valor actual del input y lo convertimos a número
  const amountToAdd = parseInt(input.value, 10);

  // 5. Verificamos que sea un número válido
  if (!isNaN(amountToAdd)) {
    // Sumamos al contador
    count += amountToAdd;
    
    // Actualizamos el texto en el HTML
    countDisplay.textContent = count.toString();
  } else {
    // Opcional: avisar si el valor no es válido
    alert("Por favor, introduce un número válido.");
  }
}

// 6. Añadimos un "escuchador de eventos" al botón
// Cuando se haga 'click', ejecutará la función addFromInput
button.addEventListener('click', addFromInput);