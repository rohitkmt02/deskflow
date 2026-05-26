require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const ticketRoutes = require('./routes/tickets');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/tickets', ticketRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'DeskFlow API is running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  if (process.env.MONGODB_URI) {
    mongoose
      .connect(process.env.MONGODB_URI)
      .then(() => console.log('Connected to MongoDB'))
      .catch((err) => {
        console.error('MongoDB connection error:', err.message);
        console.log('Continuing server execution in offline/fallback mode.');
      });
  } else {
    console.log('MONGODB_URI is not defined. Backend running in in-memory fallback mode.');
  }
});

