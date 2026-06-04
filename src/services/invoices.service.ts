import api from './api';

export class InvoiceService {
    async findAll() {
        const response = await api.get('/invoices');
        return response.data;
    }

    async findPendingInvoices(page: number, limit: number) {
        const response = await api.get('/invoices/overdue', {
            params: {
                page,
                limit
            }
        });
        return response.data.result;
    }

    async findById(id: number) {
        const response = await api.get(`/invoices/${id}`);
        return response.data;
    }

    async create(clientData: any) {
        const response = await api.post('/invoices', clientData);
        return response.data;
    }

    async update(id: number, clientData: any) {
        const response = await api.put(`/invoices/${id}`, clientData);
        return response.data;
    }

    async delete(id: number) {
        const response = await api.delete(`/invoices/${id}`);
        return response.data;
    }
}
