const express = require('express');
const routes = require('./routes');

const app = express();
const port = 3000;

// Add v1 version prefix to API routes
app.use('/api/v1', routes);

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
}); 