function browserSupportsPasskeys() {
    return Boolean(
        window.PublicKeyCredential &&
        window.SimpleWebAuthnBrowser &&
        typeof window
            .SimpleWebAuthnBrowser
            .startRegistration ===
            'function'
    );
}


async function requestPasskeyJson(
    path,
    requestBody
) {
    const endpoint =
        window.getApiEndpoint(path);

    const response =
        await fetch(
            endpoint,
            {
                method: 'POST',

                headers: {
                    'Content-Type':
                        'application/json',

                    'Accept':
                        'application/json'
                },

                body:
                    JSON.stringify(
                        requestBody
                    )
            }
        );

    const data =
        await response.json();

    return {
        httpOk:
            response.ok,

        status:
            response.status,

        data:
            data
    };
}


async function activatePasskeyForCurrentUser() {
    if (!browserSupportsPasskeys()) {
        return {
            success: false,
            message:
                'Este dispositivo no permite usar huella, rostro o PIN.'
        };
    }

    const authToken =
        sessionStorage.getItem(
            'tr-auth-token'
        );

    if (!authToken) {
        return {
            success: false,
            message:
                'No existe una sesión activa.'
        };
    }

    try {
        const optionsResult =
            await requestPasskeyJson(
                '/api/passkeys/register/options',
                {
                    authToken:
                        authToken
                }
            );

        if (
            !optionsResult.httpOk ||
            !optionsResult.data?.success
        ) {
            return {
                success: false,
                message:
                    optionsResult.data?.message ||
                    'No se pudo iniciar el registro.'
            };
        }

        const registrationResponse =
            await window
                .SimpleWebAuthnBrowser
                .startRegistration({
                    optionsJSON:
                        optionsResult
                            .data
                            .options
                });

        const verificationResult =
            await requestPasskeyJson(
                '/api/passkeys/register/verify',
                {
                    flowId:
                        optionsResult
                            .data
                            .flowId,

                    credential:
                        registrationResponse
                }
            );

        return {
            success:
                Boolean(
                    verificationResult
                        .httpOk &&
                    verificationResult
                        .data
                        ?.success
                ),

            message:
                verificationResult
                    .data
                    ?.message ||
                'No se pudo verificar la passkey.'
        };

    } catch (error) {
        console.error(
            'Error registrando passkey:',
            error
        );

        if (
            error?.name ===
            'NotAllowedError'
        ) {
            return {
                success: false,
                message:
                    'El registro fue cancelado o tardó demasiado.'
            };
        }

        if (
            error?.name ===
            'InvalidStateError'
        ) {
            return {
                success: false,
                message:
                    'Este dispositivo ya tiene una passkey registrada.'
            };
        }

        return {
            success: false,
            message:
                'No se pudo activar el acceso rápido.'
        };
    }
}


window.browserSupportsPasskeys =
    browserSupportsPasskeys;

window.activatePasskeyForCurrentUser =
    activatePasskeyForCurrentUser;