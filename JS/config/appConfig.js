(function initializeAppConfig(windowRef) {
    const defaultProxyBaseUrl = 'https://cuentatr-dev.multiservicosrojas.workers.dev';

    const appConfig = Object.freeze({
        PROXY_BASE_URL: defaultProxyBaseUrl
    });

    function resolveProxyBaseUrl() {
        const runtimeUrl = windowRef.LOGIN_PROXY_URL || appConfig.PROXY_BASE_URL;
        return String(runtimeUrl || defaultProxyBaseUrl).replace(/\/$/, '');
    }

    function getApiEndpoint(path) {
        const normalizedPath = String(path || '/').startsWith('/') ? String(path || '/') : `/${String(path || '')}`;
        return `${resolveProxyBaseUrl()}${normalizedPath}`;
    }

    windowRef.APP_CONFIG = appConfig;
    windowRef.resolveProxyBaseUrl = resolveProxyBaseUrl;
    windowRef.getApiEndpoint = getApiEndpoint;
})(window);
