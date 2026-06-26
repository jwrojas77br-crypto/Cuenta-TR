/**
 * Simula una llamada al backend de Google Apps Script para validar un usuario.
 *
 * Esta función devuelve una promesa que resuelve en una respuesta falsa,
 * permitiendo probar la interfaz del front mientras no exista el endpoint real.
 *
 * @param {{email: string, password: string}} credentials
 * @returns {Promise<{success: boolean, message: string, user?: {email: string}, isNewUser?: boolean}>} Respuesta simulada del API
 */
async function verifyUserCredentials(credentials) {
    console.log('Simulando consulta al API con credenciales:', credentials);

    const simulatedResponse = await new Promise((resolve) => {
        window.setTimeout(() => {
            const isValidUser = (credentials.email === 'leduar41@gmail.com' && credentials.password === 'L1234') ||
                                (credentials.email === 'jwrojas77@gmail.com' && credentials.password === '123');
            const isNewUser = credentials.email === 'jwrojas77@gmail.com';

            resolve({
                success: isValidUser,
                message: isValidUser ? 'Usuario validado correctamente.' : 'Usuario o contraseña incorrectos.',
                user: isValidUser ? { email: credentials.email } : undefined,
                isNewUser: isValidUser ? isNewUser : false
            });
        }, 900);
    });

    console.log('Respuesta simulada del API:', simulatedResponse);
    return simulatedResponse;
}

/**
 * Llama al backend para enviar un codigo de verificacion al email del usuario.
 *
 * Si no hay endpoint configurado, usa una simulacion para pruebas de interfaz.
 *
 * @param {string} email
 * @returns {Promise<{success: boolean, message: string}>} Resultado del envio
 */
async function sendSecurityCodeEmail(email) {
    const backendUrl = window.LOGIN_BACKEND_URL;

    if (backendUrl) {
        try {
            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'sendSecurityCode',
                    email
                })
            });

            const data = await response.json();
            const normalizedResponse = {
                success: Boolean(data?.success),
                message: data?.message || (data?.success ? 'Codigo enviado al correo.' : 'No se pudo enviar el codigo.')
            };

            console.log('Respuesta backend envio de codigo:', normalizedResponse);
            return normalizedResponse;
        } catch (error) {
            console.error('Error enviando codigo al backend:', error);
            return {
                success: false,
                message: 'Error de comunicacion con el backend al enviar el codigo.'
            };
        }
    }

    const simulatedSendResponse = await new Promise((resolve) => {
        window.setTimeout(() => {
            resolve({
                success: true,
                message: `Codigo de verificacion enviado a ${email}.`
            });
        }, 600);
    });

    console.log('Respuesta simulada envio de codigo:', simulatedSendResponse);
    return simulatedSendResponse;
}

/**
 * Consulta al backend para validar el código enviado al usuario.
 *
 * Si no hay endpoint configurado, utiliza validación simulada para pruebas.
 *
 * @param {string} code
 * @returns {Promise<{success: boolean, message: string}>} Resultado de la validación del código
 */
async function verifySecurityCodeWithService(code) {
    const backendUrl = window.LOGIN_BACKEND_URL;

    if (backendUrl) {
        try {
            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'validateSecurityCode',
                    code
                })
            });

            const data = await response.json();
            const normalizedResponse = {
                success: Boolean(data?.success),
                message: data?.message || (data?.success ? 'Código validado correctamente.' : 'Código incorrecto o expirado.')
            };

            console.log('Respuesta backend validación de código:', normalizedResponse);
            return normalizedResponse;
        } catch (error) {
            console.error('Error validando código en backend:', error);
            return {
                success: false,
                message: 'Error de comunicación al validar el código.'
            };
        }
    }

    const simulatedCodeValidation = await new Promise((resolve) => {
        window.setTimeout(() => {
            const isValidCode = code === '1234';

            resolve({
                success: isValidCode,
                message: isValidCode ? 'Código validado correctamente.' : 'El código ingresado es incorrecto.'
            });
        }, 900);
    });

    console.log('Respuesta simulada validación de código:', simulatedCodeValidation);
    return simulatedCodeValidation;
}

// Exponer la función para pruebas directas desde la consola al usar module script
window.verifyUserCredentials = verifyUserCredentials;
window.sendSecurityCodeEmail = sendSecurityCodeEmail;
window.verifySecurityCodeWithService = verifySecurityCodeWithService;


