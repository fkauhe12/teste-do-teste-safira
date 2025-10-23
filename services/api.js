import axios from 'axios';

// Configuração base do axios
const api = axios.create({
  baseURL: 'https://sua-api-base-url.com', // TODO: Substituir com URL base da sua API
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  async (config) => {
    // TODO: Adicionar lógica para incluir token de autenticação
    // const token = await AsyncStorage.getItem('@AuthData:token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Exemplos de endpoints
export const endpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
  },
  user: {
    profile: '/user/profile',
    address: '/user/address',
  },
  products: {
    list: '/products',
    details: (id) => `/products/${id}`,
  },
};

export default api;