import { toast } from '@yewdiel21/motion-kit/react';

/** Un punto de entrada para avisos de la aplicación y errores HTTP. */
export function notify(message: string) {
  toast(message, { duration: 4500, tone: 'info' });
}
