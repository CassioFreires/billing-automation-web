import { useQuery } from "@tanstack/react-query";
import cockpitService from "../services/cockpit.service";

/** Painel do Cockpit (GET /cockpit/overview). `days` = janela dos recebidos. */
export function useCockpit(days = 30) {
  return useQuery({
    queryKey: ["cockpit", days],
    queryFn: () => cockpitService.getOverview(days),
    placeholderData: (previous) => previous,
  });
}
