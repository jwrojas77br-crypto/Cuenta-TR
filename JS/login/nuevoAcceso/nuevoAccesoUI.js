const tabStep1 = document.getElementById('tab-step-1');
const tabStep2 = document.getElementById('tab-step-2');
const panelStep1 = document.getElementById('panel-step-1');
const panelStep2 = document.getElementById('panel-step-2');
const progressFill = document.getElementById('step-progress-fill');
const setupForm = document.getElementById('setup-form');

const newPasswordInput = document.getElementById('new-password');
const confirmPasswordInput = document.getElementById('confirm-password');
const newPasswordToggleButton = document.getElementById('new-password-toggle')?.closest('.password-toggle');
const confirmPasswordToggleButton = document.getElementById('confirm-password-toggle')?.closest('.password-toggle');
const newPasswordToggleIcon = document.getElementById('new-password-toggle');
const confirmPasswordToggleIcon = document.getElementById('confirm-password-toggle');

const continueButton = document.getElementById('continue-button');
const backButton = document.getElementById('back-button');
const cancelButton = document.getElementById('cancel-button');
const saveButton = document.getElementById('save-button');

const newPasswordError = document.getElementById('new-password-error');
const confirmPasswordError = document.getElementById('confirm-password-error');
const securityQuestion1Input = document.getElementById('security-question-1');
const securityAnswer1Input = document.getElementById('security-answer-1');
const securityQuestion2Input = document.getElementById('security-question-2');
const securityAnswer2Input = document.getElementById('security-answer-2');
const securityQuestion1Error = document.getElementById('security-question-1-error');
const securityAnswer1Error = document.getElementById('security-answer-1-error');
const securityQuestion2Error = document.getElementById('security-question-2-error');
const securityAnswer2Error = document.getElementById('security-answer-2-error');
const formResponse = document.getElementById('form-response');
const saveLoadingOverlay = document.getElementById('save-loading-overlay');
const saveLoadingProgress = document.getElementById('save-loading-progress');
const backendRejectedModal = document.getElementById('backend-rejected-modal');
const backendRejectedReason = document.getElementById('backend-rejected-reason');
const backendRejectedClose = document.getElementById('backend-rejected-close');

const exitConfirmModal = document.getElementById('exit-confirm');
const confirmExitButton = document.getElementById('confirm-exit');
const cancelExitButton = document.getElementById('cancel-exit');

// Controla en que seccion del formulario se encuentra el usuario.
// 1 = Creacion de clave, 2 = Preguntas de seguridad.
let currentStep = 1;
let saveProgressTimer = null;

/**
 * Pausa la ejecucion para controlar tiempos visuales del progreso de guardado.
 *
 * @param {number} milliseconds
 * @returns {Promise<void>}
 */
function wait(milliseconds) {
	return new Promise((resolve) => {
		setTimeout(resolve, milliseconds);
	});
}

/**
 * Muestra overlay y anima progreso incremental mientras ocurre el guardado.
 */
function startSaveProgress() {
	if (saveLoadingOverlay) {
		saveLoadingOverlay.classList.remove('hidden');
	}

	if (!saveLoadingProgress) {
		return;
	}

	saveLoadingProgress.style.width = '10%';

	if (saveProgressTimer) {
		clearInterval(saveProgressTimer);
	}

	saveProgressTimer = setInterval(() => {
		const currentWidth = Number.parseInt(saveLoadingProgress.style.width, 10) || 0;
		const nextWidth = Math.min(currentWidth + 12, 90);
		saveLoadingProgress.style.width = `${nextWidth}%`;

		if (nextWidth >= 90 && saveProgressTimer) {
			clearInterval(saveProgressTimer);
			saveProgressTimer = null;
		}
	}, 180);
}

/**
 * Completa visualmente la barra al 100% y oculta el overlay.
 */
async function finishSaveProgress() {
	if (saveProgressTimer) {
		clearInterval(saveProgressTimer);
		saveProgressTimer = null;
	}

	if (saveLoadingProgress) {
		saveLoadingProgress.style.width = '100%';
	}

	await wait(240);

	if (saveLoadingOverlay) {
		saveLoadingOverlay.classList.add('hidden');
	}

	if (saveLoadingProgress) {
		saveLoadingProgress.style.width = '0%';
	}
}

/**
 * Muestra vista de rechazo cuando el backend devuelve error.
 *
 * @param {string} reason
 * @param {string | undefined} requestId
 */
function showBackendRejectedView(reason, requestId) {
	if (backendRejectedReason) {
		const requestTrace = requestId ? ` Referencia: ${requestId}.` : '';
		backendRejectedReason.textContent = `${reason}${requestTrace}`;
	}

	backendRejectedModal?.classList.remove('hidden');
}

/**
 * Oculta la vista de rechazo del backend.
 */
function hideBackendRejectedView() {
	backendRejectedModal?.classList.add('hidden');
}

/**
 * Registra el comportamiento mostrar/ocultar contraseña para un campo.
 *
 * @param {HTMLElement | null | undefined} passwordToggleButton Boton con icono de ojo.
 * @param {HTMLInputElement | null | undefined} passwordInput Input tipo password/text.
 * @param {HTMLElement | null | undefined} passwordToggleIcon Icono que cambia entre visibility y visibility_off.
 */
function registerPasswordToggle(passwordToggleButton, passwordInput, passwordToggleIcon) {
	if (!passwordToggleButton || !passwordInput || !passwordToggleIcon) {
		return;
	}

	passwordToggleButton.addEventListener('click', (event) => {
		event.preventDefault();

		const isPasswordVisible = passwordInput.type === 'password';

		if (isPasswordVisible) {
			passwordInput.type = 'text';
			passwordToggleIcon.textContent = 'visibility_off';
		} else {
			passwordInput.type = 'password';
			passwordToggleIcon.textContent = 'visibility';
		}
	});
}

/**
 * Cambia visualmente entre Paso 1 y Paso 2.
 *
 * Efectos:
 * - Muestra/oculta paneles.
 * - Actualiza estado activo/completado de pestanas.
 * - Ajusta atributos ARIA para accesibilidad.
 * - Actualiza la barra de progreso.
 *
 * @param {number} stepNumber Paso destino (1 o 2).
 */
function setStep(stepNumber) {
	const isStepOne = stepNumber === 1;
	currentStep = stepNumber;

	panelStep1?.classList.toggle('is-hidden', !isStepOne);
	panelStep2?.classList.toggle('is-hidden', isStepOne);

	tabStep1?.classList.toggle('is-active', isStepOne);
	tabStep2?.classList.toggle('is-active', !isStepOne);

	tabStep1?.classList.toggle('is-completed', !isStepOne);

	tabStep1?.setAttribute('aria-selected', String(isStepOne));
	tabStep2?.setAttribute('aria-selected', String(!isStepOne));

	if (progressFill) {
		progressFill.classList.toggle('step-1', isStepOne);
		progressFill.classList.toggle('step-2', !isStepOne);
	}
}

/**
 * Intenta avanzar al Paso 2 solo si el Paso 1 es valido.
 * Reutiliza la validacion central para no duplicar reglas.
 */
function goToStepTwoIfValid() {
	if (validateStepOne(true)) {
		setStep(2);
	}
}

/**
 * Limpia mensajes de error del bloque de creacion de clave.
 * Se invoca antes de cada nueva validacion del paso 1.
 */
function clearStepOneErrors() {
	if (newPasswordError) {
		newPasswordError.textContent = '';
	}

	if (confirmPasswordError) {
		confirmPasswordError.textContent = '';
	}
}

/**
 * Valida los campos del Paso 1:
 * - Seguridad de clave (reglas del service).
 * - Coincidencia entre clave y confirmacion.
 *
 * Ademas habilita o bloquea el acceso a la pestana del Paso 2.
 *
 * @param {boolean} showErrors Si es true, pinta mensajes en pantalla.
 * @returns {boolean} true cuando el paso 1 cumple todas las reglas.
 */
function validateStepOne(showErrors = false) {
	const newPasswordValue = newPasswordInput?.value.trim() || '';
	const confirmPasswordValue = confirmPasswordInput?.value.trim() || '';

	let isValid = true;

	clearStepOneErrors();

	const passwordSecurityResult = window.validatePasswordSecurity?.(newPasswordValue);

	if (!passwordSecurityResult?.isValid) {
		isValid = false;
		if (showErrors && newPasswordError) {
			newPasswordError.textContent = passwordSecurityResult?.message || 'La clave no cumple los requisitos de seguridad.';
		}
	}

	if (!confirmPasswordValue || confirmPasswordValue !== newPasswordValue) {
		isValid = false;
		if (showErrors && confirmPasswordError) {
			confirmPasswordError.textContent = 'La confirmación no coincide con la contraseña.';
		}
	}

	if (tabStep2) {
		tabStep2.disabled = !isValid;
	}

	return isValid;
}

/**
 * Limpia errores visuales y de texto del Paso 2.
 */
function clearStepTwoErrors() {
	const errorElements = [securityQuestion1Error, securityAnswer1Error, securityQuestion2Error, securityAnswer2Error];
	const inputElements = [securityQuestion1Input, securityAnswer1Input, securityQuestion2Input, securityAnswer2Input];

	errorElements.forEach((element) => {
		if (element) {
			element.textContent = '';
		}
	});

	inputElements.forEach((input) => {
		input?.closest('.input-block')?.classList.remove('error');
	});
}

/**
 * Valida que las preguntas y respuestas de seguridad no esten vacias.
 *
 * @param {boolean} showErrors Si es true, muestra errores por campo.
 * @returns {boolean} true cuando todos los campos del paso 2 tienen valor.
 */
function validateStepTwoRequiredFields(showErrors = false) {
	const stepTwoFields = [
		{ input: securityQuestion1Input, error: securityQuestion1Error, message: 'La pregunta 1 es obligatoria.' },
		{ input: securityAnswer1Input, error: securityAnswer1Error, message: 'La respuesta 1 es obligatoria.' },
		{ input: securityQuestion2Input, error: securityQuestion2Error, message: 'La pregunta 2 es obligatoria.' },
		{ input: securityAnswer2Input, error: securityAnswer2Error, message: 'La respuesta 2 es obligatoria.' }
	];

	let isValid = true;

	clearStepTwoErrors();

	stepTwoFields.forEach((field) => {
		const fieldValue = field.input?.value.trim() || '';

		if (fieldValue) {
			return;
		}

		isValid = false;

		if (showErrors) {
			if (field.error) {
				field.error.textContent = field.message;
			}

			field.input?.closest('.input-block')?.classList.add('error');
		}
	});

	return isValid;
}

/**
 * Ejecuta el guardado de datos en variables cuando el paso 2 ya es valido.
 *
 * @returns {Promise<boolean>} true si se guardo correctamente.
 */
async function processStepTwoSave() {
	const isStepTwoValid = validateStepTwoRequiredFields(true);

	if (!isStepTwoValid) {
		if (formResponse) {
			formResponse.textContent = 'Completa preguntas y respuestas para guardar.';
			formResponse.classList.add('server-error');
		}
		return false;
	}

	startSaveProgress();
	await wait(450);

	const saveResponse = await window.submitNewAccessConfiguration?.({
		newPassword: newPasswordInput?.value || '',
		securityQuestion1: securityQuestion1Input?.value || '',
		securityAnswer1: securityAnswer1Input?.value || '',
		securityQuestion2: securityQuestion2Input?.value || '',
		securityAnswer2: securityAnswer2Input?.value || ''
	});

	await finishSaveProgress();

	if (!saveResponse?.success) {
		if (formResponse) {
			const requestTrace = saveResponse?.requestId ? ` (Ref: ${saveResponse.requestId})` : '';
			formResponse.textContent = `${saveResponse?.message || 'No se pudieron guardar los datos de acceso.'}${requestTrace}`;
			formResponse.classList.add('server-error');
		}

		if (saveResponse?.status === 'rejected') {
			showBackendRejectedView(
				saveResponse.message || 'El backend rechazo la solicitud de guardado.',
				saveResponse.requestId
			);
		}

		return false;
	}

	if (formResponse) {
		const requestTrace = saveResponse.requestId ? ` (Ref: ${saveResponse.requestId})` : '';
		formResponse.textContent = `${saveResponse.message || 'Datos guardados correctamente.'}${requestTrace}`;
		formResponse.classList.remove('server-error');
	}

	sessionStorage.setItem('tr-authenticated', '1');
	window.location.replace('../HTML/wallet.html');

	return true;
}

/**
 * Muestra el modal de confirmacion de salida sin guardar.
 */
function openExitConfirm() {
	exitConfirmModal?.classList.remove('hidden');
}

/**
 * Oculta el modal de confirmacion de salida.
 */
function closeExitConfirm() {
	exitConfirmModal?.classList.add('hidden');
}

/**
 * Registra eventos de navegacion entre pasos y validacion en vivo.
 *
 * Eventos cubiertos:
 * - Click en pestanas.
 * - Botones Continuar y Volver.
 * - Input en campos de clave para validar mientras se escribe.
 */
function registerStepEvents() {
	tabStep1?.addEventListener('click', () => {
		setStep(1);
	});

	tabStep2?.addEventListener('click', () => {
		goToStepTwoIfValid();
	});

	continueButton?.addEventListener('click', () => {
		goToStepTwoIfValid();
	});

	backButton?.addEventListener('click', () => {
		setStep(1);
	});

	newPasswordInput?.addEventListener('input', () => {
		validateStepOne(false);
	});

	confirmPasswordInput?.addEventListener('input', () => {
		validateStepOne(false);
	});

	securityQuestion1Input?.addEventListener('input', () => {
		validateStepTwoRequiredFields(false);
	});

	securityAnswer1Input?.addEventListener('input', () => {
		validateStepTwoRequiredFields(false);
	});

	securityQuestion2Input?.addEventListener('input', () => {
		validateStepTwoRequiredFields(false);
	});

	securityAnswer2Input?.addEventListener('input', () => {
		validateStepTwoRequiredFields(false);
	});
}

/**
 * Controla comportamiento del formulario para evitar recarga accidental.
 *
 * Reglas:
 * - submit siempre preventDefault (flujo SPA/cliente).
 * - Enter en Paso 1 ejecuta logica de Continuar.
 * - Guardar se mantiene temporalmente sin envio real.
 */
function registerFormSubmitHandling() {
	setupForm?.addEventListener('submit', (event) => {
		event.preventDefault();
	});

	setupForm?.addEventListener('keydown', (event) => {
		if (event.key !== 'Enter') {
			return;
		}

		const targetTag = String(event.target?.tagName || '').toLowerCase();

		if (targetTag === 'textarea') {
			return;
		}

		if (currentStep === 1) {
			event.preventDefault();
			goToStepTwoIfValid();
			return;
		}

		if (currentStep === 2) {
			event.preventDefault();
			void processStepTwoSave();
		}
	});

	saveButton?.addEventListener('click', (event) => {
		event.preventDefault();
		void processStepTwoSave();
	});
}

/**
 * Registra eventos del modal de salida:
 * - Cancelar (abre modal)
 * - No (cierra modal)
 * - Si (navega a login)
 */
function registerExitModalEvents() {
	cancelButton?.addEventListener('click', () => {
		openExitConfirm();
	});

	cancelExitButton?.addEventListener('click', () => {
		closeExitConfirm();
	});

	confirmExitButton?.addEventListener('click', () => {
		window.location.href = '../HTML/login.html';
	});
}

/**
 * Registra eventos de cierre de la vista de rechazo del backend.
 */
function registerBackendRejectedEvents() {
	backendRejectedClose?.addEventListener('click', () => {
		hideBackendRejectedView();
	});

	backendRejectedModal?.addEventListener('click', (event) => {
		if (event.target === backendRejectedModal) {
			hideBackendRejectedView();
		}
	});
}

/**
 * Punto de entrada de la vista Nuevo Acceso.
 * Inicializa estado, validaciones y todos los listeners de UI.
 */
function initNuevoAccesoTabs() {
	setStep(1);
	validateStepOne(false);
	registerPasswordToggle(newPasswordToggleButton, newPasswordInput, newPasswordToggleIcon);
	registerPasswordToggle(confirmPasswordToggleButton, confirmPasswordInput, confirmPasswordToggleIcon);
	registerStepEvents();
	registerFormSubmitHandling();
	registerExitModalEvents();
	registerBackendRejectedEvents();
}

initNuevoAccesoTabs();

