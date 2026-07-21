const stepEmail = document.getElementById('step-email');
const stepSendCode = document.getElementById('step-send-code');
const stepCode = document.getElementById('step-code');
const stepQuestions = document.getElementById('step-questions');
const stepPassword = document.getElementById('step-password');
const recoverStepProgressFill = document.getElementById('recover-step-progress-fill');
const recoverStepChips = [
    document.getElementById('recover-chip-1'),
    document.getElementById('recover-chip-2'),
    document.getElementById('recover-chip-3'),
    document.getElementById('recover-chip-4'),
    document.getElementById('recover-chip-5')
];

const recoverEmailInput = document.getElementById('recover-email');
const validateEmailButton = document.getElementById('validate-email-button');
const sendCodeButton = document.getElementById('send-code-button');

const codeInputs = Array.from(document.querySelectorAll('.recover-code-input'));
const verifyCodeButton = document.getElementById('verify-code-button');

const securityQuestion1Text = document.getElementById('security-question-1');
const securityQuestion2Text = document.getElementById('security-question-2');
const securityAnswer1Input = document.getElementById('security-answer-1');
const securityAnswer2Input = document.getElementById('security-answer-2');
const verifyQuestionsButton = document.getElementById('verify-questions-button');
const stepQuestionsResponse = document.getElementById('step-questions-response');

const recoverPasswordInput = document.getElementById('recover-password');
const recoverPasswordConfirmInput = document.getElementById('recover-password-confirm');
const savePasswordButton = document.getElementById('save-password-button');
const stepPasswordResponse = document.getElementById('step-password-response');
const cancelRecoveryButtons = Array.from(document.querySelectorAll('.cancel-recovery-button'));

const cancelRecoveryModal = document.getElementById('cancel-recovery-modal');
const confirmCancelRecoveryButton = document.getElementById('confirm-cancel-recovery');
const closeCancelRecoveryButton = document.getElementById('close-cancel-recovery');

const toggleRecoverPassword = document.getElementById('toggle-recover-password');
const toggleRecoverPasswordConfirm = document.getElementById('toggle-recover-password-confirm');

const recoverResponse = document.getElementById('recover-response');
const RECOVERY_EMAIL_DRAFT_KEY = 'tr-recovery-email-draft';
const RECOVERY_RESET_EMAIL_KEY = 'tr-reset-email';

const stepOrderByName = {
    email: 1,
    'send-code': 2,
    code: 3,
    questions: 4,
    password: 5
};

function updateStepProgress(stepName) {
    const stepNumber = stepOrderByName[stepName] || 1;

    if (recoverStepProgressFill) {
        recoverStepProgressFill.className = `step-progress-fill step-${stepNumber}`;
    }

    recoverStepChips.forEach((chip, index) => {
        if (!chip) {
            return;
        }

        const chipNumber = index + 1;
        chip.classList.toggle('is-active', chipNumber === stepNumber);
        chip.classList.toggle('is-completed', chipNumber < stepNumber);
    });
}

function setActiveStep(stepName) {
    const isEmailStep = stepName === 'email';
    const isSendCodeStep = stepName === 'send-code';
    const isCodeStep = stepName === 'code';
    const isQuestionsStep = stepName === 'questions';
    const isPasswordStep = stepName === 'password';

    stepEmail?.classList.toggle('is-active', isEmailStep);
    stepSendCode?.classList.toggle('is-active', isSendCodeStep);
    stepCode?.classList.toggle('is-active', isCodeStep);
    stepQuestions?.classList.toggle('is-active', isQuestionsStep);
    stepPassword?.classList.toggle('is-active', isPasswordStep);

    updateStepProgress(stepName);
}

function setResponseMessage(message, hasError = false) {
    const activeInlineResponse = stepQuestions?.classList.contains('is-active')
        ? stepQuestionsResponse
        : (stepPassword?.classList.contains('is-active') ? stepPasswordResponse : null);

    if (hasError && activeInlineResponse) {
        activeInlineResponse.textContent = message || '';
        activeInlineResponse.classList.add('error');

        if (recoverResponse) {
            recoverResponse.textContent = '';
            recoverResponse.classList.remove('error');
        }

        return;
    }

    if (stepQuestionsResponse) {
        stepQuestionsResponse.textContent = '';
        stepQuestionsResponse.classList.remove('error');
    }

    if (stepPasswordResponse) {
        stepPasswordResponse.textContent = '';
        stepPasswordResponse.classList.remove('error');
    }

    if (!recoverResponse) {
        return;
    }

    recoverResponse.textContent = message || '';
    recoverResponse.classList.toggle('error', hasError);
}

function setButtonLoading(button, loadingText, isLoading) {
    if (!button) {
        return;
    }

    if (isLoading) {
        button.dataset.defaultLabel = button.textContent;
        button.textContent = loadingText;
        button.disabled = true;
        return;
    }

    if (button.dataset.defaultLabel) {
        button.textContent = button.dataset.defaultLabel;
    }

    button.disabled = false;
}

function getRecoveryCodeFromInputs() {
    return codeInputs.map((input) => input.value).join('');
}

function registerCodeInputBehavior() {
    if (codeInputs.length === 0) {
        return;
    }

    codeInputs.forEach((input, index) => {
        input.addEventListener('input', (event) => {
            const normalized = event.target.value.replace(/\D/g, '').slice(-1);
            event.target.value = normalized;

            if (normalized && index < codeInputs.length - 1) {
                codeInputs[index + 1].focus();
            }
        });

        input.addEventListener('keydown', (event) => {
            if (event.key === 'Backspace' && !input.value && index > 0) {
                codeInputs[index - 1].focus();
            }
        });
    });
}

function registerPasswordToggle(button, input) {
    if (!button || !input) {
        return;
    }

    button.addEventListener('click', () => {
        const icon = button.querySelector('.material-symbols-outlined');
        const shouldShow = input.type === 'password';

        input.type = shouldShow ? 'text' : 'password';

        if (icon) {
            icon.textContent = shouldShow ? 'visibility_off' : 'visibility';
        }
    });
}

function loadRecoveryEmailDraft() {
    const savedEmail = sessionStorage.getItem(RECOVERY_EMAIL_DRAFT_KEY) || '';

    if (recoverEmailInput && savedEmail) {
        recoverEmailInput.value = savedEmail;
    }
}

function openCancelRecoveryModal() {
    cancelRecoveryModal?.classList.remove('hidden');
}

function closeCancelRecoveryModal() {
    cancelRecoveryModal?.classList.add('hidden');
}

function clearRecoveryProgress() {
    sessionStorage.removeItem(RECOVERY_EMAIL_DRAFT_KEY);
    sessionStorage.removeItem(RECOVERY_RESET_EMAIL_KEY);
    sessionStorage.removeItem(
        'tr-recovery-token'
    );
    sessionStorage.removeItem(
        'tr-password-reset-token'
    );
}

async function handleValidateEmail() {
    const emailValue = recoverEmailInput?.value || '';

    setButtonLoading(validateEmailButton, 'Validando email...', true);
    setResponseMessage('Validando email registrado...');

    const response = await window.validateRecoveryEmail?.(emailValue);

    setButtonLoading(validateEmailButton, '', false);

    if (!response?.success) {
        setResponseMessage(response?.message || 'No se pudo validar el email.', true);
        return;
    }

    sessionStorage.setItem(RECOVERY_EMAIL_DRAFT_KEY, String(emailValue || '').trim().toLowerCase());
    setResponseMessage(response.message || 'Email validado. Continúa con el envío de código.');
    setActiveStep('send-code');
}

async function handleSendCode() {
    const emailValue = recoverEmailInput?.value || '';

    setButtonLoading(sendCodeButton, 'Enviando código...', true);
    setResponseMessage('Solicitando código de verificación...');

    const response = await window.startRecoveryByEmail?.(emailValue);

    setButtonLoading(sendCodeButton, '', false);

    if (!response?.success) {
        setResponseMessage(response?.message || 'No se pudo iniciar la recuperación.', true);
        return;
    }

    setResponseMessage(response.message || 'Código enviado. Ahora valídalo para continuar.');
    setActiveStep('code');

    if (codeInputs[0]) {
        codeInputs[0].focus();
    }
}

async function handleVerifyCode() {
    const codeValue = getRecoveryCodeFromInputs();

    setButtonLoading(verifyCodeButton, 'Validando...', true);
    setResponseMessage('Validando código de recuperación...');

    const response = await window.validateRecoveryCode?.(codeValue);

    setButtonLoading(verifyCodeButton, '', false);

    if (!response?.success) {
        setResponseMessage(response?.message || 'No se pudo validar el código.', true);
        return;
    }

    const questionsResponse = await window.loadRecoverySecurityQuestions?.();

    if (!questionsResponse?.success) {
        setResponseMessage(questionsResponse?.message || 'No se pudieron cargar las preguntas.', true);
        return;
    }

    securityQuestion1Text.textContent = questionsResponse.questions?.question1 || 'Pregunta no disponible';
    securityQuestion2Text.textContent = questionsResponse.questions?.question2 || 'Pregunta no disponible';
    securityAnswer1Input.value = '';
    securityAnswer2Input.value = '';

    setResponseMessage('Código válido. Responde tus preguntas de seguridad.');
    setActiveStep('questions');
    securityAnswer1Input?.focus();
}

async function handleVerifyQuestions() {
    const answer1 = securityAnswer1Input?.value || '';
    const answer2 = securityAnswer2Input?.value || '';

    setButtonLoading(verifyQuestionsButton, 'Validando preguntas...', true);
    setResponseMessage('Validando preguntas de seguridad...');

    const response = await window.validateRecoverySecurityAnswers?.(answer1, answer2);

    setButtonLoading(verifyQuestionsButton, '', false);

    if (!response?.success) {
        setResponseMessage(response?.message || 'No se pudieron validar las preguntas.', true);
        return;
    }

    setResponseMessage(response.message || 'Preguntas validadas. Ahora cambia tu clave.');
    setActiveStep('password');
    recoverPasswordInput?.focus();
}

async function handleSavePassword() {
    const passwordValue = recoverPasswordInput?.value || '';
    const confirmPasswordValue = recoverPasswordConfirmInput?.value || '';

    setButtonLoading(savePasswordButton, 'Guardando...', true);
    setResponseMessage('Guardando nueva clave...');

    const response = await window.saveRecoveredPassword?.(passwordValue, confirmPasswordValue);

    setButtonLoading(savePasswordButton, '', false);

    if (!response?.success) {
        setResponseMessage(response?.message || 'No se pudo actualizar la clave.', true);
        return;
    }

    setResponseMessage('Clave actualizada. Serás redirigido al login.');

    setTimeout(() => {
        window.location.replace('../HTML/login.html');
    }, 1200);
}

function registerEvents() {
    validateEmailButton?.addEventListener('click', () => {
        void handleValidateEmail();
    });

    sendCodeButton?.addEventListener('click', () => {
        void handleSendCode();
    });

    verifyCodeButton?.addEventListener('click', () => {
        void handleVerifyCode();
    });

    verifyQuestionsButton?.addEventListener('click', () => {
        void handleVerifyQuestions();
    });

    savePasswordButton?.addEventListener('click', () => {
        void handleSavePassword();
    });

    cancelRecoveryButtons.forEach((button) => {
        button.addEventListener('click', () => {
            openCancelRecoveryModal();
        });
    });

    closeCancelRecoveryButton?.addEventListener('click', () => {
        closeCancelRecoveryModal();
    });

    confirmCancelRecoveryButton?.addEventListener('click', () => {
        clearRecoveryProgress();
        window.location.replace('../HTML/login.html');
    });

    cancelRecoveryModal?.addEventListener('click', (event) => {
        if (event.target === cancelRecoveryModal) {
            closeCancelRecoveryModal();
        }
    });
}

loadRecoveryEmailDraft();
setActiveStep('email');
registerCodeInputBehavior();
registerPasswordToggle(toggleRecoverPassword, recoverPasswordInput);
registerPasswordToggle(toggleRecoverPasswordConfirm, recoverPasswordConfirmInput);
registerEvents();
