import api from "./api";

export interface Me {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | string;
  tenantId: string;
}

class MeService {
  async get(): Promise<Me> {
    const { data } = await api.get("/auth/me");
    return data;
  }
}

export default new MeService();
