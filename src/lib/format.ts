/** Formatação pt-BR reutilizável. */
export const formatBRL = (value: number): string =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

export const formatDate = (date?: string | null): string =>
  date ? new Date(date).toLocaleDateString("pt-BR") : "-";
