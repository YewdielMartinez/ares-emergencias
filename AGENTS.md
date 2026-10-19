# Desarrollo de ARES

- Python contiene las reglas, la coordinación y los algoritmos. React consume la API y no replica decisiones del motor.
- Mantener las responsabilidades de `domain`, `algorithms`, `application`, `infrastructure` y `api`.
- Antes de modificar la interfaz, leer `frontend/node_modules/@yewdiel21/motion-kit/skills/motion-kit/SKILL.md` y la documentación del componente correspondiente. `npm ci` restaura esos archivos si falta `node_modules`.
- Usar `Nav`, `Menu`, `Dialog`, `Steps`, `ThemePicker` y los controles del kit donde corresponda. No reproducir esos componentes con implementaciones visuales paralelas.
- Conservar las formas, tipografía, estados y animaciones originales del kit. Usar sus tokens `--mk-*` y variables públicas de personalización; limitar el CSS de aplicación a composición, layout y elementos propios del simulador.
- No editar `node_modules`. Los adaptadores controlados viven en `components/KitControls.tsx`.
- Al integrar `Steps`, distinguir el índice solicitado del índice confirmado por `onChange`. Evitar deshabilitar nativamente un botón que debe recuperar el foco después de cerrar `Menu`; usar `aria-disabled` y prevenir su activación mientras haya una solicitud pendiente.
- Verificar cambios de interfaz con `npm run build` y `npm run test:e2e`. Los tests E2E reinician el escenario. Para cambios del motor: `python -m unittest discover -s tests -v`.
