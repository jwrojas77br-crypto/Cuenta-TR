function getProxyBaseUrl() {
    const configuredUrl = window.LOGIN_PROXY_URL || window.APP_CONFIG?.PROXY_BASE_URL || 'https://cuentatr-dev.multiservicosrojas.workers.dev';
    return String(configuredUrl).replace(/\/$/, '');
}

function getApiEndpoint(path) {
    return `${getProxyBaseUrl()}${path}`;
}

/**
 * Valida usuario y clave contra backend real.
 * @param {{email: string, password: string}} credentials
 * @returns {Promise<{success: boolean, message: string, user?: {email: string}, isNewUser?: boolean}>}
 */
async function verifyUserCredentials(credentials) {
    return queryUserLoginWithBackend(credentials);
}

/**
 * Consulta real al proxy/backend para validar email y clave.
 *
 * Espera una respuesta con forma: { ok: boolean, message: string, user?: object }
 * @param {{email: string, password: string}} credentials
 * @returns {Promise<{success: boolean, message: string, user?: {email: string}, isNewUser?: boolean}>}
 */
async function queryUserLoginWithBackend(credentials) {
    const endpoint = getApiEndpoint('/api/auth/login');
    const payload = {
        action: 'login',
        email: String(credentials?.email || '').trim(),
        password: String(credentials?.password || '').trim()
    };

    console.log('[Login Query] Enviando consulta de autenticación');
    console.log('[Login Query] Endpoint:', endpoint);
    console.log('[Login Query] Payload:', {
        action: payload.action,
        email: payload.email,
        password: payload.password ? '***' : ''
    });

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('[Login Query] HTTP status:', response.status);
        console.log('[Login Query] Respuesta JSON:', data);

        return {
            success: Boolean(data?.ok || data?.success),
            message: data?.message || (response.ok ? 'Login procesado.' : 'No se pudo validar credenciales.'),
            user: data?.user,
            // El backend actual no informa este atributo, se deja en false por defecto.
            isNewUser: Boolean(data?.isNewUser)
        };
    } catch (error) {
        console.error('[Login Query] Error de conexión:', error);
        return {
            success: false,
            message: 'Error de comunicación con el backend en la validación de usuario.'
        };
    }
}

/**
 * Llama al backend para enviar un codigo de verificacion al email del usuario.
 * @param {string} email
 * @returns {Promise<{success: boolean, message: string}>} Resultado del envio
 */
async function sendSecurityCodeEmail(email) {
    const endpoint = getApiEndpoint('/api/auth/send-code');
    const payload = {
        action: 'sendSecurityCode',
        email: String(email || '').trim()
    };

    console.log('[Send Code] Enviando solicitud al backend');
    console.log('[Send Code] Endpoint:', endpoint);
    console.log('[Send Code] Payload:', payload);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        const normalizedResponse = {
            success: Boolean(data?.ok || data?.success),
            message: data?.message || ((data?.ok || data?.success)
                ? 'Codigo enviado al correo.'
                : 'No se pudo enviar el codigo.')
        };

        console.log('[Send Code] HTTP status:', response.status);
        console.log('[Send Code] Respuesta JSON:', data);
        return normalizedResponse;
    } catch (error) {
        console.error('[Send Code] Error enviando código al backend:', error);
        return {
            success: false,
            message: 'Error de comunicacion con el backend al enviar el codigo.'
        };
    }
}

/**
 * Consulta al backend para validar el código enviado al usuario.
 * @param {string} code
 * @returns {Promise<{success: boolean, message: string}>} Resultado de la validación del código
 */
async function verifySecurityCodeWithService(code, email) {
    const endpoint = getApiEndpoint('/api/auth/validate-code');
    const payload = {
        action: 'validateSecurityCode',
        email: String(email || '').trim(),
        code: String(code || '').trim()
    };

    console.log('[Validate Code] Enviando solicitud al backend');
    console.log('[Validate Code] Endpoint:', endpoint);
    console.log('[Validate Code] Payload:', payload);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        const normalizedResponse = {
            success: Boolean(data?.ok || data?.success),
            message: data?.message || ((data?.ok || data?.success)
                ? 'Codigo validado correctamente.'
                : 'Codigo incorrecto o expirado.'),
            setupToken: String(data?.setupToken || '')
        };

        console.log('[Validate Code] HTTP status:', response.status);
        console.log(
            '[Validate Code] Resultado:',
            Boolean(data?.ok || data?.success)
        );
        return normalizedResponse;
    } catch (error) {
        console.error('[Validate Code] Error validando código en backend:', error);
        return {
            success: false,
            message: 'Error de comunicación al validar el código.'
        };
    }
}

/**
 * Prueba mínima de conectividad contra el proxy/backend.
 *
 * Diseñada para ejecutarse manualmente desde consola sin afectar el flujo actual.
 * @returns {Promise<{success: boolean, data?: any, message?: string}>}
 */
async function testBackendConnection() {
    const endpoint = getApiEndpoint('/api/ping');

    console.log('[Backend Test] Iniciando prueba de conexión...');
    console.log('[Backend Test] Endpoint:', endpoint);

    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            cache: 'no-store'
        });

        const data = await response.json();

        console.log('[Backend Test] HTTP status:', response.status);
        console.log('[Backend Test] Respuesta JSON:', data);

        return {
            success: response.ok && Boolean(data?.ok),
            data,
            message: data?.message || 'Prueba completada'
        };
    } catch (error) {
        console.error('[Backend Test] Error en conexión/consulta:', error);
        return {
            success: false,
            message: error.message
        };
    }
}

/**
 * Prueba manual de autenticación para ejecutar desde la consola.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{success: boolean, message: string, user?: {email: string}, isNewUser?: boolean}>}
 */
async function testBackendLoginQuery(email, password) {
    console.log('[Login Test] Iniciando prueba de login con backend...');
    return queryUserLoginWithBackend({ email, password });
}

// Exponer la función para pruebas directas desde la consola al usar module script
window.verifyUserCredentials = verifyUserCredentials;
window.sendSecurityCodeEmail = sendSecurityCodeEmail;
window.verifySecurityCodeWithService = verifySecurityCodeWithService;
window.testBackendConnection = testBackendConnection;
window.testBackendLoginQuery = testBackendLoginQuery;


