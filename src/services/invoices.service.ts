import api from "./api";

export interface Invoice {
  id: string;
  value: number;
  status: string; // PENDING | PAID | OVERDUE | FAILED
  dueDate: string;
  paidAt?: string | null;
  pixCopyPaste?: string | null;
  checkoutUrl?: string | null;
  gatewayId?: string | null;
  notificationSent?: boolean;
  createdAt?: string;
  clientId?: string;
  client?: { id?: string; name?: string; phone?: string; document?: string; status?: string };
}

export interface InvoiceInput {
  clientId: string;
  value: number;
  dueDate: string; // ISO (YYYY-MM-DD)
}

export interface InvoiceMeta {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export interface InvoicePage {
  invoices: Invoice[];
  meta: InvoiceMeta;
}

export class InvoiceService {
  async findAll(params: { page?: number; limit?: number; status?: string } = {}): Promise<InvoicePage> {
    const response = await api.get("/invoices", { params });
    return response.data.result;
  }

  async findById(id: string): Promise<Invoice> {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  }

  async create(data: InvoiceInput): Promise<Invoice> {
    const response = await api.post("/invoices", data);
    return response.data;
  }
}

export default new InvoiceService();
