import axios from 'axios';

// Creamos la instancia de Axios
const api = axios.create({
  baseURL: '/api/v1', // Tu backend en Spring Boot
  headers: {
    'Content-Type': 'application/json',
    'Accept-Language': 'es'
  }
});

// Interceptor para inyectar el JWT en cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Interceptor de Respuestas: Para la prueba "Sesión Expirada" (S1, S2)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el backend devuelve un 401 y el código es TOKEN_EXPIRED
    if (error.response?.status === 401) {
      const errorCode = error.response.data?.code;
      
      if (errorCode === 'TOKEN_EXPIRED' || errorCode === 'INVALID_CREDENTIALS') {
        localStorage.removeItem('token'); // Borramos la sesión
        localStorage.removeItem('userPlan');
        // Redirigimos al usuario al login
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;