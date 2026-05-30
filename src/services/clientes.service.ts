import api from './api';

class ClientService {
  async findAll() {
    const response = await api.get('/clients');
    console.log(response)
    return response.data;
  }

  async findById(id:number) {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  }

  async create(clientData:any) {
    const response = await api.post('/clients', clientData);
    return response.data;
  }

  async update(id:number, clientData:any) {
    const response = await api.put(`/clients/${id}`, clientData);
    return response.data;
  }

  async delete(id:number) {
    const response = await api.delete(`/clients/${id}`);
    return response.data;
  }
}

export default new ClientService();