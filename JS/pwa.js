const AUTH_SESSION_KEY = 'tr-authenticated';
const isAuthenticated = sessionStorage.getItem(AUTH_SESSION_KEY) === '1';
const isLoginShell = document.body.classList.contains('login-shell');
const isWalletShell = document.body.classList.contains('wallet-shell');
const isLandingShell = !isLoginShell && !isWalletShell;

function getHtmlBasePath() {
  return window.location.pathname.includes('/HTML/') ? '../HTML/' : 'HTML/';
}

function redirectToWallet() {
  window.location.replace(`${getHtmlBasePath()}wallet.html`);
}

function redirectToLogin() {
  window.location.replace(`${getHtmlBasePath()}login.html`);
}

function redirectLandingLoginWithReplace() {
  const loginTrigger = document.getElementById('landing-login-button');

  if (!loginTrigger) {
    return;
  }

  loginTrigger.addEventListener('click', (event) => {
    event.preventDefault();
    window.location.replace(`${getHtmlBasePath()}login.html`);
  });
}

if (isLoginShell && isAuthenticated) {
  redirectToWallet();
}

if (isWalletShell && !isAuthenticated) {
  redirectToLogin();
}

if (isLandingShell && isAuthenticated) {
  redirectToWallet();
}

window.addEventListener('pageshow', () => {
  const sessionIsValid = sessionStorage.getItem(AUTH_SESSION_KEY) === '1';

  if (isLoginShell && sessionIsValid) {
    redirectToWallet();
  }

  if (isWalletShell && !sessionIsValid) {
    redirectToLogin();
  }

  if (isLandingShell && sessionIsValid) {
    redirectToWallet();
  }
});

window.addEventListener('load', () => {
  const sessionIsValid = sessionStorage.getItem(AUTH_SESSION_KEY) === '1';

  if (isLandingShell) {
    redirectLandingLoginWithReplace();
  }

  if (isLoginShell && sessionIsValid) {
    redirectToWallet();
  }

  if (isWalletShell && !sessionIsValid) {
    redirectToLogin();
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const isInsideHtmlFolder = window.location.pathname.includes('/HTML/');
    const serviceWorkerUrl = isInsideHtmlFolder ? new URL('../sw.js', window.location.href).href : new URL('./sw.js', window.location.href).href;

    navigator.serviceWorker.register(serviceWorkerUrl).catch((error) => {
      console.error('Error registrando service worker:', error);
    });
  });
}
