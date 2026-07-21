const RECOVERY_TOKEN_KEY =
    'tr-recovery-token';
const PASSWORD_RESET_TOKEN_KEY =
    'tr-password-reset-token';
const RESET_EMAIL_KEY = 'tr-reset-email';

function isValidEmailFormat(email) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(String(email || '').trim());
}

async function validateRecoveryEmailWithBackend(email) {
    const normalizedEmail =
        String(email || '').trim().toLowerCase();

    if (!isValidEmailFormat(normalizedEmail)) {
        return {
            success: false,
            message: 'Ingresa un correo electronico valido.'
        };
    }

    const endpoint = window.getApiEndpoint(
        '/api/auth/recovery/validate-email'
    );

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email: normalizedEmail
            })
        });

        const data = await response.json();

        return {
            success: Boolean(data?.ok || data?.success),
            message:
                data?.message ||
                'No se pudo validar el correo.'
        };
    } catch (error) {
        console.error(
            'Error validando el correo:',
            error
        );

        return {
            success: false,
            message:
                'Error de comunicacion al validar el correo.'
        };
    }
}

function validatePasswordRules(password) {
    const normalizedPassword = String(password || '');

    if (normalizedPassword.length < 8) {
        return {
            isValid: false,
            message: 'La clave debe tener al menos 8 caracteres.'
        };
    }

    if (!/[A-Z]/.test(normalizedPassword)) {
        return {
            isValid: false,
            message: 'La clave debe incluir al menos una mayúscula.'
        };
    }

    if (!/[a-z]/.test(normalizedPassword)) {
        return {
            isValid: false,
            message: 'La clave debe incluir al menos una minúscula.'
        };
    }

    if (!/\d/.test(normalizedPassword)) {
        return {
            isValid: false,
            message: 'La clave debe incluir al menos un número.'
        };
    }

    if (/\s/.test(normalizedPassword)) {
        return {
            isValid: false,
            message:
                'La clave no debe contener espacios.'
        };
    }

    if (!/[^A-Za-z\d]/.test(normalizedPassword)) {
        return {
            isValid: false,
            message:
                'La clave debe incluir al menos un caracter especial.'
        };
    }

    return {
        isValid: true,
        message: 'Clave válida.'
    };
}

async function requestResetCodeWithBackend(email) {
    const normalizedEmail =
        String(email || '').trim().toLowerCase();

    if (!isValidEmailFormat(normalizedEmail)) {
        return {
            success: false,
            message: 'Ingresa un correo electronico valido.'
        };
    }

    const endpoint = window.getApiEndpoint(
        '/api/auth/recovery/send-code'
    );

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email: normalizedEmail
            })
        });

        const data = await response.json();

        if (data?.ok || data?.success) {
            sessionStorage.setItem(
                RESET_EMAIL_KEY,
                normalizedEmail
            );
        }

        return {
            success: Boolean(data?.ok || data?.success),
            message:
                data?.message ||
                'No se pudo enviar el codigo.'
        };
    } catch (error) {
        console.error(
            'Error enviando el codigo de recuperacion:',
            error
        );

        return {
            success: false,
            message:
                'Error de comunicacion al enviar el codigo.'
        };
    }
}

async function verifyResetCodeWithBackend(
    email,
    code
) {
    const normalizedEmail =
        String(email || '').trim().toLowerCase();

    const normalizedCode =
        String(code || '')
            .replace(/\D/g, '')
            .slice(0, 4);

    if (!isValidEmailFormat(normalizedEmail)) {
        return {
            success: false,
            message: 'El correo de recuperacion no es valido.'
        };
    }

    if (normalizedCode.length !== 4) {
        return {
            success: false,
            message: 'El codigo debe tener 4 digitos.'
        };
    }

    const endpoint = window.getApiEndpoint(
        '/api/auth/recovery/validate-code'
    );

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email: normalizedEmail,
                code: normalizedCode
            })
        });

        const data = await response.json();
        const success =
            Boolean(data?.ok || data?.success);

        const recoveryToken =
            String(data?.recoveryToken || '');

        if (success && recoveryToken) {
            sessionStorage.setItem(
                RECOVERY_TOKEN_KEY,
                recoveryToken
            );
        }

        if (success && !recoveryToken) {
            return {
                success: false,
                message:
                    'No se recibio el permiso de recuperacion.'
            };
        }

        return {
            success: success,
            message:
                data?.message ||
                'No se pudo validar el codigo.'
        };
    } catch (error) {
        console.error(
            'Error validando el codigo de recuperacion:',
            error
        );

        return {
            success: false,
            message:
                'Error de comunicacion al validar el codigo.'
        };
    }
}

async function getSecurityQuestionsWithBackend() {
    const recoveryToken =
        sessionStorage.getItem(
            RECOVERY_TOKEN_KEY
        );

    if (!recoveryToken) {
        return {
            success: false,
            message:
                'El permiso de recuperacion no existe o ha expirado.'
        };
    }

    const endpoint = window.getApiEndpoint(
        '/api/auth/recovery/questions'
    );

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                recoveryToken: recoveryToken
            })
        });

        const data = await response.json();

        return {
            success: Boolean(data?.ok || data?.success),
            message:
                data?.message ||
                'No se pudieron cargar las preguntas.',
            questions: {
                question1:
                    String(data?.questions?.question1 || ''),
                question2:
                    String(data?.questions?.question2 || '')
            }
        };
    } catch (error) {
        console.error(
            'Error cargando las preguntas:',
            error
        );

        return {
            success: false,
            message:
                'Error de comunicacion al cargar las preguntas.'
        };
    }
}

async function verifySecurityAnswersWithBackend(
    answer1,
    answer2
) {
    const recoveryToken =
        sessionStorage.getItem(
            RECOVERY_TOKEN_KEY
        );

    const normalizedAnswer1 =
        String(answer1 || '').trim();

    const normalizedAnswer2 =
        String(answer2 || '').trim();

    if (!recoveryToken) {
        return {
            success: false,
            message:
                'El permiso de recuperacion no existe o ha expirado.'
        };
    }

    if (!normalizedAnswer1 || !normalizedAnswer2) {
        return {
            success: false,
            message:
                'Debes responder ambas preguntas.'
        };
    }

    const endpoint = window.getApiEndpoint(
        '/api/auth/recovery/validate-answers'
    );

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                recoveryToken: recoveryToken,
                answer1: normalizedAnswer1,
                answer2: normalizedAnswer2
            })
        });

        const data = await response.json();
        const success =
            Boolean(data?.ok || data?.success);

        const passwordResetToken =
            String(data?.passwordResetToken || '');

        if (success && !passwordResetToken) {
            return {
                success: false,
                message:
                    'No se recibio el permiso para cambiar la clave.'
            };
        }

        if (success) {
            sessionStorage.setItem(
                PASSWORD_RESET_TOKEN_KEY,
                passwordResetToken
            );

            // El backend ya consumió este token.
            sessionStorage.removeItem(
                RECOVERY_TOKEN_KEY
            );
        }

        return {
            success: success,
            message:
                data?.message ||
                'No se pudieron validar las respuestas.'
        };
    } catch (error) {
        console.error(
            'Error validando las respuestas:',
            error
        );

        return {
            success: false,
            message:
                'Error de comunicacion al validar las respuestas.'
        };
    }
}

async function updatePasswordWithBackend(
    newPassword
) {
    const passwordResetToken =
        sessionStorage.getItem(
            PASSWORD_RESET_TOKEN_KEY
        );

    const normalizedPassword =
        String(newPassword || '').trim();

    if (!passwordResetToken) {
        return {
            success: false,
            message:
                'El permiso para cambiar la clave no existe o ha expirado.'
        };
    }

    const endpoint = window.getApiEndpoint(
        '/api/auth/recovery/update-password'
    );

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                passwordResetToken:
                    passwordResetToken,
                newPassword:
                    normalizedPassword
            })
        });

        const data = await response.json();
        const success =
            Boolean(data?.ok || data?.success);

        if (success) {
            sessionStorage.removeItem(
                PASSWORD_RESET_TOKEN_KEY
            );

            sessionStorage.removeItem(
                RECOVERY_TOKEN_KEY
            );

            sessionStorage.removeItem(
                RESET_EMAIL_KEY
            );
        }

        return {
            success: success,
            message:
                data?.message ||
                'No se pudo actualizar la clave.'
        };
    } catch (error) {
        console.error(
            'Error actualizando la clave:',
            error
        );

        return {
            success: false,
            message:
                'Error de comunicacion al actualizar la clave.'
        };
    }
}

window.validatePasswordRules = validatePasswordRules;
window.validateRecoveryEmailWithBackend =
    validateRecoveryEmailWithBackend;
window.requestResetCodeWithBackend =
    requestResetCodeWithBackend;
window.verifyResetCodeWithBackend =
    verifyResetCodeWithBackend;
window.getSecurityQuestionsWithBackend =
    getSecurityQuestionsWithBackend;
window.verifySecurityAnswersWithBackend =
    verifySecurityAnswersWithBackend;
window.updatePasswordWithBackend =
    updatePasswordWithBackend;            