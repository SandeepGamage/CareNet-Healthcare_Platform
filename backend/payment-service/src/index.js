const app = require('./app');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5003;

app.listen(PORT, () => {
    logger.info(`Payment Service started on port ${PORT}`);
});
