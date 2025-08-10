const express = require('express');
const mongoose = require('mongoose');
const { logger } = require('./config/logger');
const clientRoutes = require('./routes/clientRoutes');
const jobRoutes = require('./routes/jobRoutes');
const outreachRoutes = require('./routes/outreachRoutes');
const errorMiddleware = require('./middleware/error');
const authMiddleware = require('./middleware/auth');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(authMiddleware);

// Routes
app.use('/api/clients', clientRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/outreach', outreachRoutes);

// Error handling middleware
app.use(errorMiddleware);

// Database connection
mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  logger.info('Database connected successfully');
})
.catch((error) => {
  logger.error('Database connection failed:', error);
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});