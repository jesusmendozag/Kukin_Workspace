import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IconClock, IconServings, IconBack, IconCheck } from '../components/Icons';
import { Floating, PotLoader } from '../components/ui';
import api, { getErrorMessage } from '../services/api';
import { getIngredientMeta } from '../services/ingredients';

const formatAmount = (n) => Number(n).toLocaleString('es-MX', { maximumFractionDigits: 2 });

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
  const heroRef = useRef(null);
  const barRef = useRef(null);

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
    api.get(`/recipes/${id}`, { params: { source } })
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
            amount: ing.amount,
            unit: ing.unitSymbol,
            inInventory: ing.inUserInventory,
          })),
          steps: r.steps || [],
        });
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

  const total = recipe.ingredients.length;
  const have = recipe.ingredients.filter((i) => i.inInventory).length;
  const stepCount = recipe.steps.length;
  const doneCount = Object.values(done).filter(Boolean).length;
  const progress = stepCount ? Math.round((doneCount / stepCount) * 100) : 0;
  const finished = stepCount > 0 && doneCount === stepCount;
  const currentStep = recipe.steps.findIndex((_, i) => !done[i]);

  const toggleStep = (i) => {
    setDone((d) => ({ ...d, [i]: !d[i] }));
    setJustDone(done[i] ? null : i);
  };

  return (
    <div className="min-h-dvh pb-[calc(var(--safe-bottom)+3rem)]">
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
        <div className="mt-4 flex flex-wrap gap-2 font-bold text-[0.92rem]">
          {recipe.time && (
            <span className="inline-flex items-center gap-1.5 bg-white shadow-sm rounded-full px-3.5 py-2 tabular"><IconClock /> {recipe.time} min</span>
          )}
          {recipe.servings && (
            <span className="inline-flex items-center gap-1.5 bg-white shadow-sm rounded-full px-3.5 py-2 tabular"><IconServings /> {recipe.servings} porciones</span>
          )}
          {total > 0 && (
            <span className={`inline-flex items-center rounded-full px-3.5 py-2 tabular ${have === total ? 'bg-basil text-white' : 'bg-fresh-bg text-fresh'}`}>
              Tienes {have} de {total}
            </span>
          )}
        </div>

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
                      {!ing.inInventory && <span className="block text-[0.72rem] font-black uppercase tracking-wider text-alert">Te falta</span>}
                    </span>
                    <span className="shrink-0 rounded-full bg-fresh-bg text-fresh px-2.5 py-1 text-[0.85rem] font-black tabular">
                      {formatAmount(ing.amount)} {ing.unit || 'pza'}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
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
                return (
                  <li key={index}>
                    <button type="button" onClick={() => toggleStep(index)} aria-pressed={isDone}
                      className={`w-full text-left flex gap-4 p-4 rounded-[24px] border-2 transition-all duration-300 active:scale-[0.98] ${
                        isDone ? 'bg-transparent border-transparent'
                          : isCurrent ? 'bg-white border-basil shadow-[0_10px_24px_-12px_rgb(45_122_71/0.45)]'
                            : 'bg-white border-transparent shadow-sm'}`}>
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
        </section>
      </div>
    </div>
  );
}

export default RecipeDetail;
