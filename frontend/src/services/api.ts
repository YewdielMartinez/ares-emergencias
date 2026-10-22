const apiBase = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/+$/, '');

export async function api<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${apiBase}/api${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(
      typeof error?.detail === 'string'
        ? error.detail
        : `No se pudo completar la operación (${response.status})`,
    );
  }
  return response.json();
}
