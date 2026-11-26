import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

/** Días de anticipación con los que se avisa que un ingrediente está por caducar. */
const DAYS_BEFORE = 2;
const NOTIFY_HOUR = 9; // 9:00 a. m.

export const daysUntil = (dateString) => {
  if (!dateString) return null;
  const [y, m, d] = dateString.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
};

/**
 * Programa notificaciones locales para los ingredientes que caducan pronto.
 * Se reprograman cada vez que cambia el inventario, así nunca quedan avisos viejos.
 * En el navegador no hace nada (las notificaciones locales son una función del celular).
 */
export async function scheduleExpirationReminders(inventory) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    let perm = await LocalNotifications.checkPermissions();
    if (perm.display === 'prompt' || perm.display === 'prompt-with-rationale') {
      perm = await LocalNotifications.requestPermissions();
    }
    if (perm.display !== 'granted') return;

    // Cancela los avisos anteriores antes de programar los nuevos
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications.filter((n) => n.id < 990000).map((n) => ({ id: n.id })) });
    }

    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);
    const notifications = inventory
      .filter((item) => item.expirationDate && daysUntil(item.expirationDate) >= 0)
      .map((item) => {
        const [y, m, d] = item.expirationDate.split('-').map(Number);
        const at = new Date(y, m - 1, d - DAYS_BEFORE, NOTIFY_HOUR, 0, 0);
        if (at <= now) {
          // La fecha de aviso ya pasó (caduca hoy, mañana o pasado): se avisa en unos segundos,
          // pero solo una vez al día por ingrediente para no repetirlo en cada visita.
          const key = `kukin-notified-${item.idInventory}-${todayKey}`;
          if (localStorage.getItem(key)) return null;
          localStorage.setItem(key, '1');
          at.setTime(now.getTime() + 5000);
        }
        const days = daysUntil(item.expirationDate);
        const when = days === 0 ? 'hoy' : days === 1 ? 'mañana' : `en ${days} días`;
        return {
          id: Number(item.idInventory),
          title: `${item.ingredientName} caduca ${when}`,
          body: 'Toca para ver recetas que lo aprovechen antes de que se eche a perder.',
          extra: { route: '/recipes?f=expiring' },
          schedule: { at, allowWhileIdle: true },
        };
      })
      .filter(Boolean);

    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications });
    }
  } catch (error) {
    // Una falla de notificaciones nunca debe romper la app
    console.warn('No se pudieron programar las notificaciones', error);
  }
}

export async function cancelAllReminders() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
    }
  } catch {
    // sin acción
  }
}
