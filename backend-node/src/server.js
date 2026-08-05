const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static storage for site photos
app.use('/storage', express.static(path.join(__dirname, '../storage')));

// API router integration
const apiRouter = require('./routes/api');
app.use('/api', apiRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Node.js Core API is running' });
});


if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
