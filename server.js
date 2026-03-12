const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { authMiddleware } = require('./middleware/auth');
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/products.routes');
const orderRoutes = require('./routes/orders.routes');
const { initAuthDb } = require('./services/auth.service');
const { errorLogger } = require('./middleware/error-logger');

const app = express();

initAuthDb();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/products', errorLogger, authMiddleware, productRoutes);
app.use('/api/orders', errorLogger, authMiddleware, orderRoutes);

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const message = err.message || 'Unexpected error';
  res.status(status).json({ message });
});

const port = process.env.GATEWAY_PORT || 4000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API Gateway listening on http://localhost:${port}`);
});
