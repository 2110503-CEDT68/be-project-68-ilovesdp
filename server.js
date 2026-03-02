const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

dotenv.config({ path: './config/config.env' });

connectDB();

const app=express();

app.use(cookieParser());

app.use(express.json());

const hospitals = require('./routes/hospitals');
const auth = require('./routes/auth');
const appointments = require('./routes/appointments');

app.use('/api/v1/hospitals', hospitals);
app.use('/api/v1/auth', auth);
app.use('/api/v1/appointments', appointments);

// Use extended query parsing so API filters like province[lt]=ง become nested objects
// (e.g. { province: { lt: 'ง' } }) and can be converted to MongoDB operators.
// In Express 5, your query was being parsed as a flat key (province[lt]) instead of a nested object.
app.set('query parser', 'extended');

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, console.log('Server running in ', process.env.NODE_ENV, ' mode on port ', PORT));

process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    server.close(() => process.exit(1));
});