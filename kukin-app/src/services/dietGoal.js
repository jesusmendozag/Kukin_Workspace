import api from './api';

/**
 * Objetivo de Dietas. Se guarda en la cuenta (backend) y una copia en el celular para leerlo al instante.
 * Cada objetivo define qué recetas le quedan, con los datos por porción que manda el backend.
 */
export const DIET_GOALS = {
  lose: { short: 'Bajar de peso', test: (r) => r.calories != null && r.calories <= 500 },
  muscle: { short: 'Más proteína', test: (r) => r.protein != null && r.protein >= 25 },
  heart: { short: 'Corazón sano', test: (r) => r.healthScore != null && r.healthScore >= 50 },
  rest: { short: 'Ligera', test: (r) => r.calories != null && r.calories <= 650 },
};

const KEY = 'kukin-diet-goal';

export const getDietGoal = () => {
  const g = localStorage.getItem(KEY);
  return DIET_GOALS[g] ? g : null;
};

/** Cambia el objetivo (null = ninguno). Se guarda primero en el celular y luego en la cuenta. */
export async function saveDietGoal(goal) {
  if (goal) localStorage.setItem(KEY, goal);
  else localStorage.removeItem(KEY);
  await api.put('/users/me/diet-goal', { goal });
}

/** Trae el objetivo guardado en la cuenta (por si se eligió en otro celular). */
export async function syncDietGoal() {
  try {
    const { data } = await api.get('/users/me');
    const goal = data.data?.dietGoal;
    if (goal) localStorage.setItem(KEY, goal);
    else localStorage.removeItem(KEY);
    return getDietGoal();
  } catch {
    return getDietGoal();
  }
}
