const express = require('express');
const executeRoute = require('./routes/execute');

const app = express();
app.use(express.json());

// Mount execute endpoint
app.use('/activity/execute', executeRoute);

// REQUIRED dummy endpoints for Journey lifecycle
app.post('/activity/save', (req, res) => res.status(200).json({}));
app.post('/activity/publish', (req, res) => res.status(200).json({}));
app.post('/activity/validate', (req, res) => res.status(200).json({}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Custom Activity server running on ${PORT}`)
);
