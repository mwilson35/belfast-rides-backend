require('dotenv').config();
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketio(server, { cors: { origin: '*' } });

app.use(express.json());
app.use('/uploads', express.static('uploads'));

const ridesRouter = require('./routes/rides')(io);
const authRouter = require('./routes/auth');
const mapsRouter = require('./routes/maps');
const userDocumentsRouter = require('./routes/userDocuments');
const userRoutes = require('./routes/users');

app.use('/api/auth', authRouter);
app.use('/api/rides', ridesRouter);
app.use('/api/maps', mapsRouter);
app.use('/api/documents', userDocumentsRouter);
app.use('/api/user', userRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
