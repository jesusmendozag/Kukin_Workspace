import axios from 'axios';
import { Capacitor } from '@capacitor/core';

/**
 * URL del backend.
 * - En el navegador se usa tal cual (VITE_API_URL).
 * - En el emulador de Android "localhost" es el propio emulador, no tu PC.
 *   Android expone la PC anfitriona en 10.0.2.2, así que "localhost" se reemplaza automáticamente.
 * - "127.0.0.1" NO se reemplaza: sirve para un celular físico conectado por USB con
 *   `adb reverse tcp:8080 tcp:8080`, que redirige el puerto del celular hacia la PC.
 */
const resolveBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
  if (Capacitor.getPlatform() === 'android') {
    return url.replace('://localhost', '://10.0.2.2');
  }
  return url;
};

export const TOKEN_KEY = 'token';

// El backend usa snake_case (id_inventory) y React usa camelCase (idInventory).
// Estas funciones convierten en ambos sentidos para que cada lado use su convención.
const toCamel = (s) => s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
const toSnake = (s) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

const convertKeys = (value, fn) => {
  if (Array.isArray(value)) return value.map((v) => convertKeys(v, fn));
  if (value && typeof value === 'object' && value.constructor === Object) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [fn(k), convertKeys(v, fn)]));
  }
  return value;
};

const api = axios.create({
  baseURL: resolveBaseUrl(),
  timeout: 15000,
});

// Antes de salir: agrega el token y convierte el cuerpo a snake_case
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data && typeof config.data === 'object') {
    config.data = convertKeys(config.data, toSnake);
  }
  return config;
});

// Al regresar: convierte a camelCase y, si la sesión expiró, regresa al login
api.interceptors.response.use(
  (response) => {
    response.data = convertKeys(response.data, toCamel);
    return response;
  },
  (error) => {
    if (error.response) {
      error.response.data = convertKeys(error.response.data, toCamel);
      const isAuthCall = error.config?.url?.startsWith('/auth/');
      if (error.response.status === 401 && !isAuthCall) {
        localStorage.removeItem(TOKEN_KEY);
        window.location.replace('/');
      }
    }
    return Promise.reject(error);
  }
);

/** Mensaje de error legible para mostrar en pantalla. */
export const getErrorMessage = (error) => {
  if (!error.response) {
    return 'No se pudo conectar con el servidor. Revisa que el backend esté encendido.';
  }
  const data = error.response.data || {};
  return data.details?.[0] || data.message || 'Ocurrió un error inesperado.';
};

export default api;
