require('dotenv').config();
const express = require('express');
const http = require('http');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server, { cors: { origin: '*' } });

app.use(express.json());

// Routes
const ridesRouter = require('./routes/rides')(io);
const authRouter = require('./routes/auth');
const mapsRouter = require('./routes/maps');  // <-- new import

app.use('/api/auth', authRouter);
app.use('/api/rides', ridesRouter);
app.use('/api/maps', mapsRouter);            // <-- mount here

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
