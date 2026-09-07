const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Attach Socket.IO for real-time optimization progress updates
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Connect Database & Start Server
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log('===========================================================');
    console.log(`[DRDO Passive Shelter Server] Running on http://localhost:${PORT}`);
    console.log(`[Socket.IO WebSocket] Real-time engine attached.`);
    console.log('===========================================================');
  });
});
