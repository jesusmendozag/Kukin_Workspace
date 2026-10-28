import axios from 'axios';

// Creamos la instancia central de Axios apuntando al puerto de tu Java
const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
});

// Interceptor: Un "guardia" que revisa cada petición antes de salir
// Si el usuario ya inició sesión y tiene un token, se lo pega automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;