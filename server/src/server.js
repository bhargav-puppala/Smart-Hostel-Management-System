const app = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');
const logger = require('./shared/logger');

connectDB()
  .then(() => {
    app.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT} (${env.NODE_ENV})`);
    });
  })
  .catch((err) => {
    logger.error('Failed to start server:', err);
    process.exit(1);
  });
