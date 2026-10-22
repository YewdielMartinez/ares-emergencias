# Publicar ARES con Vercel y Railway

React se aloja en Vercel y consume la API Python de Railway mediante HTTPS. Los algoritmos y las decisiones del simulador siguen ejecutándose en Python.

## 1. Publicar la API en Railway

1. Sube estos cambios al repositorio `YewdielMartinez/ares-emergencias`.
2. Crea un proyecto en Railway con **Deploy from GitHub repo** y selecciona el repositorio y la rama que contiene los cambios. Como el repositorio es privado, autoriza su acceso desde Railway.
3. Conserva **Root Directory** en la raíz del repositorio. Railway detecta el `Dockerfile`, instala `requirements-lock.txt` y ejecuta `backend.main:app` en `0.0.0.0` usando su variable `PORT`. Deja vacíos los comandos personalizados de compilación y arranque.
4. Configura **Healthcheck Path** como `/api/health` y conserva **una sola réplica**.
5. En **Networking**, genera un dominio público. Usa el puerto asignado mediante `PORT` al configurar el dominio.
6. Abre `https://TU-API.up.railway.app/api/health`: debe responder con `status: "ok"`. La documentación estará en `https://TU-API.up.railway.app/docs`.

La imagen contiene únicamente el backend y sus dependencias. El frontend se compila por separado en Vercel.

## 2. Publicar el frontend en Vercel

1. Importa el mismo repositorio y selecciona la rama con los cambios. Autoriza el acceso al repositorio privado.
2. Configura **Root Directory** como `frontend` y **Framework Preset** como **Vite**. El archivo `frontend/vercel.json` establece `npm ci`, `npm run build` y la salida `dist`.
3. Agrega esta variable para **Production** antes de desplegar:

   ```text
   VITE_API_URL=https://TU-API.up.railway.app
   ```

   Usa el origen HTTPS real de Railway, sin `/api` ni otras rutas. Si usas previews, configura también la variable en **Preview**.

4. Despliega y copia el dominio de producción del frontend, por ejemplo `https://TU-FRONTEND.vercel.app`.

`VITE_API_URL` se incorpora al compilar React: después de cambiarla debes volver a desplegar el frontend. Es una URL pública, no una credencial.

## 3. Permitir el dominio del frontend

En las variables del servicio de Railway agrega:

```text
ARES_CORS_ORIGINS=https://TU-FRONTEND.vercel.app
```

Aplica los cambios y espera el nuevo despliegue. El valor admite varios orígenes separados por comas para dominios adicionales o previews concretas:

```text
ARES_CORS_ORIGINS=https://TU-FRONTEND.vercel.app,https://TU-PREVIEW.vercel.app
```

Cada origen contiene solo protocolo y dominio, sin rutas. Agrega el dominio que realmente abres en el navegador. La configuración no permite automáticamente todos los sitios de `vercel.app`.

## 4. Comprobar la publicación

- `/api/health` de Railway devuelve `status: "ok"` y `/docs` muestra la API.
- El frontend de Vercel muestra **Motor Python conectado**.
- **Un paso** incrementa el tick y **Nueva emergencia** registra un incidente.
- En la pestaña Network del navegador, las llamadas a `/api/state` y `/api/step` van al dominio de Railway y responden correctamente.

Si aparece un error de CORS, compara el origen del navegador con `ARES_CORS_ORIGINS`. Si la petición va a Vercel en lugar de Railway, revisa `VITE_API_URL` y recompila el frontend.

## Desarrollo local y estado de la simulación

Sin `VITE_API_URL`, el frontend conserva las peticiones a `/api` del mismo origen: siguen funcionando `start.ps1` y el proxy de Vite. Sin `ARES_CORS_ORIGINS`, la API permite los dos orígenes locales de Vite en el puerto 5173. Los archivos `.env.example` documentan los valores; el backend recibe variables del proceso o del panel de Railway.

La simulación mantiene un escenario compartido en memoria. Todos los visitantes modifican el mismo escenario y este se reinicia cuando Railway reinicia o despliega la API. Mantén un único proceso y una única réplica para evitar escenarios distintos según la petición; el `Dockerfile` ya fija `--workers 1`.

## Verificar la imagen localmente

Con Docker iniciado, desde la raíz:

```powershell
docker build -t ares-api .
docker run --rm -p 8001:8000 -e ARES_CORS_ORIGINS=http://127.0.0.1:5173 ares-api
```

La API queda en `http://127.0.0.1:8001/api/health`. Para conectar Vite a esa imagen en PowerShell:

```powershell
cd frontend
$env:VITE_API_URL = 'http://127.0.0.1:8001'
npm run dev
```

## Referencias

- [Railway: despliegue con Dockerfile](https://docs.railway.com/builds/dockerfiles).
- [Railway: comprobación de salud](https://docs.railway.com/deployments/healthchecks).
- [Vercel: Vite](https://vercel.com/docs/frameworks/frontend/vite).
- [Vite: variables de entorno](https://vite.dev/guide/env-and-mode).
