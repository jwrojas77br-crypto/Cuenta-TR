if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const isInsideHtmlFolder = window.location.pathname.includes('/HTML/');
    const serviceWorkerUrl = isInsideHtmlFolder ? new URL('../sw.js', window.location.href).href : new URL('./sw.js', window.location.href).href;

    navigator.serviceWorker.register(serviceWorkerUrl).catch((error) => {
      console.error('Error registrando service worker:', error);
    });
  });
}
