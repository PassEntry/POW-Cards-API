const express = require('express');
const routes = require('./routes');

const app = express();
const port = 3000;

app.use('/api/v1', routes);

// Only start the server if this file is run directly
if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
}

module.exports = app; 