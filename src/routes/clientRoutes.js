// client-finder-bot-server/src/routes/clientRoutes.js
const express = require('express');
const ClientController = require('../controllers/clientController');

const router = express.Router();
const clientController = new ClientController();

// Route to create a new client
router.post('/', clientController.createClient.bind(clientController));

// Route to get all clients
router.get('/', clientController.getAllClients.bind(clientController));

// Route to get a client by ID
router.get('/:id', clientController.getClientById.bind(clientController));

// Route to update a client by ID
router.put('/:id', clientController.updateClient.bind(clientController));

// Route to delete a client by ID
router.delete('/:id', clientController.deleteClient.bind(clientController));

module.exports = router;