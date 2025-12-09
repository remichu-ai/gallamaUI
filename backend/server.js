const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import the cors module
const conversationRoutes = require('./routes/conversations'); // Ensure this path is correct

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
const connectWithRetry = () => {
    console.log('MongoDB connection with retry');
    mongoose.connect('mongodb://127.0.0.1:27017/gallama', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
        .then(() => console.log('Connected to MongoDB'))
        .catch((err) => {
            console.error('Failed to connect to MongoDB', err);
            console.log('Retrying in 5 seconds...');
            setTimeout(connectWithRetry, 5000);
        });
};

connectWithRetry();

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cors()); // Use the CORS middleware
app.use('/api/conversations', conversationRoutes);

// Root route for testing
app.get('/', (req, res) => {
    res.send('API is working');
});

// Error handling middleware
app.use((req, res, next) => {
    res.status(404).json({ message: 'Not Found' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Server Error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
