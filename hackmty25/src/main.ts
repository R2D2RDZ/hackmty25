// --- ESTADO DE LA APLICACIÓN ---
let totalAhorrado = 1000.0;
let totalPuntos = 100;
const metaAhorro = 5000.0;
const PUNTOS_POR_PESO = 0.1;

// --- SELECCIÓN DE ELEMENTOS DEL DOM ---
// Mantener como potencialmente nulos y comprobar antes de usar
const openModalBtn = document.querySelector('.btn-depositar') as HTMLButtonElement | null;
const depositModal = document.getElementById('deposit-modal') as HTMLDivElement | null;
const closeModalBtn = document.getElementById('close-modal-btn') as HTMLButtonElement | null;
const confirmDepositBtn = document.getElementById('confirm-deposit-btn') as HTMLButtonElement | null;
const depositInput = document.getElementById('deposit-amount-input') as HTMLInputElement | null;
const totalAhorradoDisplay = document.getElementById('total-ahorrado-display') as HTMLHeadingElement | null;
const metaDisplay = document.getElementById('meta-display') as HTMLParagraphElement | null;
const progressBarFill = document.getElementById('progress-bar-fill') as HTMLDivElement | null;
const totalPuntosDisplay = document.getElementById('total-puntos-display') as HTMLParagraphElement | null;
const plantContainer = document.getElementById('plant-container') as HTMLDivElement | null;

// +++ AÑADIDO: Selector del contenedor de misiones +++
const missionListContainer = document.getElementById('mission-list-container') as HTMLDivElement | null;

// --- +++ SISTEMA DE MISIONES +++ ---

interface Mission {
    id: string;
    title: string;
    type: 'DEPOSIT_ONCE' | 'SET_GOAL' | 'READ_TIP';
    params: { minAmount?: number };
    rewards: { points: number; water?: number; sun?: number };
    iconColor: string;
}

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
        id: 'Lee esto',
        title: 'Lee esto',
        type: 'READ_TIP',
        params: {},
        rewards: { points: 5 },
        iconColor: 'bg-blue'
    }
];

let activeDailyMissions: Mission[] = [];
let completedDailyMissionIds: string[] = [];

function loadDailyMissions() {
    activeDailyMissions = missionDatabase.slice(0, 3);
    completedDailyMissionIds = [];
    console.log('Misiones diarias cargadas:', activeDailyMissions);
}

function renderMissions() {
    if (!missionListContainer) return;

    missionListContainer.innerHTML = '';

    if (activeDailyMissions.length === 0) {
        missionListContainer.innerHTML = '<p class="text-gray-500 text-sm">No hay misiones por hoy, ¡vuelve mañana!</p>';
        return;
    }

    activeDailyMissions.forEach(mission => {
        const isCompleted = completedDailyMissionIds.includes(mission.id);

        const missionCard = document.createElement('div');
        missionCard.className = `mission-card ${isCompleted ? 'opacity-50' : ''}`;

        const iconBg = document.createElement('div');
        iconBg.className = `mission-icon-bg ${mission.iconColor} flex items-center justify-center text-2xl`;
        iconBg.innerHTML = isCompleted ? '✅' : '🎯';

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

function completeMission(mission: Mission) {
    console.log(`¡Misión completada: ${mission.title}!`);
    if (completedDailyMissionIds.includes(mission.id)) return;

    completedDailyMissionIds.push(mission.id);
    totalPuntos += mission.rewards.points;
    console.log(`+${mission.rewards.points} puntos. Total ahora: ${totalPuntos}`);

    actualizarUI();
}

// --- FUNCIONES DE LÓGICA DE DEPÓSITO ---

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
    if (metaDisplay) {
        metaDisplay.textContent = restante > 0
            ? `Meta ${formatCurrency(metaAhorro)} - Faltan ${formatCurrency(restante)}`
            : `¡Meta de ${formatCurrency(metaAhorro)} alcanzada!`;
    }

    if (progressBarFill) {
        const progreso = Math.min((totalAhorrado / metaAhorro) * 100, 100);
        progressBarFill.style.width = `${progreso}%`;
    }

    if (totalPuntosDisplay) {
        totalPuntosDisplay.textContent = Math.floor(totalPuntos).toString();
    }

    renderMissions();
}

function handleDeposit() {
    if (!depositInput) {
        console.error('Campo de depósito no encontrado');
        return;
    }

    const montoDepositado = parseFloat(depositInput.value);
    if (isNaN(montoDepositado) || montoDepositado <= 0) {
        console.error('Monto inválido');
        depositInput.value = '';
        return;
    }

    const puntosGanados = montoDepositado * PUNTOS_POR_PESO;
    totalAhorrado += montoDepositado;
    totalPuntos += puntosGanados;

    checkMissionProgress('DEPOSIT_ONCE', { amount: montoDepositado });

    actualizarUI();
    depositInput.value = '';
    closeDepositModal();
}

function openDepositModal() {
    if (!depositModal || !depositInput) return;
    depositModal.classList.remove('hidden');
    depositInput.focus();
}

function closeDepositModal() {
    if (!depositModal) return;
    depositModal.classList.add('hidden');
}

// --- ASIGNACIÓN DE EVENTOS DE DEPÓSITO ---
if (openModalBtn) openModalBtn.addEventListener('click', openDepositModal);
if (closeModalBtn) closeModalBtn.addEventListener('click', closeDepositModal);
if (confirmDepositBtn) confirmDepositBtn.addEventListener('click', handleDeposit);
if (depositModal) {
    depositModal.addEventListener('click', (event) => {
        if (event.target === depositModal) {
            closeDepositModal();
        }
    });
}

// --- INICIALIZACIÓN DE UI ---
document.addEventListener('DOMContentLoaded', () => {
    loadDailyMissions();
    actualizarUI();
    if (plantContainer) {
        init3DPlant();
    }
});

// --- LÓGICA DEL VISOR 3D (Three.js) ---
/* Mantengo tus @ts-ignore para dependencias cargadas vía <script> en HTML */
// @ts-ignore
const THREE = (window as any).THREE;
// @ts-ignore
const GLTFLoader = (window as any).GLTFLoader;
// @ts-ignore
const OrbitControls = (window as any).OrbitControls;

let scene: any, camera: any, renderer: any, controls: any, plantModel: any;

function init3DPlant() {
    if (!plantContainer || !THREE || !OrbitControls) return;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
        50,
        Math.max(1, plantContainer.clientWidth) / Math.max(1, plantContainer.clientHeight),
        0.1,
        1000
    );
    camera.position.z = 3;
    camera.position.y = 0.5;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(plantContainer.clientWidth, plantContainer.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    plantContainer.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2.0;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(2, 5, 3);
    scene.add(directionalLight);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x22c55e });
    plantModel = new THREE.Mesh(geometry, material);
    scene.add(plantModel);

    animate3D();
    window.addEventListener('resize', onWindowResize);
}

function animate3D() {
    requestAnimationFrame(animate3D);
    if (controls) controls.update();
    if (renderer && scene && camera) renderer.render(scene, camera);
}

function onWindowResize() {
    if (!plantContainer || !camera || !renderer) return;
    const width = plantContainer.clientWidth;
    const height = plantContainer.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}
