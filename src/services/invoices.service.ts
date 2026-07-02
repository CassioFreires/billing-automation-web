import { isAxiosError } from 'axios';
import api from './api';

const EMPTY_PAGE = { invoices: [], meta: { totalItems: 0, totalPages: 1, currentPage: 1, limit: 10 } };

export class InvoiceService {
    async findAll(params: { page?: number; limit?: number; status?: string } = {}) {
        const response = await api.get('/invoices', { params });
        return response.data.result; // { invoices, meta }
    }

    async findPendingInvoices(page: number, limit: number) {
        try {
            const response = await api.get('/invoices/overdue', {
                params: { page, limit }
            });
            return response.data.result;
        } catch (err) {
            // O backend responde 404 quando NÃO há pendentes — isso é uma
            // lista vazia, não um erro. Tratamos como estado vazio.
            if (isAxiosError(err) && err.response?.status === 404) {
                return { ...EMPTY_PAGE, meta: { ...EMPTY_PAGE.meta, currentPage: page, limit } };
            }
            throw err;
        }
    }

    async findById(id: string) {
        const response = await api.get(`/invoices/${id}`);
        return response.data;
    }

    async create(clientData: any) {
        const response = await api.post('/invoices', clientData);
        return response.data;
    }

    async update(id: string, clientData: any) {
        const response = await api.put(`/invoices/${id}`, clientData);
        return response.data;
    }

    async delete(id: string) {
        const response = await api.delete(`/invoices/${id}`);
        return response.data;
    }
}
