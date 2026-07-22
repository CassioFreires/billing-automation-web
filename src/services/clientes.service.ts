import api from "./api";

export interface Client {
  id: string;
  name: string;
  phone: string;
  document: string;
  email?: string | null; // canal de e-mail (spec 0032)
  status: string; // EM_DIA | EM_ATRASO
  debtValue?: number;
  createdAt?: string;
}

export interface ClientInput {
  name: string;
  phone: string;
  document: string;
  email?: string | null; // opcional; null limpa o e-mail (spec 0032)
}

export interface ImportClientRow {
  name: string;
  phone: string;
  document: string;
  email?: string;
  status?: "EM_DIA" | "EM_ATRASO";
}

export interface ImportResult {
  criados: number;
  atualizados: number;
  ignorados: number;
}

class ClientService {
  async findAll(): Promise<Client[]> {
    const response = await api.get("/clients");
    return response.data;
  }

  async findById(id: string): Promise<Client> {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  }

  async create(data: ClientInput): Promise<Client> {
    const response = await api.post("/clients", data);
    return response.data;
  }

  async import(clients: ImportClientRow[]): Promise<ImportResult> {
    const response = await api.post("/clients/import", { clients });
    return response.data;
  }

  async update(id: string, data: Partial<ClientInput>): Promise<Client> {
    const response = await api.put(`/clients/${id}`, data);
    return response.data;
  }

  async remove(id: string): Promise<void> {
    await api.delete(`/clients/${id}`);
  }
}

export default new ClientService();
