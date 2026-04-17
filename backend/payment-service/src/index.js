const app = require('./app');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3005;

app.listen(PORT, () => {
    logger.info(`Payment Service started on port ${PORT}`);
});
