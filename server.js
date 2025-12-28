require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/vendors', require('./routes/vendors'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/procurement', require('./routes/procurement'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/print-usage', require('./routes/printUsage'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/exports', require('./routes/exports'));

// Root route - redirect to login
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Login at http://localhost:${PORT}/login.html`);
});
