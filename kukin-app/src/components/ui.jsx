import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { IconBack } from './Icons';

/**
 * Elementos fijos en pantalla (botón +, barras inferiores). Se dibujan directo en <body>
 * para que ninguna animación del contenedor los arrastre con el scroll.
 */
export function Floating({ children }) {
  return createPortal(children, document.body);
}

/** Olla con vapor para las vistas de carga. */
export function PotLoader({ text = 'Cocinando sugerencias…', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`} role="status" aria-live="polite">
      <div className="relative w-24 h-24" aria-hidden="true">
        <span className="steam absolute left-[30%] top-0 w-2.5 h-7 rounded-full bg-basil/30 blur-[2px]" />
        <span className="steam absolute left-[46%] top-0 w-2.5 h-7 rounded-full bg-basil/30 blur-[2px] [animation-delay:0.5s]" />
        <span className="steam absolute left-[62%] top-0 w-2.5 h-7 rounded-full bg-basil/30 blur-[2px] [animation-delay:1s]" />
        <span className="pot-bob absolute inset-x-0 bottom-0 text-center text-[3.6rem] leading-none">🍲</span>
      </div>
      <p className="font-bold text-soft">{text}</p>
    </div>
  );
}

/**
 * Título de pantalla editorial (Fraunces, azul marino) sobre el fondo crema.
 * Respeta la barra de estado con pt-safe; compacto para no robar pantalla.
 */
export function PageTitle({ title, subtitle, back = false, action }) {
  const navigate = useNavigate();
  return (
    <header className="pt-safe px-5">
      <div className="pt-4 pb-5 flex items-center gap-3">
        {back && (
          <button type="button" onClick={() => navigate(-1)} aria-label="Regresar"
            className="w-12 h-12 shrink-0 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-90 transition-transform">
            <IconBack className="w-6 h-6" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-black text-navy text-[2.25rem] leading-[1.05]">{title}</h1>
          {subtitle && <p className="mt-1 font-semibold text-soft">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}

/** Aviso de error con opción de reintentar. */
export function ErrorBox({ message, onRetry }) {
  if (!message) return null;
  return (
    <div role="alert" className="bg-alert-bg text-alert rounded-[20px] px-5 py-4 flex items-center gap-3">
      <p className="flex-1 font-bold">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry}
          className="min-h-11 px-4 rounded-full bg-white font-bold text-alert active:scale-95 transition-transform">
          Reintentar
        </button>
      )}
    </div>
  );
}

/** Estado vacío: un dibujo, una frase y una acción. */
export function EmptyState({ emoji, title, text, actionLabel, onAction }) {
  return (
    <div className="bg-white rounded-[32px] px-6 py-9 text-center shadow-sm">
      <div className="text-6xl mb-4" aria-hidden="true">{emoji}</div>
      <h2 className="font-display font-black text-navy text-[1.6rem] leading-tight">{title}</h2>
      {text && <p className="mt-2 text-soft">{text}</p>}
      {actionLabel && (
        <button type="button" onClick={onAction}
          className="mt-6 min-h-14 px-7 rounded-full bg-basil text-white font-bold text-[1.06rem] active:scale-95 transition-transform">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
