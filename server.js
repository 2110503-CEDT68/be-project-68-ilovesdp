const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

dotenv.config({ path: './config/config.env' });

connectDB();

const app=express();

app.use(cookieParser());

app.use(express.json());

const dentists = require('./routes/dentists');
const auth = require('./routes/auth');
const appointments = require('./routes/appointments');

// Use extended query parsing so API filters like ?yearsOfExperience[gte]=5 become nested objects
// Must be set BEFORE routes so filters are parsed correctly when requests arrive.
app.set('query parser', 'extended');

app.use('/api/v1/dentists', dentists);
app.use('/api/v1/auth', auth);
app.use('/api/v1/appointments', appointments);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, console.log('Server running in ', process.env.NODE_ENV, ' mode on port ', PORT));

process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    server.close(() => process.exit(1));
});