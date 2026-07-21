let storedNewPassword = '';
let storedSecurityQuestion1 = '';
let storedSecurityAnswer1 = '';
let storedSecurityQuestion2 = '';
let storedSecurityAnswer2 = '';

/**
 * Guarda en variables los datos de acceso ya validados desde la UI.
 *
 * @param {{newPassword: string, securityQuestion1: string, securityAnswer1: string, securityQuestion2: string, securityAnswer2: string}} payload
 * @returns {{success: boolean, message: string, data?: {newPassword: string, securityQuestion1: string, securityAnswer1: string, securityQuestion2: string, securityAnswer2: string}}}
 */
function storeValidatedNewAccessData(payload) {
	const normalizedPayload = {
		newPassword: String(payload?.newPassword || '').trim(),
		securityQuestion1: String(payload?.securityQuestion1 || '').trim(),
		securityAnswer1: String(payload?.securityAnswer1 || '').trim(),
		securityQuestion2: String(payload?.securityQuestion2 || '').trim(),
		securityAnswer2: String(payload?.securityAnswer2 || '').trim()
	};

	const hasEmptyField = Object.values(normalizedPayload).some((value) => value.length === 0);

	if (hasEmptyField) {
		return {
			success: false,
			message: 'No se pudo guardar: hay campos vacios en clave o preguntas de seguridad.'
		};
	}

	storedNewPassword = normalizedPayload.newPassword;
	storedSecurityQuestion1 = normalizedPayload.securityQuestion1;
	storedSecurityAnswer1 = normalizedPayload.securityAnswer1;
	storedSecurityQuestion2 = normalizedPayload.securityQuestion2;
	storedSecurityAnswer2 = normalizedPayload.securityAnswer2;

	console.log(
		'Datos de nuevo acceso validados correctamente.'
	);

	return {
		success: true,
		message: 'Datos de acceso guardados en variables.',
		data: {
			newPassword: storedNewPassword,
			securityQuestion1: storedSecurityQuestion1,
			securityAnswer1: storedSecurityAnswer1,
			securityQuestion2: storedSecurityQuestion2,
			securityAnswer2: storedSecurityAnswer2
		}
	};
}

/**
 * Devuelve la ultima informacion almacenada para verificacion o siguientes pasos.
 *
 * @returns {{newPassword: string, securityQuestion1: string, securityAnswer1: string, securityQuestion2: string, securityAnswer2: string}}
 */
function getStoredNewAccessData() {
	return {
		newPassword: storedNewPassword,
		securityQuestion1: storedSecurityQuestion1,
		securityAnswer1: storedSecurityAnswer1,
		securityQuestion2: storedSecurityQuestion2,
		securityAnswer2: storedSecurityAnswer2
	};
}

window.storeValidatedNewAccessData = storeValidatedNewAccessData;
window.getStoredNewAccessData = getStoredNewAccessData;

/**
 * Orquesta el flujo final de persistencia:
 * 1) Guarda los datos validados en variables locales.
 * 2) Envia la informacion al backend simulado y espera respuesta.
 *
 * @param {{newPassword: string, securityQuestion1: string, securityAnswer1: string, securityQuestion2: string, securityAnswer2: string}} payload
 * @returns {Promise<{success: boolean, message: string, status?: 'success' | 'rejected', requestId?: string}>}
 */
async function submitNewAccessConfiguration(payload) {
	const localStoreResponse = storeValidatedNewAccessData(payload);

	if (!localStoreResponse.success) {
		return {
			success: false,
			message: localStoreResponse.message
		};
	}

	const backendResponse = await window.sendNewAccessDataToBackend?.(payload);

	if (!backendResponse) {
		return {
			success: false,
			message: 'No se obtuvo respuesta del backend simulado.'
		};
	}

	return {
		success: backendResponse.success,
		status: backendResponse.status,
		message: backendResponse.message,
		requestId: backendResponse.requestId
	};
}

window.submitNewAccessConfiguration = submitNewAccessConfiguration;
