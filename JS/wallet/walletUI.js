const walletUserName =
    document.getElementById(
        'wallet-user-name'
    );

const walletBalance =
    document.getElementById(
        'wallet-balance'
    );

const walletCurrency =
    document.getElementById(
        'wallet-currency'
    );

const walletResponse =
    document.getElementById(
        'wallet-response'
    );

const walletActivityList =
    document.getElementById(
        'wallet-activity-list'
    );

const openTransferButton =
    document.getElementById(
        'open-transfer-button'
    );

const transferModal =
    document.getElementById(
        'transfer-modal'
    );

const closeTransferButton =
    document.getElementById(
        'close-transfer-button'
    );

const cancelTransferButton =
    document.getElementById(
        'cancel-transfer-button'
    );

const confirmTransferButton =
    document.getElementById(
        'confirm-transfer-button'
    );

const transferEmail =
    document.getElementById(
        'transfer-email'
    );

const transferAmount =
    document.getElementById(
        'transfer-amount'
    );

const transferEmailError =
    document.getElementById(
        'transfer-email-error'
    );

const transferAmountError =
    document.getElementById(
        'transfer-amount-error'
    );

const transferResponse =
    document.getElementById(
        'transfer-response'
    );

const activatePasskeyButton =
    document.getElementById(
        'activate-passkey-button'
    );

const passkeySetupResponse =
    document.getElementById(
        'passkey-setup-response'
    );


function isWalletLocalDevelopment() {
    return [
        'localhost',
        '127.0.0.1',
        '[::1]'
    ].includes(
        window.location.hostname
    );
}


function showWalletError(message) {
    if (walletBalance) {
        walletBalance.textContent = '--.--';
    }

    if (walletCurrency) {
        walletCurrency.textContent = '---';
    }

    if (walletUserName) {
        walletUserName.textContent =
            'Usuario';
    }

    if (walletResponse) {
        walletResponse.textContent =
            message ||
            'No se pudo cargar la cartera.';

        walletResponse.classList.add(
            'wallet-response-error'
        );
    }
}

function clearTransferForm() {
    transferEmail.value = '';
    transferAmount.value = '';
    transferAmount.dataset.cents = '';

    transferEmailError.textContent = '';
    transferAmountError.textContent = '';
    transferResponse.textContent = '';

    transferResponse.classList.remove(
        'error'
    );
}


function openTransferModal() {
    clearTransferForm();

    transferModal.classList.remove(
        'hidden'
    );

    transferEmail.focus();
}


function closeTransferModal() {
    transferModal.classList.add(
        'hidden'
    );
}

let transferInProgress = false;


function setTransferLoading(isLoading) {
    transferEmail.disabled = isLoading;
    transferAmount.disabled = isLoading;
    confirmTransferButton.disabled =
        isLoading;
    cancelTransferButton.disabled =
        isLoading;
    closeTransferButton.disabled =
        isLoading;

    confirmTransferButton.textContent =
        isLoading
            ? 'Procesando...'
            : 'Enviar';
}

function validateTransferForm() {
    const email =
        transferEmail.value
            .trim()
            .toLowerCase();

    const amountCents =
        Number(
            transferAmount.dataset.cents
        );

    let isValid = true;

    transferEmailError.textContent = '';
    transferAmountError.textContent = '';
    transferResponse.textContent = '';

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
        transferEmailError.textContent =
            'Ingresa un correo válido.';

        isValid = false;
    }

    if (
        !Number.isInteger(amountCents) ||
        amountCents <= 0
    ) {
        transferAmountError.textContent =
            'Ingresa un monto mayor que cero.';

        isValid = false;
    }

    if (isValid) {
        transferResponse.textContent =
            'Los datos son válidos.';

        console.log(
            '[Transferencia preparada]',
            {
                recipientEmail: email,
                amountCents,
                formattedAmount: transferAmount.value
            }
        );
    }

    return isValid;
}

async function handleTransferSubmit() {
    if (transferInProgress) {
        return;
    }

    const isValid =
        validateTransferForm();

    if (!isValid) {
        return;
    }

    const recipientEmail =
        transferEmail.value
            .trim()
            .toLowerCase();

    const amountCents =
        Number(
            transferAmount.dataset.cents
        );

    transferInProgress = true;
    setTransferLoading(true);

    transferResponse.textContent =
        'Procesando transferencia...';

    transferResponse.classList.remove(
        'error'
    );

    const result =
        await window
            .transferWalletFunds?.({
                recipientEmail:
                    recipientEmail,

                amountCents:
                    amountCents
            });

    if (!result?.success) {
        transferResponse.textContent =
            result?.message ||
            'No se pudo completar la transferencia.';

        transferResponse.classList.add(
            'error'
        );

        transferInProgress = false;
        setTransferLoading(false);

        return;
    }

    transferResponse.textContent =
        result.message ||
        'Transferencia completada correctamente.';

    transferResponse.classList.remove(
        'error'
    );

    await initializeWallet();

    setTimeout(() => {
        closeTransferModal();

        transferInProgress = false;
        setTransferLoading(false);
    }, 1200);
}

async function handleActivatePasskey() {
    if (!activatePasskeyButton) {
        return;
    }

    activatePasskeyButton.disabled =
        true;

    activatePasskeyButton.textContent =
        'Activando...';

    passkeySetupResponse.textContent =
        'Confirma tu identidad en el teléfono.';

    passkeySetupResponse.classList.remove(
        'error',
        'success'
    );

    const result =
        await window
            .activatePasskeyForCurrentUser?.();

    if (!result?.success) {
        passkeySetupResponse.textContent =
            result?.message ||
            'No se pudo activar el acceso rápido.';

        passkeySetupResponse.classList.add(
            'error'
        );

        activatePasskeyButton.disabled =
            false;

        activatePasskeyButton.textContent =
            'Intentar nuevamente';

        return;
    }

    passkeySetupResponse.textContent =
        result.message;

    passkeySetupResponse.classList.add(
        'success'
    );

    activatePasskeyButton.textContent =
        'Acceso activado';
}

openTransferButton?.addEventListener(
    'click',
    openTransferModal
);

closeTransferButton?.addEventListener(
    'click',
    closeTransferModal
);

cancelTransferButton?.addEventListener(
    'click',
    closeTransferModal
);

confirmTransferButton?.addEventListener(
    'click',
    handleTransferSubmit
);

transferAmount?.addEventListener(
    'input',
    formatTransferAmount
);

transferModal?.addEventListener(
    'click',
    function (event) {
        if (event.target === transferModal) {
            closeTransferModal();
        }
    }
);


document.addEventListener(
    'keydown',
    function (event) {
        if (
            event.key === 'Escape' &&
            !transferModal?.classList.contains(
                'hidden'
            )
        ) {
            closeTransferModal();
        }
    }
);

activatePasskeyButton
    ?.addEventListener(
        'click',
        handleActivatePasskey
    );

async function initializeWallet() {
    if (walletResponse) {
        walletResponse.textContent =
            'Consultando saldo...';

        walletResponse.classList.remove(
            'wallet-response-error'
        );
    }

    const result =
        await window.loadWalletSummary?.();

    if (!result?.success) {
        showWalletError(
            result?.message
        );

        if (!isWalletLocalDevelopment()) {
            sessionStorage.removeItem(
                'tr-authenticated'
            );

            sessionStorage.removeItem(
                'tr-auth-token'
            );

            setTimeout(() => {
                window.location.replace(
                    '../HTML/login.html'
                );
            }, 1200);
        }

        return;
    }

    if (walletUserName) {
        walletUserName.textContent =
            result.user.name ||
            'Usuario';
    }

    if (walletBalance) {
        walletBalance.textContent =
            result.wallet.formattedBalance;
    }

    if (walletCurrency) {
        walletCurrency.textContent =
            result.wallet.currency;
    }

    const recentMovements =
        Array.isArray(result.movements)
            ? result.movements.slice(0, 5)
            : [];

    renderWalletMovements(
        recentMovements
    );

    if (walletResponse) {
        walletResponse.textContent = '';
    }
}

function getMovementStatusClass(status) {
    const normalizedStatus =
        String(status || '')
            .trim()
            .toUpperCase();

    if (normalizedStatus === 'COMPLETADO') {
        return 'completed';
    }

    return 'processing';
}


function createMovementElement(movement) {
    const article =
        document.createElement('article');

    article.className = 'activity-item';

    const avatar =
        document.createElement('div');

    avatar.className =
        movement.direction === 'OUT'
            ? 'activity-avatar blue'
            : 'activity-avatar';

    avatar.setAttribute(
        'aria-hidden',
        'true'
    );

    const icon =
        document.createElement('span');

    icon.className =
        'material-symbols-outlined';

    icon.textContent =
        movement.direction === 'OUT'
            ? 'send'
            : 'download';

    avatar.appendChild(icon);

    const main =
        document.createElement('div');

    main.className = 'activity-main';

    const title =
        document.createElement('h3');

    title.className = 'activity-name';
    title.textContent = movement.title;

    const meta =
        document.createElement('p');

    meta.className = 'activity-meta';
    meta.textContent = movement.meta;

    main.append(title, meta);

    const right =
        document.createElement('div');

    right.className = 'activity-right';

    const amount =
        document.createElement('p');

    amount.className =
        `activity-amount ${movement.direction === 'OUT'
            ? 'negative'
            : 'positive'
        }`;

    amount.textContent =
        `${movement.amount} ${movement.currency}`;

    const status =
        document.createElement('span');

    status.className =
        `activity-status ${getMovementStatusClass(
            movement.status
        )
        }`;

    status.textContent =
        movement.status || 'Pendiente';

    right.append(amount, status);
    article.append(avatar, main, right);

    return article;
}


function renderWalletMovements(movements) {
    if (!walletActivityList) {
        return;
    }

    walletActivityList.replaceChildren();

    if (!movements.length) {
        const emptyMessage =
            document.createElement('p');

        emptyMessage.className =
            'wallet-empty-activity';

        emptyMessage.textContent =
            'No tienes movimientos recientes.';

        walletActivityList.appendChild(
            emptyMessage
        );

        return;
    }

    movements.forEach((movement) => {
        walletActivityList.appendChild(
            createMovementElement(movement)
        );
    });
}

function formatTransferAmount() {
    const digits =
        transferAmount.value
            .replace(/\D/g, '')
            .replace(/^0+(?=\d)/, '')
            .slice(0, 12);

    if (!digits) {
        transferAmount.value = '';
        transferAmount.dataset.cents = '';
        return;
    }

    const amountCents =
        Number(digits);

    transferAmount.dataset.cents =
        String(amountCents);

    transferAmount.value =
        new Intl.NumberFormat(
            'es-ES',
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        ).format(
            amountCents / 100
        );
}

initializeWallet();