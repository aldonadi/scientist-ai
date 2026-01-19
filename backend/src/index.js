const mongoose = require('mongoose');
const app = require('./app');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    });

// Start Server
if (require.main === module) {
    const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });

    // Graceful Shutdown
    const gracefulShutdown = async (signal) => {
        console.log(`${signal} received. Shutting down gracefully...`);
        server.close(async () => {
            console.log('HTTP server closed.');

            // Cleanup Container Pool
            try {
                const ContainerPoolManager = require('./services/container-pool.service');
                await ContainerPoolManager.getInstance().shutdown();
                console.log('Container Pool cleaned up.');
            } catch (err) {
                console.error('Error cleaning up Container Pool:', err);
            }

            // Close Database Connection
            try {
                await mongoose.connection.close();
                console.log('MongoDB connection closed.');
            } catch (err) {
                console.error('Error closing MongoDB connection:', err);
            }

            process.exit(0);
        });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

module.exports = app;

