import { useEffect, useState } from 'react';
import clientesService from '../services/clientes.service';

export function useClients() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadClients() {
    try {
      setLoading(true);
      setError(null);

      const data = await clientesService.findAll();
      setClients(data);

    } catch (err) {
      setError('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  return {
    clients,
    loading,
    error
  };
}