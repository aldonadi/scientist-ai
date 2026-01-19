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
const providerRoutes = require('./routes/provider.routes');
const mongoose = require('mongoose');
const ContainerPoolManager = require('./services/container-pool.service');

// Routes
app.use('/api/tools', toolRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/experiments', experimentRoutes);
app.use('/api/providers', providerRoutes);
app.get('/api/health', (req, res) => {
    const containerPool = ContainerPoolManager.getInstance();
    const dbStatusMap = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
    };

    res.json({
        status: 'ok',
        timestamp: new Date(),
        uptime: process.uptime(),
        service: 'scientist-ai-backend',
        database: {
            status: dbStatusMap[mongoose.connection.readyState] || 'unknown',
            host: mongoose.connection.host,
            name: mongoose.connection.name
        },
        containers: {
            poolSize: containerPool.poolSize,
            available: containerPool.pool.length,
            active: containerPool.activeContainers.size,
            image: containerPool.image
        }
    });
});

app.use(notFoundHandler);

module.exports = app;
