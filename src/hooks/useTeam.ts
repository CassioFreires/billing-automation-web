import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import teamService from "../services/team.service";
import type { InviteMemberInput } from "../services/team.service";

const KEY = ["team"];

export function useTeam() {
  return useQuery({ queryKey: KEY, queryFn: () => teamService.list() });
}

export function useInviteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: InviteMemberInput) => teamService.invite(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useChangeRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: "ADMIN" | "MEMBER" }) =>
      teamService.changeRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => teamService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
