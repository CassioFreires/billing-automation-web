import api from "./api";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | string;
  createdAt?: string;
}

export interface InviteMemberInput {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "MEMBER";
}

class TeamService {
  async list(): Promise<TeamMember[]> {
    const { data } = await api.get("/team");
    return data;
  }
  async invite(input: InviteMemberInput): Promise<TeamMember> {
    const { data } = await api.post("/team", input);
    return data;
  }
  async changeRole(id: string, role: "ADMIN" | "MEMBER"): Promise<TeamMember> {
    const { data } = await api.patch(`/team/${id}/role`, { role });
    return data;
  }
  async remove(id: string): Promise<void> {
    await api.delete(`/team/${id}`);
  }
}

export default new TeamService();
