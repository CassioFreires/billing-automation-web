import { useQuery } from "@tanstack/react-query";
import meService from "../services/me.service";

/** Perfil do usuário logado (spec 0030) — usado para papel/permissões na UI. */
export function useMe() {
  return useQuery({ queryKey: ["me"], queryFn: () => meService.get(), staleTime: 5 * 60_000 });
}
