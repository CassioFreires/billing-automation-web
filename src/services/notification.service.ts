import api from "./api";

class NotificationService {
  /**
   * Enfileira a cobrança de UMA fatura pelo id.
   * Backend: POST /api/notifications/trigger-overdue/:invoiceId (exige JWT).
   */
  async triggerByInvoice(invoiceId: string) {
    const { data } = await api.post(`/notifications/trigger-overdue/${invoiceId}`);
    return data;
  }
}

export default new NotificationService();
