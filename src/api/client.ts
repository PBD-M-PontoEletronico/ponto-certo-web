import axios from 'axios';
import type { ApiError } from '../types';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Anexa o token JWT em toda requisição, se existir
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('meuponto:token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Se uma rota PROTEGIDA responder 401 (token expirado/inválido), desloga e
// manda pro login. A própria rota de login também pode responder 401 (senha
// errada) — nesse caso não queremos deslogar/redirecionar, só deixar o erro
// seguir pro catch() da tela de login, que já sabe mostrar a mensagem certa.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login');

    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('meuponto:token');
      localStorage.removeItem('meuponto:usuario');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Normaliza qualquer erro de resposta da API pro formato ApiError
export function extrairErro(error: unknown): ApiError {
  if (axios.isAxiosError(error) && error.response?.data) {
    return error.response.data as ApiError;
  }
  return {
    message: 'Não foi possível se comunicar com o servidor',
    status: 0,
    timestamp: new Date().toISOString(),
  };
}