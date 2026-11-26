import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';

// Vida útil aproximada (días) para estimar la caducidad cuando el usuario no la captura
const SHELF_LIFE_BY_NAME = { huevo: 21, cebolla: 21, ajo: 30, papa: 30, jitomate: 10, pollo: 3, 'carne de res': 3 };
const SHELF_LIFE_BY_CATEGORY = { Verduras: 7, Frutas: 7, Proteínas: 3, Lácteos: 10, Granos: 180 };

const toIsoDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const estimateExpiration = (ingredient) => {
  const days = SHELF_LIFE_BY_NAME[ingredient?.nameEs?.toLowerCase()]
    ?? SHELF_LIFE_BY_CATEGORY[ingredient?.category]
    ?? 7;
  const target = new Date();
  target.setDate(target.getDate() + days);
  return toIsoDate(target);
};

function AddIngredient() {
  const navigate = useNavigate();
  const [ingredients, setIngredients] = useState([]);
  const [units, setUnits] = useState([]);
  const [formData, setFormData] = useState({ idIngredient: '', quantity: '', idUnit: '', expirationDate: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [ing, uni] = await Promise.all([api.get('/ingredients'), api.get('/units')]);
        setIngredients(ing.data.data);
        setUnits(uni.data.data);
        setFormData((f) => ({
          ...f,
          idIngredient: String(ing.data.data[0]?.idIngredient ?? ''),
          idUnit: String(uni.data.data[0]?.idUnit ?? ''),
        }));
      } catch (err) {
        setError(getErrorMessage(err));
      }
    };
    loadCatalogs();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const idIngredient = parseInt(formData.idIngredient, 10);
      const selected = ingredients.find((i) => i.idIngredient === idIngredient);
      await api.post('/inventory', {
        idIngredient,
        quantity: parseFloat(formData.quantity),
        idUnit: parseInt(formData.idUnit, 10),
        expirationDate: formData.expirationDate || estimateExpiration(selected),
      });
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const fieldClass = 'w-full bg-white text-lg text-gray-900 px-5 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2D7A47]';

  return (
    <div className="w-full px-6 pt-safe-12 max-w-2xl mx-auto flex flex-col min-h-[85vh] animate-fade-in-up">
      <div className="mb-12 flex items-center gap-4">
        <button onClick={() => navigate(-1)} aria-label="Regresar"
          className="w-12 h-12 bg-white rounded-full flex items-center justify-center font-black shadow-sm active:scale-90 transition-transform">
          ←
        </button>
        <h1 className="text-4xl font-black text-gray-900 tracking-tighter" style={{ fontFamily: "Fraunces, serif" }}>
          Nuevo ingrediente
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 flex-1">
        <div>
          <label htmlFor="idIngredient" className="text-base font-bold text-gray-900 mb-3 block">Ingrediente</label>
          <select id="idIngredient" name="idIngredient" value={formData.idIngredient} onChange={handleChange} required
            disabled={ingredients.length === 0} className={`${fieldClass} cursor-pointer`}>
            {ingredients.length === 0 && <option value="">Cargando…</option>}
            {ingredients.map((i) => (
              <option key={i.idIngredient} value={i.idIngredient}>{i.nameEs}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="quantity" className="text-base font-bold text-gray-900 mb-3 block">Cantidad</label>
            <input id="quantity" type="number" inputMode="decimal" step="0.01" min="0.01" name="quantity"
              value={formData.quantity} onChange={handleChange} placeholder="Ej. 12" required
              className={`${fieldClass} placeholder-gray-400`} />
          </div>

          <div className="flex-1">
            <label htmlFor="idUnit" className="text-base font-bold text-gray-900 mb-3 block">Medida</label>
            <select id="idUnit" name="idUnit" value={formData.idUnit} onChange={handleChange} required
              disabled={units.length === 0} className={`${fieldClass} cursor-pointer`}>
              {units.map((u) => (
                <option key={u.idUnit} value={u.idUnit}>{u.name} ({u.symbol})</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="expirationDate" className="text-base font-bold text-gray-900 mb-3 block">Caducidad</label>
          <input id="expirationDate" type="date" name="expirationDate" value={formData.expirationDate} onChange={handleChange}
            min={toIsoDate(new Date())} className={fieldClass} />
          <p className="text-sm text-gray-500 mt-2">Déjalo en blanco para estimarla automáticamente.</p>
        </div>

        {error && (
          <p role="alert" className="text-sm font-bold text-[#991B1B] bg-[#FEE2E2] px-4 py-3 rounded-2xl">{error}</p>
        )}

        <div className="pt-4">
          <button type="submit" disabled={saving || ingredients.length === 0}
            className="w-full py-5 bg-[#2D7A47] text-white font-bold text-lg rounded-full active:scale-95 transition-transform disabled:opacity-60">
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddIngredient;
