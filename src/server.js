const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();
const port = 3001;

// Add trust proxy setting before other middleware
app.set('trust proxy', 1);

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

app.use('/api/v1', routes);

// Only start the server if this file is run directly
if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
}

module.exports = app;