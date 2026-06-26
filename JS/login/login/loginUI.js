const loginForm = document.querySelector('form');
const emailInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const emailError = document.getElementById('username-error');
const passwordError = document.getElementById('password-error');
const serverResponse = document.getElementById('server-response');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const loadingOverlay = document.getElementById('loading-overlay');
const loadingProgress = document.querySelector('.loading-progress');
const codeModal = document.getElementById('code-modal');
const codeDigitInputs = Array.from(document.querySelectorAll('.code-digit-input'));
const codeError = document.getElementById('code-error');
const codeSubmit = document.getElementById('code-submit');
const codeModalClose = document.querySelector('.code-modal-close');
const codeModalLoader = document.querySelector('.code-modal-loader');
const newUserAck = document.getElementById('new-user-ack');
const codeField = document.querySelector('.code-field');
const codeHelp = document.querySelector('.code-help');
const codeModalText = document.querySelector('.modal-text');
const supportButton = document.querySelector('.support-button');

let pendingRedirectUrl = '';

/**
 * Limpia todos los mensajes de error mostrados en los campos
 * Establece el contenido en vacío para que no aparezcan mensajes previos
 */
function clearErrors() {
    emailError.textContent = '';
    passwordError.textContent = '';
    serverResponse.textContent = '';
}

/**
 * Muestra el overlay de carga del login mientras se verifica el usuario
 */
function showLoginLoading() {
    if (loadingOverlay) {
        loadingOverlay.classList.remove('hidden');
    }
    if (loadingProgress) {
        loadingProgress.classList.add('active');
    }
}

/**
 * Oculta el overlay de carga del login después de la verificación
 */
function hideLoginLoading() {
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
    }
    if (loadingProgress) {
        loadingProgress.classList.remove('active');
    }
}

/**
 * Muestra el modal de verificación de seguridad
 */
function showSecurityCodeModal() {
    if (codeModal) {
        codeModal.classList.remove('hidden');
    }
    if (codeError) {
        codeError.textContent = '';
    }
    if (codeDigitInputs.length > 0) {
        codeDigitInputs.forEach((input) => {
            input.value = '';
        });
        codeDigitInputs[0].focus();
    }

    if (codeModalText) {
        codeModalText.textContent = 'Se ha enviado un código de 4 dígitos a tu email. Ingresa el código para continuar.';
    }

    if (codeField) {
        codeField.style.display = '';
    }

    if (codeSubmit) {
        codeSubmit.style.display = '';
    }

    if (codeHelp) {
        codeHelp.style.display = '';
    }

    if (newUserAck) {
        newUserAck.style.display = 'none';
    }

    pendingRedirectUrl = '';

    updateCodeSubmitButtonState();
}

/**
 * Oculta el modal de verificación de seguridad
 */
function hideSecurityCodeModal() {
    if (codeModal) {
        codeModal.classList.add('hidden');
    }
}

function showNewUserRedirectNotice(nextUrl) {
    pendingRedirectUrl = nextUrl || '../HTML/nuevoAcceso.html';

    if (codeModalText) {
        codeModalText.textContent = 'Tu usuario es nuevo. Serás direccionado para configurar tu acceso.';
    }

    if (codeField) {
        codeField.style.display = 'none';
    }

    if (codeSubmit) {
        codeSubmit.style.display = 'none';
    }

    if (codeHelp) {
        codeHelp.style.display = 'none';
    }

    if (newUserAck) {
        newUserAck.style.display = 'block';
        newUserAck.focus();
    }
}

/**
 * Muestra el loader dentro del modal de código mientras se valida el código
 */
function showCodeModalLoader() {
    if (codeModalLoader) {
        codeModalLoader.classList.remove('hidden');
    }
}

/**
 * Oculta el loader dentro del modal de código
 */
function hideCodeModalLoader() {
    if (codeModalLoader) {
        codeModalLoader.classList.add('hidden');
    }
}

/**
 * Habilita el boton de validar codigo solo cuando hay 4 digitos ingresados.
 * Mientras no exista un codigo valido, mantiene el boton deshabilitado.
 */
function updateCodeSubmitButtonState() {
    if (!codeSubmit || codeDigitInputs.length === 0) {
        return;
    }

    const codeValue = codeDigitInputs.map((input) => input.value).join('');
    codeSubmit.disabled = codeValue.length !== 4;
}

/**
 * Obtiene el código de 4 dígitos ingresado en el modal.
 *
 * @returns {string} Código concatenado
 */
function getSecurityCodeValue() {
    if (codeDigitInputs.length === 0) {
        return '';
    }

    return codeDigitInputs.map((input) => input.value).join('');
}

/**
 * Valida el código ingresado por el usuario y consulta al backend.
 * Durante la verificación activa el loader del modal.
 */
async function validateSecurityCode() {
    const codeValue = getSecurityCodeValue();

    if (codeValue.length !== 4) {
        if (codeError) {
            codeError.textContent = 'Ingresa los 4 dígitos del código.';
        }
        return;
    }

    if (codeError) {
        codeError.textContent = '';
    }

    showCodeModalLoader();
    if (codeSubmit) {
        codeSubmit.disabled = true;
    }

    const response = await window.validateSecurityCodeWithController?.(codeValue);

    hideCodeModalLoader();
    updateCodeSubmitButtonState();

    if (!response || !response.success) {
        if (codeError) {
            codeError.textContent = response?.message || 'El código ingresado no es válido.';
        }
        return;
    }

    if (codeError) {
        codeError.textContent = '';
    }

    if (response.isNewUser) {
        showNewUserRedirectNotice(response.nextUrl);
        return;
    }

    hideSecurityCodeModal();
    serverResponse.textContent = response.message || 'Código validado correctamente.';
    serverResponse.classList.remove('server-error');

    if (response.nextUrl) {
        window.location.href = response.nextUrl;
    }
}

window.showSecurityCodeModal = showSecurityCodeModal;
window.hideSecurityCodeModal = hideSecurityCodeModal;

if (codeModalClose) {
    codeModalClose.addEventListener('click', (event) => {
        event.preventDefault();
        hideSecurityCodeModal();
    });
}

if (codeSubmit) {
    codeSubmit.addEventListener('click', async (event) => {
        event.preventDefault();
        await validateSecurityCode();
    });
}

if (newUserAck) {
    newUserAck.addEventListener('click', (event) => {
        event.preventDefault();

        if (pendingRedirectUrl) {
            window.location.href = pendingRedirectUrl;
        }
    });
}

if (codeDigitInputs.length > 0) {
    codeDigitInputs.forEach((input, index) => {
        input.addEventListener('input', (event) => {
            const normalizedValue = event.target.value.replace(/\D/g, '').slice(-1);
            event.target.value = normalizedValue;

            if (normalizedValue && index < codeDigitInputs.length - 1) {
                codeDigitInputs[index + 1].focus();
            }

            updateCodeSubmitButtonState();
        });

        input.addEventListener('keydown', (event) => {
            if (event.key === 'Backspace' && !input.value && index > 0) {
                codeDigitInputs[index - 1].focus();
            }
        });

        input.addEventListener('paste', (event) => {
            const pastedText = event.clipboardData?.getData('text') || '';
            const digits = pastedText.replace(/\D/g, '').slice(0, codeDigitInputs.length);

            if (!digits) {
                return;
            }

            event.preventDefault();

            digits.split('').forEach((digit, digitIndex) => {
                if (codeDigitInputs[digitIndex]) {
                    codeDigitInputs[digitIndex].value = digit;
                }
            });

            const nextIndex = Math.min(digits.length, codeDigitInputs.length - 1);
            codeDigitInputs[nextIndex].focus();

            updateCodeSubmitButtonState();
        });
    });
}

updateCodeSubmitButtonState();

/**
 * Valida que los campos de correo y contraseña cumplan con los requisitos
 * 
 * Validaciones:
 * - Email: No puede estar vacío y debe tener formato válido (user@domain.ext)
 * - Password: No puede estar vacío
 * 
 * @returns {boolean} true si los campos son válidos, false si hay errores
 */
function validateLoginFields() {
    clearErrors();

    const emailValue = emailInput.value.trim();
    const passwordValue = passwordInput.value.trim();
    let isValid = true;

    if (!emailValue) {
        emailError.textContent = 'El correo es obligatorio.';
        isValid = false;
    } else if (!emailPattern.test(emailValue)) {
        emailError.textContent = 'Ingresa un correo electrónico válido.';
        isValid = false;
    }

    if (!passwordValue) {
        passwordError.textContent = 'La contraseña no puede estar vacía.';
        isValid = false;
    }

    return isValid;
}

/**
 * Manejador del evento submit del formulario de login
 * 
 * Proceso:
 * 1. Previene el envío automático del formulario
 * 2. Valida que los campos cumplan los requisitos
 * 3. Si hay errores, muestra mensajes y detiene el proceso
 * 4. Si todo es válido, almacena las credenciales para verificación
 */
if (loginForm) {
    loginForm.setAttribute('novalidate', '');

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!validateLoginFields()) {
            serverResponse.textContent = 'Revisa los campos marcados antes de continuar.';
            serverResponse.classList.add('server-error');
            return;
        }

        serverResponse.textContent = '';
        serverResponse.classList.remove('server-error');

        showLoginLoading();
        const response = await window.authenticateLogin?.();
        hideLoginLoading();

        if (!response || !response.success) {
            serverResponse.textContent = response?.message || 'No se pudo verificar el usuario.';
            serverResponse.classList.add('server-error');
            return;
        }

        serverResponse.textContent = response.message;
        serverResponse.classList.remove('server-error');
        // Aquí puede continuar el flujo exitoso (redirigir, mostrar modal, etc.)
    });
}

/**
 * Manejador para mostrar/ocultar la contraseña
 * 
 * Funcionalidad:
 * - Al hacer clic alterna entre type="password" y type="text"
 * - Cambia el icono del ojo entre "visibility" (normal) y "visibility_off" (tachado)
 * - Previene el envío del formulario al hacer clic
 */
const passwordToggleButton = document.querySelector('.password-toggle');
const passwordToggleIcon = document.getElementById('password-toggle-icon');

if (passwordToggleButton && passwordInput) {
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
 * Redirige al canal de soporte por WhatsApp al hacer clic en "Necesitas ayuda".
 */
if (supportButton) {
    supportButton.addEventListener('click', (event) => {
        event.preventDefault();

        const supportPhone = '557996718294';
        const supportMessage = 'Hola, necesito ayuda con mi acceso a Cuenta TR.';
        const whatsappUrl = `https://wa.me/${supportPhone}?text=${encodeURIComponent(supportMessage)}`;
        const popup = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

        if (!popup) {
            window.location.href = whatsappUrl;
        }
    });
}



