import { test, expect } from '@playwright/test';
import path from 'node:path';

let pageErrors: string[] = [];

test.beforeEach(async ({ request, page }) => {
  pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await request.post('/api/reset', { data: { scenario: 'urban', seed: 42 } });
  await page.goto('/');
  await expect(page.getByText('Motor Python conectado')).toBeVisible();
});

test.afterEach(() => {
  expect(pageErrors).toEqual([]);
});

test('minimal operations view and one deterministic step', async ({ page, request }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await expect(page.getByRole('heading', { name: 'Operaciones', exact: true })).toBeVisible();
  await expect(
    page.getByRole('img', { name: 'Mapa interactivo de emergencias del Distrito Centro' }),
  ).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Activas 4', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Resultados' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Últimas decisiones' })).not.toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.resolve('../docs/ares-dashboard.png'), fullPage: true });
  await page.getByRole('button', { name: 'Un paso', exact: true }).click();
  await expect(page.getByText('TICK 001', { exact: true })).toBeVisible();
  const state = await (await request.get('/api/state')).json();
  expect(state.incidents.every((i: { status: string }) => i.status === 'assigned')).toBeTruthy();
  expect(errors).toEqual([]);
});

test('run, pause and change simulation speed', async ({ page, request }) => {
  await page.getByRole('button', { name: 'Velocidad de simulación', exact: true }).click();
  await page.getByRole('menuitem', { name: '4× velocidad', exact: true }).click();
  await page.getByRole('button', { name: 'Iniciar simulación', exact: true }).click();
  await expect(page.getByText('Simulación en curso', { exact: true })).toBeVisible();
  await expect
    .poll(async () => (await (await request.get('/api/state')).json()).tick)
    .toBeGreaterThan(1);
  await page.getByRole('button', { name: 'Pausar', exact: true }).click();
  await expect(page.getByText('Simulación en pausa', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Un paso', exact: true })).toBeEnabled();
});

test('register incident and assign matching unit', async ({ page, request }) => {
  await page.getByRole('button', { name: 'Nueva emergencia', exact: true }).click();
  await page.getByLabel('Descripción').fill('Incendio de prueba funcional');
  await page.getByRole('radio', { name: 'Bomberos', exact: true }).check();
  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await page.getByLabel('Prioridad', { exact: true }).selectOption('2');
  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await page.getByRole('button', { name: 'Registrar emergencia', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Incendio de prueba funcional' })).toBeVisible();
  await page.getByRole('button', { name: 'Un paso', exact: true }).click();
  await expect
    .poll(async () => {
      const state = await (await request.get('/api/state')).json();
      return state.incidents.find((i: { id: string }) => i.id === 'EM-005').agent_id;
    })
    .toMatch(/^BOM-/);
});

test('block a road and recalculate active routes', async ({ page, request }) => {
  await page.getByRole('button', { name: 'Un paso', exact: true }).click();
  await expect(page.getByText('TICK 001', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Bloqueos', exact: true }).click();
  await page
    .locator('rect.road-hit')
    .filter({ has: page.locator('title', { hasText: 'Calle (10, 7)' }) })
    .click();
  await expect
    .poll(async () => {
      const state = await (await request.get('/api/state')).json();
      return state.grid.blocked.some((p: number[]) => p[0] === 10 && p[1] === 7);
    })
    .toBeTruthy();
  const state = await (await request.get('/api/state')).json();
  expect(
    state.agents.every((a: { route: number[][] }) =>
      a.route.every((p) => p[0] !== 10 || p[1] !== 7),
    ),
  ).toBeTruthy();
});

test('algorithm strategy, CSV export and agents page', async ({ page, request }) => {
  await page.getByRole('button', { name: 'Algoritmos de búsqueda', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Comparar algoritmos' })).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Emergencia a comparar', exact: true }).click();
  await expect(page.getByRole('menu', { name: 'Emergencia a comparar' })).toBeVisible();
  await page.screenshot({ path: path.resolve('../docs/ares-algorithm-menu.png'), fullPage: true });
  await page.getByRole('menuitem', { name: 'EM-002 · Atención médica urgente' }).click();
  await expect(page.locator('.comparison-panel')).toContainText('AMB-01 (base) → EM-002');
  await expect(page.locator('tbody tr')).toHaveCount(4);
  await expect(page.locator('tbody tr').filter({ hasText: 'BFS' })).toContainText('30');
  await page.getByRole('button', { name: 'Usar Dijkstra', exact: true }).click();
  await expect
    .poll(async () => (await (await request.get('/api/state')).json()).algorithm)
    .toBe('Dijkstra');
  await page.screenshot({ path: path.resolve('../docs/ares-algorithms.png'), fullPage: true });
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar comparación CSV' }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('ares-comparacion-urban.csv');
  await page.getByRole('button', { name: 'Unidades y agentes', exact: true }).click();
  await expect(page.locator('.agent-card')).toHaveCount(6);
  const firstAgent = page.locator('.agent-card').filter({ hasText: 'AMB-01' });
  await expect(firstAgent.getByText('Ubicación', { exact: true })).not.toBeVisible();
  await firstAgent.getByText('Detalles de AMB-01', { exact: true }).click();
  await expect(firstAgent.getByText('Ubicación', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Guía del proyecto', exact: true }).click();
  await page.locator('summary').filter({ hasText: 'Modelo PEAS' }).click();
  await expect(page.getByRole('heading', { name: 'Modelo PEAS' })).toBeVisible();
});

test('switch scenario and complete every emergency', async ({ page, request }) => {
  await page.getByRole('button', { name: 'Elegir escenario', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Vías bloqueadas', exact: true }).click();
  await page.getByRole('button', { name: 'Reiniciar escenario', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Elegir escenario', exact: true })).toContainText(
    'Vías bloqueadas',
  );
  await request.post('/api/step', { data: { steps: 100 } });
  await page.reload();
  await expect(page.getByText('Todo bajo control', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Resueltas 4', exact: true }).click();
  await expect(page.locator('.incident-card')).toHaveCount(4);
});

test('mobile navigation, responsive layout and theme', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('heading', { name: 'Operaciones', exact: true })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
  await page.screenshot({ path: path.resolve('../docs/ares-mobile.png'), fullPage: true });
  await page.getByRole('button', { name: 'Unidades y agentes', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Unidades', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Personalizar interfaz' }).click();
  await page.getByRole('tab', { name: 'Oscuro', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Listo', exact: true }).click();
  await expect(page.locator('[data-mk-ghost], [data-mk-veil]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Algoritmos de búsqueda', exact: true }).click();
  await page.getByRole('button', { name: 'Emergencia a comparar', exact: true }).click();
  await page.getByRole('menuitem', { name: 'EM-002 · Atención médica urgente' }).click();
  await expect(page.locator('.comparison-panel')).toContainText('EM-002');
  await expect(page.getByRole('menu', { name: 'Emergencia a comparar' })).not.toBeVisible();
  await expect(page.locator('[data-mk-ghost], [data-mk-veil]')).toHaveCount(0);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
  await page.screenshot({
    path: path.resolve('../docs/ares-algorithms-mobile.png'),
    fullPage: true,
  });
});

test('Motion Kit dialog traps focus, closes with Escape and returns focus', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Nueva emergencia', exact: true });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Nueva emergencia', exact: true });
  await expect(dialog).toBeVisible();
  await expect(page.getByLabel('Descripción')).toBeFocused();
  await page.getByLabel('Descripción').fill('Borrador de emergencia');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test('Motion Kit reduced motion keeps dialogs and counters functional', async ({
  page,
  request,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await page.getByRole('button', { name: 'Nueva emergencia', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Nueva emergencia', exact: true })).toBeVisible();
  await page.screenshot({ path: path.resolve('../docs/ares-dialog.png'), fullPage: true });
  await page.getByLabel('Descripción').fill('Atención con movimiento reducido');
  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await page.getByRole('button', { name: 'Registrar emergencia', exact: true }).click();
  await expect
    .poll(async () => (await (await request.get('/api/state')).json()).incidents.length)
    .toBe(5);
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('tab', { name: 'Activas 5', exact: true })).toBeVisible();
});

test('native Menu supports keyboard selection and focus return', async ({ page, request }) => {
  const trigger = page.getByRole('button', { name: 'Planificador', exact: true });
  await trigger.click();
  await expect(page.getByRole('menu', { name: 'Planificador', exact: true })).toBeVisible();
  await page.keyboard.press('Home');
  await page.keyboard.press('Enter');
  await expect
    .poll(async () => (await (await request.get('/api/state')).json()).algorithm)
    .toBe('BFS');
  await expect(trigger).toBeFocused();
});

test('comparison emergency uses native Menu with keyboard and focus return', async ({ page }) => {
  await page.getByRole('button', { name: 'Algoritmos de búsqueda', exact: true }).click();
  const trigger = page.getByRole('button', { name: 'Emergencia a comparar', exact: true });
  await trigger.click();
  await expect(page.locator('dialog.mk-menu[open]')).toBeVisible();
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(trigger).toContainText('EM-002 · Atención médica urgente');
  await expect(page.locator('.comparison-panel')).toContainText('AMB-01 (base) → EM-002');
  await expect(trigger).toBeFocused();
  await expect(page.getByRole('combobox')).toHaveCount(0);
});

test('secondary information stays collapsed and shows updated simulation data', async ({
  page,
}) => {
  const summary = page.locator('summary').filter({ hasText: 'Actividad y métricas' });
  await expect(page.getByText('Respuesta promedio', { exact: true })).not.toBeVisible();
  await page.getByRole('button', { name: 'Un paso', exact: true }).click();
  await expect(page.getByText('TICK 001', { exact: true })).toBeVisible();
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Últimas decisiones' })).toBeVisible();
  await expect(
    page.locator('.metrics-list > div').filter({ hasText: 'Pendientes de asignación' }),
  ).toHaveText(/Pendientes de asignación\s*0/);
  await expect(page.locator('.event-list')).toContainText('asignada a EM-001');
  await summary.click();
  await expect(page.getByText('Respuesta promedio', { exact: true })).not.toBeVisible();
  await page.getByRole('button', { name: 'Algoritmos de búsqueda', exact: true }).click();
  await expect(page.getByText('Búsqueda de costo uniforme', { exact: true })).not.toBeVisible();
  await page.locator('summary').filter({ hasText: 'Cómo interpretar los resultados' }).click();
  await expect(page.getByText('Búsqueda de costo uniforme', { exact: true })).toBeVisible();
  await expect(page.locator('.algorithm-notes > div')).toHaveCount(4);
});

test('Steps validates input, preserves values when going back and shows a review', async ({
  page,
  request,
}) => {
  await page.getByRole('button', { name: 'Nueva emergencia', exact: true }).click();
  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await expect(page.getByLabel('Descripción')).toBeVisible();
  expect(
    await page
      .getByLabel('Descripción')
      .evaluate((node: HTMLInputElement) => node.validity.valueMissing),
  ).toBeTruthy();
  await page.getByLabel('Descripción').fill('Emergencia con revisión');
  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await page.getByLabel('Prioridad', { exact: true }).selectOption('2');
  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Todo listo para responder' })).toBeVisible();
  await expect(page.locator('.review-list')).toContainText('Media');
  await page.getByRole('button', { name: 'Atrás', exact: true }).click();
  await expect(page.getByLabel('Prioridad', { exact: true })).toHaveValue('2');
  await page.getByRole('button', { name: 'Atrás', exact: true }).click();
  await expect(page.getByLabel('Descripción')).toHaveValue('Emergencia con revisión');
  expect((await (await request.get('/api/state')).json()).incidents).toHaveLength(4);
});

test('Dock stays fixed and OLED defaults respect saved theme preferences', async ({
  page,
}) => {
  await expect(page.locator('html')).toHaveAttribute('data-mk-theme', 'oled');
  await expect(page.locator('html')).toHaveAttribute('data-mk-mode', 'dark');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
  await expect(page.locator('nav.mk-nav')).toHaveClass(/mk-nav--dock/);
  await page.evaluate(() => localStorage.setItem('ares-nav', 'tasks'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await expect(page.locator('nav.mk-nav')).toHaveClass(/mk-nav--dock/);
  await page.getByRole('button', { name: 'Personalizar interfaz' }).click();
  await expect(page.getByLabel('Estilo de navegación', { exact: true })).toHaveCount(0);
  await expect(page.locator('.mk-theme-picker .mk-swatch')).toHaveCount(6);
  await page.locator('.mk-swatch[data-mk-swatch="blue"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-mk-theme', 'blue');
  await page.getByRole('tab', { name: 'Claro', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-mk-mode', 'light');
  await page.screenshot({ path: path.resolve('../docs/ares-appearance.png'), fullPage: true });
  await page.getByRole('button', { name: 'Listo', exact: true }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-mk-theme', 'blue');
  await expect(page.locator('html')).toHaveAttribute('data-mk-mode', 'light');
  await expect(page.locator('nav.mk-nav')).toHaveClass(/mk-nav--dock/);
});
