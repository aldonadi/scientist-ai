const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

const { notFoundHandler } = require('./middleware/errorHandler');

// Route Imports
const toolRoutes = require('./routes/tool.routes');
const planRoutes = require('./routes/plan.routes');
const experimentRoutes = require('./routes/experiment.routes');

// Routes
app.use('/api/tools', toolRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/experiments', experimentRoutes);
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date(),
        service: 'scientist-ai-backend'
    });
});

app.use(notFoundHandler);

module.exports = app;
