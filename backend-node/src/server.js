const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static storage for site photos
app.use('/storage', express.static('../storage'));

// API router integration
const apiRouter = require('./routes/api');
app.use('/api', apiRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Node.js Core API is running' });
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
