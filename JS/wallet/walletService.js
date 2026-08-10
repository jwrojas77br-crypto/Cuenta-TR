async function getWalletSummaryFromBackend() {
    const authToken =
        sessionStorage.getItem(
            'tr-auth-token'
        );

    if (!authToken) {
        return {
            success: false,
            message:
                'No existe una sesion activa.'
        };
    }

    const endpoint = window.getApiEndpoint(
        '/api/wallet/summary'
    );

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                authToken: authToken
            })
        });

        const data = await response.json();

        return {
            success: Boolean(
                data?.ok || data?.success
            ),
            message:
                data?.message ||
                'No se pudo consultar la cartera.',
            user: data?.user,
            wallet: data?.wallet,
            passkey:
                data?.passkey || {
                    enabled: false,
                    count: 0
                },
            movements:
                Array.isArray(data?.movements)
                    ? data.movements
                    : []
        };
    } catch (error) {
        console.error(
            'Error consultando la cartera:',
            error
        );

        return {
            success: false,
            message:
                'Error de comunicacion con la cartera.'
        };
    }
}

async function sendWalletTransferToBackend(
    transferData
) {
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

    const endpoint =
        window.getApiEndpoint(
            '/api/wallet/transfer'
        );

    const requestBody = {
        authToken: authToken,

        recipientEmail:
            transferData.recipientEmail,

        amountCents:
            transferData.amountCents,

        idempotencyKey:
            transferData.idempotencyKey
    };

    try {
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
            success: Boolean(
                data?.ok ||
                data?.success
            ),

            message:
                data?.message ||
                'No se pudo completar la transferencia.',

            duplicate:
                Boolean(data?.duplicate),

            wallet:
                data?.wallet || null,

            movement:
                data?.movement || null
        };
    } catch (error) {
        console.error(
            'Error enviando la transferencia:',
            error
        );

        return {
            success: false,
            message:
                'No fue posible comunicarse con la cartera.'
        };
    }
}


window.sendWalletTransferToBackend =
    sendWalletTransferToBackend;

window.getWalletSummaryFromBackend =
    getWalletSummaryFromBackend;
