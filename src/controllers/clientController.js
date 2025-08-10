class ClientController {
  constructor(clientService) {
    this.clientService = clientService;
  }

  async createClient(req, res) {
    try {
      const clientData = req.body;
      const newClient = await this.clientService.createClient(clientData);
      res.status(201).json(newClient);
    } catch (error) {
      res.status(500).json({ message: "Error creating client", error });
    }
  }

  async getClients(req, res) {
    try {
      const clients = await this.clientService.getClients();
      res.status(200).json(clients);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving clients", error });
    }
  }

  async updateClient(req, res) {
    try {
      const clientId = req.params.id;
      const clientData = req.body;
      const updatedClient = await this.clientService.updateClient(clientId, clientData);
      res.status(200).json(updatedClient);
    } catch (error) {
      res.status(500).json({ message: "Error updating client", error });
    }
  }

  async deleteClient(req, res) {
    try {
      const clientId = req.params.id;
      await this.clientService.deleteClient(clientId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting client", error });
    }
  }
}

module.exports = ClientController;