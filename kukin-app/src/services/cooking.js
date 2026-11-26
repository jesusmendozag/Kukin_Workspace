import { Capacitor } from '@capacitor/core';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { LocalNotifications } from '@capacitor/local-notifications';

/** Modo cocina: herramientas para cocinar con las manos ocupadas. Nada de esto debe romper la app si falla. */

const native = () => Capacitor.isNativePlatform();

/** Mantiene la pantalla encendida mientras se ve una receta. */
export async function setScreenAwake(on) {
  if (!native()) return;
  try {
    if (on) await KeepAwake.keepAwake();
    else await KeepAwake.allowSleep();
  } catch {
    // sin acción
  }
}

/** Lee un paso en voz alta (español de México). */
export async function speak(text) {
  try {
    if (native()) {
      await TextToSpeech.stop();
      await TextToSpeech.speak({ text, lang: 'es-MX', rate: 0.95 });
    } else if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'es-MX';
      window.speechSynthesis.speak(u);
    }
  } catch {
    // sin acción
  }
}

export async function stopSpeaking() {
  try {
    if (native()) await TextToSpeech.stop();
    else window.speechSynthesis?.cancel();
  } catch {
    // sin acción
  }
}

const NUMBER_WORDS = { un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, quince: 15, veinte: 20, treinta: 30 };

/**
 * Busca un tiempo en el texto del paso: "cocina 10 minutos", "de 5 a 7 minutos", "1 hora", "30 segundos".
 * Regresa los segundos (si es un rango, el mayor) o null.
 */
export function findTimerSeconds(text) {
  const m = text.toLowerCase().match(
    /(\d+(?:[.,]\d+)?|un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|quince|veinte|treinta)(?:\s*(?:a|-|–|o)\s*(\d+))?\s*(horas?|hrs?|minutos?|mins?|segundos?|segs?)\b/,
  );
  if (!m) return null;
  const first = NUMBER_WORDS[m[1]] ?? Number(m[1].replace(',', '.'));
  const value = m[2] ? Math.max(first, Number(m[2])) : first;
  if (!value) return null;
  const unit = m[3];
  const seconds = unit.startsWith('h') ? value * 3600 : unit.startsWith('s') ? value : value * 60;
  return seconds >= 10 && seconds <= 6 * 3600 ? Math.round(seconds) : null;
}

const TIMER_NOTIFICATION_ID = 990001;

/** Aviso del celular cuando termina el temporizador (suena aunque la app esté en segundo plano). */
export async function scheduleTimerAlert(seconds, label) {
  if (!native()) return;
  try {
    let perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') perm = await LocalNotifications.requestPermissions();
    if (perm.display !== 'granted') return;
    await LocalNotifications.cancel({ notifications: [{ id: TIMER_NOTIFICATION_ID }] });
    await LocalNotifications.schedule({
      notifications: [{
        id: TIMER_NOTIFICATION_ID,
        title: '⏰ ¡Tiempo!',
        body: label,
        schedule: { at: new Date(Date.now() + seconds * 1000), allowWhileIdle: true },
      }],
    });
  } catch {
    // sin acción
  }
}

export async function cancelTimerAlert() {
  if (!native()) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: TIMER_NOTIFICATION_ID }] });
  } catch {
    // sin acción
  }
}

export const formatClock = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(h ? 2 : 1, '0');
  return `${h ? `${h}:` : ''}${mm}:${String(sec).padStart(2, '0')}`;
};
