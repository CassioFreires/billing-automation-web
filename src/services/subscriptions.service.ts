import api from "./api";

export interface Subscription {
  id: string;
  description: string;
  amount: number;
  dayOfMonth: number;
  status: "ACTIVE" | "PAUSED" | "CANCELED";
  startDate: string;
  nextRunDate: string;
  createdAt?: string;
  clientId: string;
  client?: { id?: string; name?: string; phone?: string };
}

export interface SubscriptionInput {
  clientId: string;
  description: string;
  amount: number;
  dayOfMonth: number;
}

export interface SubscriptionUpdate {
  description?: string;
  amount?: number;
  dayOfMonth?: number;
  status?: "ACTIVE" | "PAUSED" | "CANCELED";
}

export interface RunResult {
  processadas: number;
  geradas: number;
  ignoradas: number;
}

class SubscriptionService {
  async findAll(): Promise<Subscription[]> {
    const response = await api.get("/subscriptions");
    return response.data;
  }

  async create(data: SubscriptionInput): Promise<Subscription> {
    const response = await api.post("/subscriptions", data);
    return response.data;
  }

  async update(id: string, data: SubscriptionUpdate): Promise<Subscription> {
    const response = await api.put(`/subscriptions/${id}`, data);
    return response.data;
  }

  async remove(id: string): Promise<void> {
    await api.delete(`/subscriptions/${id}`);
  }

  async run(): Promise<RunResult> {
    const response = await api.post("/subscriptions/run");
    return response.data;
  }
}

export default new SubscriptionService();
