const express = require('express');
const app = express();
require('dotenv').config();

// middleare
app.use(express.json());


const stockRoutes = require('./routes/stockRoutes');
app.use('/', stockRoutes);

module.exports = app;