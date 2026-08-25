const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use((req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Bangkok' });
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const user = req.headers['x-user-email'] || req.headers['x-user-name'] || 'Anonymous';
    console.log(`[${timestamp}] [HTTP] ${req.method} ${req.originalUrl || req.url} -> ${res.statusCode} (${duration}ms) [User: ${user}]`);
  });
  next();
});

// Serve static storage for site photos
app.use('/storage', express.static(path.join(__dirname, '../storage')));

// API router integration
const apiRouter = require('./routes/api');
app.use('/api', apiRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Node.js Core API is running' });
});

// Global Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  const timestamp = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Bangkok' });
  console.error(`[${timestamp}] [ERROR] Unhandled exception in ${req.method} ${req.originalUrl}:`, err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
