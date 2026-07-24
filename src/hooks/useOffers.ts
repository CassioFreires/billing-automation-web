import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import offersService, { type OfferType } from "../services/offers.service";

/** Loja no Pagamento (spec 0044, F15) — ofertas do dono + resumo. */
export function useOffers() {
  return useQuery({ queryKey: ["offers"], queryFn: () => offersService.list() });
}

export function useOfferSummary() {
  return useQuery({ queryKey: ["offers", "summary"], queryFn: () => offersService.summary() });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["offers"] });
}

export function useCreateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; priceCents: number; type?: OfferType; active?: boolean }) =>
      offersService.create(body),
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<{ name: string; priceCents: number; type: OfferType; active: boolean }> }) =>
      offersService.update(id, body),
    onSuccess: () => invalidate(qc),
  });
}

export function useDeleteOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => offersService.remove(id),
    onSuccess: () => invalidate(qc),
  });
}
