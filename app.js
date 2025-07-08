require('dotenv').config();
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketio(server, { cors: { origin: '*' } });
const riderSockets = new Map();

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('registerRider', (riderId) => {
    console.log(`📡 Registered rider ${riderId} with socket ${socket.id}`);
    riderSockets.set(String(riderId), socket.id);
  });

  socket.on('disconnect', () => {
    for (const [riderId, socketId] of riderSockets.entries()) {
      if (socketId === socket.id) {
        riderSockets.delete(riderId);
        break;
      }
    }
  });
});


app.use(express.json());
app.use('/uploads', express.static('uploads'));

const ridesRouter = require('./routes/rides')(io, riderSockets);
const authRouter = require('./routes/auth');
const mapsRouter = require('./routes/maps');
const userDocumentsRouter = require('./routes/userDocuments');
const userRoutes = require('./routes/users');
const ratingsRouter = require('./routes/ratings');



app.use('/api/auth', authRouter);
app.use('/api/rides', ridesRouter);
app.use('/api/maps', mapsRouter);
app.use('/api/documents', userDocumentsRouter);
app.use('/api/user', userRoutes);
app.use('/earnings', require('./routes/earnings'));
app.use('/ratings', ratingsRouter);



const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
