let recoveryEmailInProgress = '';
let recoveryCodeValidated = false;
let recoveryQuestionsValidated = false;

async function validateRecoveryEmail(email) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const response =
        await window.validateRecoveryEmailWithBackend?.(
            normalizedEmail
        );

    if (!response) {
        return {
            success: false,
            message: 'Servicio de validación de email no disponible.'
        };
    }

    if (!response.success) {
        return response;
    }

    recoveryEmailInProgress = normalizedEmail;
    recoveryCodeValidated = false;
    recoveryQuestionsValidated = false;

    return response;
}

async function startRecoveryByEmail(email) {
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!recoveryEmailInProgress || recoveryEmailInProgress !== normalizedEmail) {
        return {
            success: false,
            message: 'Primero debes validar el email.'
        };
    }

    const response =
        await window.requestResetCodeWithBackend?.(
            normalizedEmail
        );

    if (!response) {
        return {
            success: false,
            message: 'Servicio de recuperación no disponible.'
        };
    }

    if (!response.success) {
        return response;
    }

    recoveryEmailInProgress = normalizedEmail;
    recoveryCodeValidated = false;
    recoveryQuestionsValidated = false;

    return response;
}

async function validateRecoveryCode(code) {
    const normalizedCode = String(code || '').replace(/\D/g, '').slice(0, 4);

    if (normalizedCode.length !== 4) {
        return {
            success: false,
            message: 'El código debe tener 4 dígitos.'
        };
    }

    const response =
        await window.verifyResetCodeWithBackend?.(
            recoveryEmailInProgress,
            normalizedCode
        );

    if (!response) {
        return {
            success: false,
            message: 'Servicio de validación de código no disponible.'
        };
    }

    if (response.success) {
        recoveryCodeValidated = true;
    }

    return response;
}

async function loadRecoverySecurityQuestions() {
    if (!recoveryEmailInProgress) {
        return {
            success: false,
            message: 'No hay correo en proceso de recuperación.'
        };
    }

    if (!recoveryCodeValidated) {
        return {
            success: false,
            message: 'Primero debes validar el código.'
        };
    }

    const response =
        await window.getSecurityQuestionsWithBackend?.();

    if (!response) {
        return {
            success: false,
            message: 'Servicio de preguntas de seguridad no disponible.'
        };
    }

    return response;
}

async function validateRecoverySecurityAnswers(answer1, answer2) {
    if (!recoveryCodeValidated) {
        return {
            success: false,
            message: 'Primero debes validar el código.'
        };
    }

    const response =
        await window.verifySecurityAnswersWithBackend?.(
            answer1,
            answer2
        );

    if (!response) {
        return {
            success: false,
            message: 'Servicio de validación de preguntas no disponible.'
        };
    }

    recoveryQuestionsValidated = Boolean(response.success);
    return response;
}

async function saveRecoveredPassword(newPassword, confirmPassword) {
    const normalizedPassword = String(newPassword || '').trim();
    const normalizedConfirmPassword = String(confirmPassword || '').trim();

    if (!recoveryEmailInProgress) {
        return {
            success: false,
            message: 'No hay un correo en proceso de recuperación.'
        };
    }

    if (!recoveryCodeValidated) {
        return {
            success: false,
            message: 'Primero debes validar el código de seguridad.'
        };
    }

    if (!recoveryQuestionsValidated) {
        return {
            success: false,
            message: 'Primero debes validar tus preguntas de seguridad.'
        };
    }

    const passwordRuleResult = window.validatePasswordRules?.(normalizedPassword);

    if (!passwordRuleResult?.isValid) {
        return {
            success: false,
            message: passwordRuleResult?.message || 'La clave no cumple los requisitos.'
        };
    }

    if (!normalizedConfirmPassword || normalizedPassword !== normalizedConfirmPassword) {
        return {
            success: false,
            message: 'La confirmación no coincide con la nueva clave.'
        };
    }

    const response =
        await window.updatePasswordWithBackend?.(
            normalizedPassword
        );

    if (!response) {
        return {
            success: false,
            message: 'Servicio de actualización de clave no disponible.'
        };
    }

    return response;
}

window.validateRecoveryEmail = validateRecoveryEmail;
window.startRecoveryByEmail = startRecoveryByEmail;
window.validateRecoveryCode = validateRecoveryCode;
window.loadRecoverySecurityQuestions = loadRecoverySecurityQuestions;
window.validateRecoverySecurityAnswers = validateRecoverySecurityAnswers;
window.saveRecoveredPassword = saveRecoveredPassword;
