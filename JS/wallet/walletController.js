function formatWalletBalance(
    balanceCents
) {
    const normalizedBalance =
        Number(balanceCents);

    if (
        !Number.isInteger(normalizedBalance) ||
        normalizedBalance < 0
    ) {
        return null;
    }

    return new Intl.NumberFormat(
        'en-US',
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    ).format(
        normalizedBalance / 100
    );
}


async function loadWalletSummary() {
    const response =
        await window
            .getWalletSummaryFromBackend?.();

    if (!response?.success) {
        return {
            success: false,
            message:
                response?.message ||
                'No se pudo cargar la cartera.'
        };
    }

    const formattedBalance =
        formatWalletBalance(
            response.wallet?.balanceCents
        );

    if (!formattedBalance) {
        return {
            success: false,
            message:
                'El saldo recibido no es valido.'
        };
    }

    return {
        success: true,
        message: response.message,

        user: {
            id: response.user?.id,
            name:
                String(
                    response.user?.name || ''
                ).trim()
        },

        wallet: {
            walletId:
                String(
                    response.wallet?.walletId || ''
                ).trim(),

            currency:
                String(
                    response.wallet?.currency || ''
                ).trim(),

            formattedBalance:
                formattedBalance
        },

        movements:
            response.movements.map(
                prepareWalletMovement
            )
    };
}

function formatMovementDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Fecha no disponible';
    }

    return new Intl.DateTimeFormat(
        'es-ES',
        {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        }
    ).format(date);
}


function prepareWalletMovement(movement) {
    const direction =
        movement?.direction === 'OUT'
            ? 'OUT'
            : 'IN';

    const counterpartName =
        String(
            movement?.counterpartName || ''
        ).trim();

    const formattedAmount =
        formatWalletBalance(
            Number(movement?.amountCents)
        );

    return {
        movementId:
            String(
                movement?.movementId || ''
            ),

        title:
            counterpartName ||
            String(
                movement?.description ||
                'Usuario'
            ),

        meta:
            `${formatMovementDate(
                movement?.createdAt
            )} · ${direction === 'OUT'
                ? 'Enviado'
                : 'Recibido'
            }`,

        amount:
            `${direction === 'OUT' ? '-' : '+'} ${formattedAmount || '0.00'
            }`,

        currency:
            String(
                movement?.currency || ''
            ),

        status:
            String(
                movement?.status || ''
            ),

        direction:
            direction
    };
}

function createTransferIdempotencyKey() {
    if (
        window.crypto &&
        typeof window.crypto.randomUUID ===
        'function'
    ) {
        return window.crypto.randomUUID();
    }

    return [
        'transfer',
        Date.now(),
        Math.random()
            .toString(16)
            .slice(2)
    ].join('-');
}


async function transferWalletFunds(
    transferData
) {
    const recipientEmail =
        String(
            transferData?.recipientEmail ||
            ''
        )
            .trim()
            .toLowerCase();

    const amountCents =
        Number(
            transferData?.amountCents
        );

    if (!recipientEmail) {
        return {
            success: false,
            message:
                'El correo del destinatario es obligatorio.'
        };
    }

    if (
        !Number.isSafeInteger(
            amountCents
        ) ||
        amountCents <= 0
    ) {
        return {
            success: false,
            message:
                'El monto ingresado no es válido.'
        };
    }

    const idempotencyKey =
        createTransferIdempotencyKey();

    const response =
        await window
            .sendWalletTransferToBackend?.({
                recipientEmail:
                    recipientEmail,

                amountCents:
                    amountCents,

                idempotencyKey:
                    idempotencyKey
            });

    if (!response) {
        return {
            success: false,
            message:
                'El servicio de transferencia no está disponible.'
        };
    }

    return response;
}


window.transferWalletFunds =
    transferWalletFunds;
window.loadWalletSummary =
    loadWalletSummary;