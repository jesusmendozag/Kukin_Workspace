/**
 * Recibe de MainActivity.java el tamaño de las barras del sistema y el estado del teclado.
 * Lo deja en CSS como --safe-top / --safe-bottom / --safe-left / --safe-right y la clase
 * "keyboard-open" en <html>. En el navegador no existe KukinNative y se usa env() del CSS.
 */
export function installNativeInsets() {
  const root = document.documentElement;

  window.__kukinApplyInsets = (insets) => {
    if (!insets) return;
    root.style.setProperty('--safe-top', `${insets.top}px`);
    root.style.setProperty('--safe-bottom', `${insets.bottom}px`);
    root.style.setProperty('--safe-left', `${insets.left}px`);
    root.style.setProperty('--safe-right', `${insets.right}px`);
    root.classList.toggle('keyboard-open', Boolean(insets.keyboard));

    // Al abrir el teclado: mover la pantalla SOLO si el campo enfocado quedó tapado.
    // (Antes se centraba siempre, y con un buscador fijo arriba la página brincaba a la mitad de la lista.)
    if (insets.keyboard) {
      requestAnimationFrame(() => {
        const el = document.activeElement;
        if (!el || !/INPUT|TEXTAREA|SELECT/.test(el.tagName)) return;
        const rect = el.getBoundingClientRect();
        if (rect.bottom > window.innerHeight - 8 || rect.top < 0) {
          el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      });
    }
  };

  try {
    const initial = window.KukinNative?.getInsets?.();
    if (initial) window.__kukinApplyInsets(JSON.parse(initial));
  } catch {
    // Sin puente nativo (navegador): se queda con env(safe-area-inset-*)
  }
}
