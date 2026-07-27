const AUTH_SESSION_KEY = 'tr-authenticated';
const LOCAL_DEVELOPMENT_HOSTS = [
  'localhost',
  '127.0.0.1',
  '[::1]'
];

const isLocalDevelopment =
  LOCAL_DEVELOPMENT_HOSTS.includes(
    window.location.hostname
  );

const shouldEnforceAuthentication =
  !isLocalDevelopment;

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

if (
  shouldEnforceAuthentication &&
  isLoginShell &&
  isAuthenticated
) {
  redirectToWallet();
}

if (
  shouldEnforceAuthentication &&
  isWalletShell &&
  !isAuthenticated
) {
  redirectToLogin();
}

if (
  shouldEnforceAuthentication &&
  isLandingShell &&
  isAuthenticated
) {
  redirectToWallet();
}

if (isLandingShell && isAuthenticated) {
  redirectToWallet();
}

window.addEventListener('pageshow', () => {
  const sessionIsValid = sessionStorage.getItem(AUTH_SESSION_KEY) === '1';

  if (
    shouldEnforceAuthentication &&
    isLoginShell &&
    sessionIsValid
  ) {
    redirectToWallet();
  }

  if (
    shouldEnforceAuthentication &&
    isWalletShell &&
    !sessionIsValid
  ) {
    redirectToLogin();
  }

  if (
    shouldEnforceAuthentication &&
    isLandingShell &&
    sessionIsValid
  ) {
    redirectToWallet();
  }
});

window.addEventListener('load', () => {
  const sessionIsValid = sessionStorage.getItem(AUTH_SESSION_KEY) === '1';

  if (isLandingShell) {
    redirectLandingLoginWithReplace();
  }

  if (
    shouldEnforceAuthentication &&
    isLoginShell &&
    sessionIsValid
  ) {
    redirectToWallet();
  }

  if (
    shouldEnforceAuthentication &&
    isWalletShell &&
    !sessionIsValid
  ) {
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
