# Línea de diseño Motion Kit

La interfaz usa los componentes y CSS originales de `@yewdiel21/motion-kit` 0.9.1. Se siguió su skill incluida en `frontend/node_modules/@yewdiel21/motion-kit/skills/motion-kit/SKILL.md`, junto con las referencias de componentes y diseño.

| Componente o control del kit | Uso real | Archivo principal |
|---|---|---|
| `.mk-shell`, `Nav` | Armazón de la aplicación, página activa, Dock fijo y barra móvil nativa | `frontend/src/App.tsx` |
| `Menu.*` | Emergencia a comparar, escenarios, velocidad, planificador y opciones de exportación/reinicio | `components/KitControls.tsx`, `pages/Algorithms.tsx`, `App.tsx` |
| `Dialog.*` | Emergencias, reinicio y apariencia; encabezado, cuerpo, pie y foco nativo | `components/IncidentForm.tsx`, `ScenarioDialog.tsx`, `AppearanceDialog.tsx` |
| `Steps`, `Steps.Step`, `Steps.Counter` | Flujo de tres etapas con regreso, validación y revisión antes de enviar | `components/IncidentForm.tsx` |
| `ThemePicker` | Seis paletas originales, sin valores de color duplicados | `components/AppearanceDialog.tsx` |
| `ThemeProvider`, `useTheme` | OLED oscuro por defecto, modo claro/oscuro/sistema y persistencia | `main.tsx`, `AppearanceDialog.tsx` |
| `useTabs`, `.mk-segmented` | Herramientas Explorar/Bloqueos/Ubicar y filtros Activas/Resueltas | `components/KitControls.tsx`, `pages/Operations.tsx` |
| `.mk-field` | Descripción, prioridad y escenario de reinicio | Formularios |
| `.mk-switch` | Visibilidad de rutas y nodos | `components/KitControls.tsx` |
| `.mk-button` y variantes | Acciones primarias, secundarias, de texto e iconos | Toda la interfaz |
| `.mk-chip` y `--filter` | Tipo de respuesta, etiquetas y resumen de paso | Formulario y operaciones |
| `.mk-glass` | Etiqueta sobre el mapa | `components/CityMap.tsx` |
| `Toaster`, `toast` | Confirmaciones y errores | `services/notifications.ts`, `App.tsx` |
| `AnimatedNumber` | Conteos de activas, resueltas y unidades disponibles | `pages/Operations.tsx` |
| `FlipGroup` | Cambio de la lista de incidentes | `pages/Operations.tsx` |
| `useCascade` | Entrada de cabecera | `App.tsx` |
| `useDetails` | Bitácora y métricas, interpretación de resultados, detalles de agentes y secciones de la guía | `components/Disclosure.tsx` |
| GSAP `matchMedia` | Dirección sobre las rutas, con movimiento reducido y limpieza | `hooks/useRouteMotion.ts` |

## Criterio de personalización

Los componentes conservan los colores semánticos `--mk-*`, escalas tipográficas, cápsulas, radios, estados y animaciones de la librería. Se cargan sus hojas `/css`, `/css/themes` y `/css/fonts`; los scripts oficiales se insertan desde Vite. El CSS de ARES organiza la información y representa el dominio urbano, sin reemplazar la navegación ni los controles por copias manuales. No se editan dependencias.

## Jerarquía de información

Operaciones muestra mapa, controles y emergencias. Los conteos viven junto a su contexto; la bitácora y las métricas secundarias se consultan en “Actividad y métricas”. La comparación tiene una sola tabla en su pestaña, precedida por el `Menu` de emergencias. Las explicaciones de los algoritmos se despliegan cuando se necesitan. Las fichas de unidades y la guía siguen el mismo criterio.

`Disclosure` usa `<details>` y `<summary>` semánticos, con la receta `useDetails` del kit para apertura, cierre y giro del indicador. Mantiene los contenidos montados para reflejar los datos de la simulación y respeta el movimiento reducido.

Las pruebas verifican flujos completos, teclado y retorno de foco en el menú de emergencias, detalles plegados y actualizados, validación entre pasos, persistencia del tema y navegación móvil. Las capturas `ares-dashboard.png`, `ares-algorithms.png`, `ares-algorithm-menu.png`, `ares-dialog.png`, `ares-appearance.png`, `ares-mobile.png` y `ares-algorithms-mobile.png` muestran la interfaz entregada.
