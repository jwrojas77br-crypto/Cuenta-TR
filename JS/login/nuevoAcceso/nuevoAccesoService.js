const PASSWORD_SECURITY_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])\S{8,}$/;

/**
 * Valida si una clave cumple reglas minimas de seguridad.
 * Reglas:
 * - Minimo 8 caracteres
 * - Al menos 1 mayuscula
 * - Al menos 1 minuscula
 * - Al menos 1 numero
 * - Al menos 1 caracter especial
 * - Sin espacios
 *
 * @param {string} password
 * @returns {{isValid: boolean, message: string, pattern: RegExp}}
 */
function validatePasswordSecurity(password) {
	const normalizedPassword = String(password || '');

	if (normalizedPassword.length < 8) {
		return {
			isValid: false,
			message: 'La clave debe tener al menos 8 caracteres.',
			pattern: PASSWORD_SECURITY_PATTERN
		};
	}

	if (/\s/.test(normalizedPassword)) {
		return {
			isValid: false,
			message: 'La clave no debe contener espacios.',
			pattern: PASSWORD_SECURITY_PATTERN
		};
	}

	if (!/[A-Z]/.test(normalizedPassword)) {
		return {
			isValid: false,
			message: 'La clave debe incluir al menos una letra mayuscula.',
			pattern: PASSWORD_SECURITY_PATTERN
		};
	}

	if (!/[a-z]/.test(normalizedPassword)) {
		return {
			isValid: false,
			message: 'La clave debe incluir al menos una letra minuscula.',
			pattern: PASSWORD_SECURITY_PATTERN
		};
	}

	if (!/\d/.test(normalizedPassword)) {
		return {
			isValid: false,
			message: 'La clave debe incluir al menos un numero.',
			pattern: PASSWORD_SECURITY_PATTERN
		};
	}

	if (!/[^A-Za-z\d]/.test(normalizedPassword)) {
		return {
			isValid: false,
			message: 'La clave debe incluir al menos un caracter especial.',
			pattern: PASSWORD_SECURITY_PATTERN
		};
	}

	if (!PASSWORD_SECURITY_PATTERN.test(normalizedPassword)) {
		return {
			isValid: false,
			message: 'La clave no cumple el formato de seguridad requerido.',
			pattern: PASSWORD_SECURITY_PATTERN
		};
	}

	return {
		isValid: true,
		message: 'Clave valida.',
		pattern: PASSWORD_SECURITY_PATTERN
	};
}

window.validatePasswordSecurity = validatePasswordSecurity;

/**
 * SIMULACION BACKEND (FRONTEND): envio mock de datos de nuevo acceso.
 *
 * TODO BACKEND-REAL:
 * - Reemplazar esta funcion por llamada HTTP real (fetch/axios) al endpoint correspondiente.
 * - Eliminar latencia simulada, reglas de rechazo mock y mensajes hardcodeados.
 * - Conservar solo el contrato de respuesta usado por la UI/Controller.
 *
 * Reglas de simulacion actuales:
 * - Genera requestId local para trazabilidad visual.
 * - Espera artificial para imitar latencia de red.
 * - Puede forzar rechazo por bandera o por texto en preguntas.
 * - Retorna objetos mock de exito/rechazo.
 *
 * @param {{newPassword: string, securityQuestion1: string, securityAnswer1: string, securityQuestion2: string, securityAnswer2: string}} payload
 * @returns {Promise<{success: boolean, status: 'success' | 'rejected', message: string, requestId: string}>}
 */
async function sendNewAccessDataToBackend(payload) {
	const setupToken = sessionStorage.getItem(
		'tr-new-access-token'
	);

	if (!setupToken) {
		return {
			success: false,
			status: 'rejected',
			message:
				'El permiso de configuracion no existe o ha expirado.'
		};
	}

	const endpoint = window.getApiEndpoint(
		'/api/auth/new-access'
	);

	const requestBody = {
		action: 'newAccess',
		setupToken: setupToken,
		newPassword:
			String(payload?.newPassword || '').trim(),
		securityQuestion1:
			String(payload?.securityQuestion1 || '').trim(),
		securityAnswer1:
			String(payload?.securityAnswer1 || '').trim(),
		securityQuestion2:
			String(payload?.securityQuestion2 || '').trim(),
		securityAnswer2:
			String(payload?.securityAnswer2 || '').trim()
	};

	try {
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			},
			body: JSON.stringify(requestBody)
		});

		const data = await response.json();

		return {
			success: Boolean(data?.ok || data?.success),
			status: data?.status || (
				response.ok ? 'success' : 'rejected'
			),
			message:
				data?.message ||
				'No se pudo guardar la configuracion.',
			requestId: data?.requestId
		};
	} catch (error) {
		console.error(
			'Error comunicando con el backend:',
			error
		);

		return {
			success: false,
			status: 'rejected',
			message:
				'Error de comunicacion al guardar la configuracion.'
		};
	}
}

window.sendNewAccessDataToBackend =
	sendNewAccessDataToBackend;
