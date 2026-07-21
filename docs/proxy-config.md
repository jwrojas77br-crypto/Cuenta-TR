# Configuracion de Proxy - Cuenta TR

## Objetivo
Centralizar la URL base del proxy y el contrato de endpoints para que todas las vistas usen una sola fuente de verdad.

## Fuente de configuracion en frontend
Archivo: JS/config/appConfig.js

Variables y helpers globales disponibles:
- window.APP_CONFIG.PROXY_BASE_URL
- window.resolveProxyBaseUrl()
- window.getApiEndpoint(path)

Override en tiempo de ejecucion (opcional):
- window.LOGIN_PROXY_URL

Si existe `window.LOGIN_PROXY_URL`, se usa ese valor.
Si no existe, se usa `window.APP_CONFIG.PROXY_BASE_URL`.

## URL base actual
- https://cuentatr-dev.multiservicosrojas.workers.dev

## Endpoints
### GET /api/ping
Uso: prueba de conectividad frontend -> proxy -> backend.

Respuesta esperada:
```json
{
  "ok": true,
  "service": "apps-script-api",
  "timestamp": "2026-06-29T20:47:14.330Z"
}
```

### POST /api/auth/login
Body enviado por frontend:
```json
{
  "action": "login",
  "email": "usuario@correo.com",
  "password": "clave"
}
```

Respuesta esperada:
```json
{
  "ok": true,
  "message": "credenciales validas",
  "user": {
    "email": "usuario@correo.com",
    "row": 10
  }
}
```

### POST /api/auth/send-code
Body enviado por frontend:
```json
{
  "action": "sendSecurityCode",
  "email": "usuario@correo.com"
}
```

Respuesta esperada:
```json
{
  "ok": true,
  "message": "Codigo enviado al correo."
}
```

### POST /api/auth/validate-code
Body enviado por frontend:
```json
{
  "action": "validateSecurityCode",
  "code": "1234"
}
```

Respuesta esperada:
```json
{
  "ok": true,
  "message": "Codigo validado correctamente."
}
```

## Archivos que ya consumen esta configuracion
- index.html
- HTML/login.html
- HTML/nuevoAcceso.html
- JS/login/login/loginService.js

## Buenas practicas
- No hardcodear la URL del worker en multiples archivos.
- No exponer la URL de Apps Script en frontend.
- Mantener el proxy como punto unico de entrada para API.
- Mantener logs de request/response en desarrollo para trazabilidad.
