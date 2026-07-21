// Variable para almacenar si el usuario autenticado es nuevo
let currentUserIsNew = false;
let currentUserEmail = "";

/**
 * Extrae las credenciales almacenadas por storeCredentials() y las envía
 * a verifyUserCredentials() para simular la verificación del backend.
 *
 * @returns {Promise<{success: boolean, message: string, user?: {email: string}}>} Resultado de la verificación
 */
async function authenticateLogin() {
    const credentials = window.storeCredentials?.();

    if (!credentials) {
        console.error('authenticateLogin: no se pudieron obtener las credenciales');
        return {
            success: false,
            message: 'No se encontraron credenciales para verificar.'
        };
    }

    const response = await window.verifyUserCredentials?.(credentials);

    if (!response?.success) {
        console.log('authenticateLogin: respuesta del servicio de verificación:', response);
        return response;
    }

    currentUserIsNew = Boolean(response.isNewUser);
    currentUserEmail = String(credentials.email || "").trim();
    console.log('authenticateLogin: usuario es nuevo:', currentUserIsNew);

    const codeDispatchResponse = await requestSecurityCodeForUser(credentials.email);

    if (!codeDispatchResponse.success) {
        return {
            success: false,
            message: codeDispatchResponse.message || 'No se pudo enviar el codigo de verificacion.'
        };
    }

    console.log('authenticateLogin: respuesta del servicio de verificación:', response);
    return response;
}


/**
 * Almacena las credenciales ingresadas por el usuario
 * 
 * Funcionalidad:
 * - Captura los valores de email y password de los campos
 * - Crea un objeto con las credenciales
 * - Registra en consola para pruebas y depuración
 * - Retorna el objeto para su posterior envío al servidor
 * 
 * @returns {Object} Objeto con propiedades {email, password}
 */
function storeCredentials() {
    const credentials = {
        email: emailInput.value.trim(),
        password: passwordInput.value.trim()
    };

    console.log('storeCredentials llamado:', credentials);

    return credentials;
}


/**
 * Ejecuta el envio del codigo al email indicado y, si es exitoso,
 * muestra el modal de ingreso de codigo.
 *
 * @param {string} email
 * @returns {Promise<{success: boolean, message: string}>} Resultado del flujo de envio
 */
async function requestSecurityCodeForUser(email) {
    const codeDispatchResponse = await window.sendSecurityCodeEmail?.(email);

    if (!codeDispatchResponse) {
        return {
            success: false,
            message: 'Servicio de envio de codigo no disponible.'
        };
    }

    if (codeDispatchResponse.success) {
        window.showSecurityCodeModal?.();
    }

    return codeDispatchResponse;
}

/**
 * Recibe el código ingresado por el usuario y solicita su verificación al service.
 * Si valida correctamente, devuelve el destino de navegación para que UI controle el flujo.
 *
 * @param {string} code
 * @returns {Promise<{success: boolean, message: string}>} Resultado de la validación del código
 */
async function validateSecurityCodeWithController(code) {
    const normalizedCode = String(code || '').replace(/\D/g, '').slice(0, 4);

    if (normalizedCode.length !== 4) {
        return {
            success: false,
            message: 'El código debe contener 4 dígitos.'
        };
    }

    const response = await window.verifySecurityCodeWithService?.(
        normalizedCode,
        currentUserEmail
    );

    if (!response) {
        return {
            success: false,
            message: 'Servicio de validación de código no disponible.'
        };
    }

    console.log(
        'validateSecurityCodeWithController: codigo validado:',
        Boolean(response?.success)
    );

    if (!response.success) {
        return response;
    }

    const nextUrl = currentUserIsNew ? '../HTML/nuevoAcceso.html' : '../HTML/wallet.html';

    console.log('validateSecurityCodeWithController: código validado. Usuario es nuevo:', currentUserIsNew);
    console.log('Destino calculado para navegación:', nextUrl);

    return {
        ...response,
        isNewUser: currentUserIsNew,
        nextUrl
    };
}

// Exponer la función para pruebas directas desde la consola al usar module script
window.authenticateLogin = authenticateLogin;
window.storeCredentials = storeCredentials;
window.requestSecurityCodeForUser = requestSecurityCodeForUser;
window.validateSecurityCodeWithController = validateSecurityCodeWithController;