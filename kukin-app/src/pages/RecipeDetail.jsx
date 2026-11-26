import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IconClock, IconBack, IconCheck, IconSpeaker, IconTimer, IconClose, IconCart } from '../components/Icons';
import { Floating, PotLoader, ErrorBox } from '../components/ui';
import api, { getErrorMessage } from '../services/api';
import { getIngredientMeta, foldAccents } from '../services/ingredients';
import {
  setScreenAwake, speak, stopSpeaking, findTimerSeconds, scheduleTimerAlert, cancelTimerAlert, formatClock,
} from '../services/cooking';
import { addToShoppingList, getShoppingList, onShoppingListChange } from '../services/shoppingList';

/** Temporizador que termina dentro de `seconds` segundos (se llama al tocar el botón, no al dibujar). */
const newTimer = (seconds, label) => ({ endsAt: Date.now() + seconds * 1000, total: seconds, label });

const formatAmount = (n) => Number(n).toLocaleString('es-MX', { maximumFractionDigits: 2 });

// Al ajustar "cuánto te queda": de 50 en 50 para gramos/mililitros, de cuarto en cuarto para kilos/litros
const stepFor = (unit) => {
  const u = (unit || '').toLowerCase();
  if (u === 'g' || u === 'ml') return 50;
  if (u === 'kg' || u === 'l' || u === 'lb') return 0.25;
  return 1;
};
const roundFor = (value, unit) => {
  const u = (unit || '').toLowerCase();
  if (u === 'g' || u === 'ml') return Math.max(0, Math.round(value));
  if (u === 'pza' || u === 'diente' || u === 'lata' || u === 'manojo') return Math.max(0, Math.round(value * 2) / 2);
  return Math.max(0, Math.round(value * 100) / 100);
};

/** Botón de regreso fijo arriba a la izquierda (se queda visible al hacer scroll). */
function BackButton() {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate(-1)} aria-label="Regresar"
      className="fixed left-4 top-[calc(var(--safe-top)+0.75rem)] z-40 w-12 h-12 rounded-full bg-white/95 text-navy shadow-[0_6px_16px_-6px_rgb(11_30_54/0.35)] flex items-center justify-center active:scale-90 transition-transform">
      <IconBack className="w-6 h-6" />
    </button>
  );
}

/** Temporizador flotante de un paso. Avisa con vibración y con notificación aunque la app esté cerrada. */
function StepTimer({ timer, onClose }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, Math.round((timer.endsAt - now) / 1000));
  const ringing = left === 0;
  useEffect(() => {
    if (ringing) navigator.vibrate?.([500, 250, 500, 250, 500]);
  }, [ringing]);
  const pct = 100 - (left / timer.total) * 100;

  return (
    <div role="timer" aria-live={ringing ? 'assertive' : 'off'}
      className={`fixed left-4 right-4 bottom-[calc(var(--safe-bottom)+1rem)] z-40 mx-auto max-w-md rounded-full shadow-[0_12px_30px_-10px_rgb(11_30_54/0.45)] overflow-hidden animate-fade-in-up ${
        ringing ? 'bg-basil text-white' : 'bg-navy text-white'}`}>
      {!ringing && <div className="absolute inset-y-0 left-0 bg-white/10 transition-[width] duration-1000 ease-linear" style={{ width: `${pct}%` }} aria-hidden="true" />}
      <div className="relative flex items-center gap-3 pl-5 pr-2 py-2">
        <IconTimer className={`w-6 h-6 shrink-0 ${ringing ? 'check-pop' : ''}`} />
        <div className="flex-1 min-w-0">
          <p className="font-black text-[1.35rem] leading-none tabular">{ringing ? '¡Tiempo!' : formatClock(left)}</p>
          <p className="text-[0.85rem] text-white/80 truncate">{timer.label}</p>
        </div>
        <button type="button" onClick={onClose} aria-label={ringing ? 'Listo' : 'Cancelar temporizador'}
          className={`min-h-12 px-4 rounded-full font-bold active:scale-95 transition-transform ${ringing ? 'bg-white text-basil' : 'bg-white/15'}`}>
          {ringing ? 'Listo' : <IconClose className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}

/** Hoja "Ya la cociné": propone cuánto te queda de cada ingrediente y actualiza la alacena. */
function CookedSheet({ items, onClose, onSaved }) {
  const [rows, setRows] = useState(() => items.map((i) => ({ ...i, remaining: i.proposed })));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const setRemaining = (idx, value) =>
    setRows((r) => r.map((row, k) => (k === idx ? { ...row, remaining: roundFor(value, row.unit) } : row)));

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      for (const row of rows) {
        if (Number(row.remaining) === Number(row.have)) continue;
        await api.patch(`/inventory/${row.idInventory}`, { quantity: Number(row.remaining) });
      }
      onSaved(rows.filter((r) => Number(r.remaining) === 0).length);
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" role="dialog" aria-modal="true" aria-labelledby="cooked-title">
      <button type="button" className="absolute inset-0 bg-navy/45 animate-fade-in-up [animation-duration:0.2s]" aria-label="Cerrar" onClick={onClose} />
      <div className="sheet-up relative w-full max-h-[88dvh] overflow-y-auto bg-cream rounded-t-[40px] px-5 pt-3 pb-[calc(var(--safe-bottom)+1.25rem)]">
        <div className="mx-auto w-12 h-1.5 rounded-full bg-hairline mb-5" aria-hidden="true" />
        <h2 id="cooked-title" className="font-display font-black text-navy text-[1.8rem] leading-tight">¿Cuánto te queda?</h2>
        <p className="text-soft mt-1">Ya calculamos lo que usaste. Ajústalo si no es así.</p>

        {rows.length === 0 ? (
          <p className="mt-6 bg-white rounded-[24px] p-5 shadow-sm font-bold">Esta receta no usó nada de tu alacena.</p>
        ) : (
          <ul className="mt-5 space-y-3">
            {rows.map((row, idx) => {
              const meta = getIngredientMeta(row.name);
              const out = Number(row.remaining) === 0;
              const step = stepFor(row.unit);
              return (
                <li key={row.idInventory} className={`bg-white rounded-[24px] p-4 shadow-sm transition-opacity ${out ? 'opacity-70' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className="w-11 h-11 shrink-0 rounded-[14px] flex items-center justify-center text-[1.5rem]" style={{ background: meta.bg }} aria-hidden="true">{meta.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[1.05rem] truncate first-letter:uppercase">{row.name}</p>
                      <p className="text-[0.88rem] text-soft">
                        {row.used != null ? `Usaste ~${formatAmount(row.used)} ${row.unit} · tenías ${formatAmount(row.have)}` : `Tenías ${formatAmount(row.have)} ${row.unit}`}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex items-center rounded-[20px] bg-cream">
                      <button type="button" onClick={() => setRemaining(idx, Number(row.remaining) - step)} aria-label={`Menos ${row.name}`}
                        className="w-12 h-12 text-2xl font-black text-basil active:scale-90 transition-transform">−</button>
                      <span className="min-w-20 text-center font-black text-[1.1rem] tabular">{formatAmount(row.remaining)} <span className="text-soft font-bold text-[0.9rem]">{row.unit}</span></span>
                      <button type="button" onClick={() => setRemaining(idx, Number(row.remaining) + step)} aria-label={`Más ${row.name}`}
                        className="w-12 h-12 text-2xl font-black text-basil active:scale-90 transition-transform">+</button>
                    </div>
                    <button type="button" onClick={() => setRemaining(idx, out ? row.proposed || row.have : 0)} aria-pressed={out}
                      className={`ml-auto min-h-12 px-4 rounded-full font-bold active:scale-95 transition-transform ${out ? 'bg-alert-bg text-alert' : 'bg-cream text-navy'}`}>
                      {out ? 'Se acabó' : '¿Se acabó?'}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {error && <div className="mt-4"><ErrorBox message={error} /></div>}

        <div className="mt-6 grid gap-3">
          <button type="button" onClick={rows.length ? save : onClose} disabled={saving}
            className="w-full min-h-14 rounded-full bg-navy text-white font-bold text-[1.06rem] active:scale-95 transition-transform disabled:opacity-60">
            {saving ? 'Guardando…' : rows.length ? 'Actualizar mi alacena' : 'Cerrar'}
          </button>
          {rows.length > 0 && (
            <button type="button" onClick={onClose} className="w-full min-h-12 rounded-full font-bold text-soft">Ahora no</button>
          )}
        </div>
      </div>
    </div>
  );
}

function RecipeDetail() {
  const { source, id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [error, setError] = useState('');
  const [haveIt, setHaveIt] = useState({});   // ingredientes marcados
  const [done, setDone] = useState({});       // pasos terminados
  const [justDone, setJustDone] = useState(null);
  const [scrolled, setScrolled] = useState(false);        // ya se pasó la foto
  const [barInView, setBarInView] = useState(true);       // la barra de "Preparación" se ve en pantalla
  const [portions, setPortions] = useState(null);
  const [timer, setTimer] = useState(null);               // { endsAt, total, label }
  const [speaking, setSpeaking] = useState(null);         // índice del paso que se está leyendo
  const [cookedOpen, setCookedOpen] = useState(false);
  const [cookedDone, setCookedDone] = useState(false);
  const [listNames, setListNames] = useState(() => new Set(getShoppingList().map((i) => foldAccents(i.name).trim())));
  const heroRef = useRef(null);
  const barRef = useRef(null);

  // Modo cocina: pantalla encendida mientras la receta está abierta
  useEffect(() => {
    setScreenAwake(true);
    return () => {
      setScreenAwake(false);
      stopSpeaking();
    };
  }, []);

  useEffect(() => onShoppingListChange(() =>
    setListNames(new Set(getShoppingList().map((i) => foldAccents(i.name).trim())))), []);

  // Encabezado compacto al pasar la foto, y una sola barra de progreso visible a la vez
  useEffect(() => {
    if (!recipe) return undefined;
    const onScroll = () => {
      const heroBottom = heroRef.current?.getBoundingClientRect().bottom ?? 0;
      setScrolled(heroBottom < 80);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    let observer;
    if (barRef.current && 'IntersectionObserver' in window) {
      // El encabezado compacto mide ~64px más la barra de estado: lo que quede debajo de él no "se ve"
      observer = new IntersectionObserver(([entry]) => setBarInView(entry.isIntersecting),
        { rootMargin: '-120px 0px 0px 0px' });
      observer.observe(barRef.current);
    }
    return () => {
      window.removeEventListener('scroll', onScroll);
      observer?.disconnect();
    };
  }, [recipe]);

  useEffect(() => {
    let cancelled = false;
    // Todo llega en español desde el backend (traducido al importar la receta)
    api.get(`/recipes/${id}`, { params: { source }, offlineCache: true })
      .then(({ data }) => {
        if (cancelled) return;
        const r = data.data;
        setRecipe({
          title: r.titleRecipe,
          image: r.urlImage,
          time: r.timePreparation,
          servings: r.servings,
          ingredients: (r.ingredients || []).map((ing) => ({
            name: ing.ingredientName,
            amount: Number(ing.amount),
            unit: ing.unitSymbol,
            inInventory: ing.inUserInventory,
            idInventory: ing.idInventory,
            have: ing.inventoryQuantity != null ? Number(ing.inventoryQuantity) : null,
            haveUnit: ing.inventoryUnitSymbol,
            usedInHaveUnit: ing.amountInInventoryUnit != null ? Number(ing.amountInInventoryUnit) : null,
          })),
          steps: r.steps || [],
        });
        setPortions(r.servings || null);
      })
      .catch((err) => !cancelled && setError(getErrorMessage(err)));
    return () => { cancelled = true; };
  }, [id, source]);

  if (error) return (
    <div className="min-h-dvh flex flex-col items-center justify-center text-center gap-5 px-6 pt-safe">
      <BackButton />
      <span className="text-6xl" aria-hidden="true">😕</span>
      <p role="alert" className="font-bold text-[1.15rem] text-alert">{error}</p>
      <button type="button" onClick={() => navigate(-1)}
        className="min-h-14 px-7 rounded-full bg-basil text-white font-bold active:scale-95 transition-transform">Regresar</button>
    </div>
  );

  if (!recipe) return (
    <div className="min-h-dvh flex items-center justify-center">
      <BackButton />
      <PotLoader text="Preparando receta…" />
    </div>
  );

  const scale = recipe.servings && portions ? portions / recipe.servings : 1;
  const total = recipe.ingredients.length;
  const have = recipe.ingredients.filter((i) => i.inInventory).length;
  const missing = recipe.ingredients.filter((i) => !i.inInventory);
  const missingNotInList = missing.filter((i) => !listNames.has(foldAccents(i.name).trim()));
  const stepCount = recipe.steps.length;
  const doneCount = Object.values(done).filter(Boolean).length;
  const progress = stepCount ? Math.round((doneCount / stepCount) * 100) : 0;
  const finished = stepCount > 0 && doneCount === stepCount;
  const currentStep = recipe.steps.findIndex((_, i) => !done[i]);

  const toggleStep = (i) => {
    setDone((d) => ({ ...d, [i]: !d[i] }));
    setJustDone(done[i] ? null : i);
  };

  const readStep = async (index) => {
    if (speaking === index) {
      setSpeaking(null);
      await stopSpeaking();
      return;
    }
    setSpeaking(index);
    await speak(`Paso ${index + 1}. ${recipe.steps[index]}`);
    setSpeaking((s) => (s === index ? null : s));
  };

  const startTimer = (seconds, index) => {
    const label = `Paso ${index + 1} · ${recipe.title}`;
    setTimer(newTimer(seconds, label));
    scheduleTimerAlert(seconds, `Terminó el tiempo del paso ${index + 1} de ${recipe.title}`);
  };

  const closeTimer = () => {
    setTimer(null);
    cancelTimerAlert();
  };

  const addMissingToList = () => {
    addToShoppingList(missingNotInList.map((i) => ({
      name: i.name,
      amount: `${formatAmount(i.amount * scale)} ${i.unit || 'pza'}`,
      recipe: recipe.title,
    })));
  };

  // Para "Ya la cociné": lo que tienes, lo que usó la receta (ajustado a las porciones) y lo que te quedaría
  const cookedItems = recipe.ingredients
    .filter((i) => i.idInventory && i.have != null)
    .map((i) => {
      const used = i.usedInHaveUnit != null ? i.usedInHaveUnit * scale : null;
      return {
        idInventory: i.idInventory,
        name: i.name,
        unit: i.haveUnit,
        have: i.have,
        used: used != null ? roundFor(used, i.haveUnit) : null,
        proposed: used != null ? roundFor(i.have - used, i.haveUnit) : i.have,
      };
    });

  return (
    <div className={`min-h-dvh ${timer ? 'pb-[calc(var(--safe-bottom)+7rem)]' : 'pb-[calc(var(--safe-bottom)+3rem)]'}`}>
      <Floating>
        {scrolled ? (
          /* Encabezado compacto: tapa la barra de estado para que el contenido no se vea detrás */
          <header className="fixed inset-x-0 top-0 z-40 bg-cream/95 backdrop-blur-md pt-safe shadow-[0_6px_16px_-12px_rgb(11_30_54/0.4)] animate-fade-in-up [animation-duration:0.25s]">
            <div className="h-16 px-3 flex items-center gap-2">
              <button type="button" onClick={() => navigate(-1)} aria-label="Regresar"
                className="w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-navy active:scale-90 transition-transform">
                <IconBack className="w-6 h-6" />
              </button>
              <p className="flex-1 min-w-0 truncate font-display font-black text-navy text-[1.15rem]">{recipe.title}</p>
              {stepCount > 0 && progress > 0 && (
                <span className="shrink-0 pr-2 font-black text-basil tabular">{progress}%</span>
              )}
            </div>
            {/* Solo cuando la barra de "Preparación" ya no está en pantalla: nunca hay dos a la vez */}
            {stepCount > 0 && !barInView && (
              <div className="h-1 bg-hairline" aria-hidden="true">
                <div className="h-full bg-basil rounded-r-full transition-[width] duration-700 ease-out" style={{ width: `${progress}%` }} />
              </div>
            )}
          </header>
        ) : (
          <BackButton />
        )}
        {timer && <StepTimer key={timer.endsAt} timer={timer} onClose={closeTimer} />}
        {cookedOpen && (
          <CookedSheet items={cookedItems} onClose={() => setCookedOpen(false)}
            onSaved={() => { setCookedOpen(false); setCookedDone(true); }} />
        )}
      </Floating>

      {/* Foto */}
      <div ref={heroRef} className="relative w-full h-[44vh] min-h-72 bg-basil flex items-center justify-center overflow-hidden">
        {recipe.image ? (
          <img src={recipe.image} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-9xl" aria-hidden="true">🍲</span>
        )}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/35 to-transparent" aria-hidden="true" />
      </div>

      {/* Hoja blanca que sube sobre la foto */}
      <div className="sheet-up relative -mt-12 bg-cream rounded-t-[40px] px-5 pt-3">
        <div className="mx-auto w-12 h-1.5 rounded-full bg-hairline mb-6" aria-hidden="true" />

        <h1 className="font-display font-black text-navy text-[2.1rem] leading-[1.08]">{recipe.title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-2 font-bold text-[0.92rem]">
          {recipe.time && (
            <span className="inline-flex items-center gap-1.5 bg-white shadow-sm rounded-full px-3.5 py-2 tabular"><IconClock /> {recipe.time} min</span>
          )}
          {total > 0 && (
            <span className={`inline-flex items-center rounded-full px-3.5 py-2 tabular ${have === total ? 'bg-basil text-white' : 'bg-fresh-bg text-fresh'}`}>
              Tienes {have} de {total}
            </span>
          )}
        </div>

        {/* Porciones: las cantidades se recalculan */}
        {recipe.servings && portions && (
          <div className="mt-4 flex items-center justify-between bg-white rounded-[24px] shadow-sm pl-5 pr-2 py-2">
            <div>
              <p className="label-micro">Porciones</p>
              <p className="font-bold text-[1.02rem]">Para {portions} {portions === 1 ? 'persona' : 'personas'}</p>
            </div>
            <div className="flex items-center rounded-[20px] bg-cream">
              <button type="button" onClick={() => setPortions((p) => Math.max(1, p - 1))} disabled={portions <= 1}
                aria-label="Menos porciones" className="w-12 h-12 text-2xl font-black text-basil active:scale-90 transition-transform disabled:opacity-30">−</button>
              <span className="w-8 text-center font-black text-[1.2rem] tabular" aria-live="polite">{portions}</span>
              <button type="button" onClick={() => setPortions((p) => Math.min(20, p + 1))}
                aria-label="Más porciones" className="w-12 h-12 text-2xl font-black text-basil active:scale-90 transition-transform">+</button>
            </div>
          </div>
        )}

        {/* Ingredientes */}
        <section className="mt-9" aria-labelledby="ing-title">
          <div className="flex items-center justify-between mb-4">
            <h2 id="ing-title" className="font-display font-black text-navy text-[1.7rem]">Ingredientes</h2>
            <span className="rounded-full bg-fresh-bg text-fresh px-3 py-1 label-micro text-fresh!">{total} items</span>
          </div>
          <ul className="space-y-2.5">
            {recipe.ingredients.map((ing, i) => {
              const on = !!haveIt[i];
              const meta = getIngredientMeta(ing.name);
              const needed = ing.usedInHaveUnit != null ? ing.usedInHaveUnit * scale : null;
              const short = ing.inInventory && needed != null && ing.have < needed;
              const inList = !ing.inInventory && listNames.has(foldAccents(ing.name).trim());
              return (
                <li key={i}>
                  <label className={`flex items-center gap-3 p-3 pr-3.5 rounded-[20px] cursor-pointer transition-all duration-300 active:scale-[0.98] ${
                    on ? 'bg-transparent' : 'bg-white shadow-sm'}`}>
                    <input type="checkbox" className="sr-only" checked={on}
                      onChange={() => setHaveIt((c) => ({ ...c, [i]: !c[i] }))} />
                    <span aria-hidden="true" className={`w-7 h-7 shrink-0 rounded-full border-2 flex items-center justify-center text-white transition-colors ${
                      on ? 'bg-basil border-basil' : 'border-gray-300 bg-white'}`}>
                      {on && <IconCheck className="w-4 h-4 check-pop" />}
                    </span>
                    <span className="w-10 h-10 shrink-0 rounded-[12px] flex items-center justify-center text-[1.35rem]" style={{ background: meta.bg }} aria-hidden="true">
                      {meta.emoji}
                    </span>
                    <span className={`flex-1 min-w-0 transition-opacity ${on ? 'opacity-50' : ''}`}>
                      <span className={`block font-bold text-[1.03rem] first-letter:uppercase ${on ? 'line-through' : ''}`}>{ing.name}</span>
                      {!ing.inInventory && (
                        <span className={`block text-[0.72rem] font-black uppercase tracking-wider ${inList ? 'text-soft' : 'text-alert'}`}>
                          {inList ? 'En tu lista del súper' : 'Te falta'}
                        </span>
                      )}
                      {short && (
                        <span className="block text-[0.72rem] font-black uppercase tracking-wider text-amber">
                          Tienes poco: {formatAmount(ing.have)} {ing.haveUnit}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 rounded-full bg-fresh-bg text-fresh px-2.5 py-1 text-[0.85rem] font-black tabular">
                      {formatAmount(ing.amount * scale)} {ing.unit || 'pza'}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>

          {missing.length > 0 && (
            <button type="button" onClick={addMissingToList} disabled={missingNotInList.length === 0}
              className="mt-4 w-full min-h-14 rounded-full bg-white shadow-sm text-navy font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:shadow-none disabled:bg-transparent disabled:text-fresh">
              {missingNotInList.length === 0 ? (
                <><IconCheck className="w-5 h-5" /> Lo que falta ya está en tu lista</>
              ) : (
                <><IconCart className="w-5 h-5" /> Agregar lo que falta a mi lista ({missingNotInList.length})</>
              )}
            </button>
          )}
        </section>

        {/* Preparación con progreso */}
        <section className="mt-11" aria-labelledby="steps-title">
          <div className="flex items-end justify-between">
            <h2 id="steps-title" className="font-display font-black text-navy text-[1.7rem]">Preparación</h2>
            <span className="font-black text-basil tabular" aria-live="polite">{progress}%</span>
          </div>
          <div ref={barRef} className="mt-3 mb-6 h-2 rounded-full bg-hairline overflow-hidden" role="progressbar"
            aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="Avance de la receta">
            <div className="h-full rounded-full bg-basil transition-[width] duration-700 ease-out" style={{ width: `${progress}%` }} />
          </div>

          {stepCount > 0 ? (
            <ol className="space-y-3">
              {recipe.steps.map((text, index) => {
                const isDone = !!done[index];
                const isCurrent = index === currentStep;
                const seconds = isDone ? null : findTimerSeconds(text);
                return (
                  <li key={index} className={`rounded-[24px] border-2 transition-all duration-300 ${
                    isDone ? 'bg-transparent border-transparent'
                      : isCurrent ? 'bg-white border-basil shadow-[0_10px_24px_-12px_rgb(45_122_71/0.45)]'
                        : 'bg-white border-transparent shadow-sm'}`}>
                    <button type="button" onClick={() => toggleStep(index)} aria-pressed={isDone}
                      className="w-full text-left flex gap-4 p-4 active:scale-[0.98] transition-transform">
                      <span aria-hidden="true" className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center font-black tabular transition-colors ${
                        isDone ? 'bg-basil/80 text-white' : isCurrent ? 'bg-basil text-white' : 'bg-fresh-bg text-fresh'}`}>
                        {isDone ? <IconCheck className={`w-5 h-5 ${justDone === index ? 'check-pop' : ''}`} /> : index + 1}
                      </span>
                      <span className="flex-1 min-w-0">
                        {isCurrent && !isDone && <span className="block label-micro text-basil! mb-1">Paso actual</span>}
                        <span className={`block text-[1.06rem] leading-relaxed transition-all duration-300 ${
                          isDone ? 'line-through text-soft/70' : 'text-navy'}`}>
                          {text}
                        </span>
                      </span>
                    </button>
                    {!isDone && (
                      <div className="flex flex-wrap gap-2 px-4 pb-4 pl-[4.25rem] -mt-1">
                        <button type="button" onClick={() => readStep(index)} aria-pressed={speaking === index}
                          className={`min-h-11 px-3.5 rounded-full text-[0.92rem] font-bold inline-flex items-center gap-1.5 active:scale-95 transition-transform ${
                            speaking === index ? 'bg-basil text-white' : 'bg-cream text-navy'}`}>
                          <IconSpeaker className="w-5 h-5" /> {speaking === index ? 'Detener' : 'Leer'}
                        </button>
                        {seconds && (
                          <button type="button" onClick={() => startTimer(seconds, index)}
                            className="min-h-11 px-3.5 rounded-full bg-cream text-navy text-[0.92rem] font-bold inline-flex items-center gap-1.5 active:scale-95 transition-transform">
                            <IconTimer className="w-5 h-5" /> {formatClock(seconds)}
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="text-soft font-bold bg-white p-6 rounded-[24px] shadow-sm">Instrucciones no disponibles.</p>
          )}

          {finished && (
            <div className="relative mt-6 bg-basil text-white rounded-[32px] p-6 text-center overflow-hidden animate-fade-in-up" role="status">
              <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                {['🎉', '🌮', '✨', '🥑', '🎉', '🌶️'].map((e, i) => (
                  <span key={i} className="float-up absolute bottom-2 text-3xl"
                    style={{ left: `${10 + i * 15}%`, animationDelay: `${i * 0.18}s` }}>{e}</span>
                ))}
              </div>
              <p className="font-display font-black text-[1.8rem] leading-tight">¡Buen provecho!</p>
              <p className="mt-1 text-white/90">Terminaste todos los pasos.</p>
            </div>
          )}

          {/* Ya la cociné: descuenta de la alacena lo que se usó */}
          <div className="mt-6">
            {cookedDone ? (
              <div className="bg-fresh-bg text-fresh rounded-[24px] p-5 text-center animate-fade-in-up" role="status">
                <p className="font-black text-[1.1rem]">¡Listo! Actualizamos tu alacena.</p>
                <button type="button" onClick={() => navigate('/dashboard')}
                  className="mt-3 min-h-12 px-5 rounded-full bg-white text-navy font-bold shadow-sm active:scale-95 transition-transform">
                  Ver mi alacena
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setCookedOpen(true)}
                className={`w-full min-h-14 rounded-full font-bold text-[1.06rem] flex items-center justify-center gap-2 active:scale-95 transition-transform ${
                  finished ? 'bg-navy text-white shadow-[0_10px_24px_-10px_rgb(11_30_54/0.5)]' : 'bg-white text-navy shadow-sm'}`}>
                <span aria-hidden="true">🍽️</span> Ya la cociné
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default RecipeDetail;
