import { useState, useCallback } from 'react';
import api from '../services/api';

export function useEndereco() {
  const [endereco, setEndereco] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Buscar endereço por CEP
  const buscarCep = useCallback(async (cep) => {
    try {
      setLoading(true);
      setError(null);
      
      // Remove caracteres não numéricos do CEP
      const cepLimpo = cep.replace(/\D/g, '');
      
      // Verifica se o CEP tem 8 dígitos
      if (cepLimpo.length !== 8) {
        throw new Error('CEP inválido');
      }

      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();

      if (data.erro) {
        throw new Error('CEP não encontrado');
      }

      setEndereco(data);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Salvar endereço do usuário
  const salvarEndereco = useCallback(async (dadosEndereco) => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Integrar com sua API
      await api.post(endpoints.user.address, dadosEndereco);
      
      setEndereco(dadosEndereco);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    endereco,
    loading,
    error,
    buscarCep,
    salvarEndereco
  };
}