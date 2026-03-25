const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// CORS origins allowed
const CORS_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  process.env.FRONTEND_URL
].filter(Boolean);

// Socket.IO setup
const io = new Server(server, {
  cors: { origin: CORS_ORIGINS, methods: ['GET','POST'] }
});

// Make `io` available to route handlers via app locals
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Student joins a personal room by regdNo so targeted events reach only them
  socket.on('join_student', (regdNo) => {
    if (regdNo) {
      socket.join(`student:${regdNo.toString().toUpperCase()}`);
      console.log(`[Socket] ${socket.id} joined room student:${regdNo}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// Middleware
app.use(cors({ origin: CORS_ORIGINS, credentials: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/student', require('./api/students'));
app.use('/api/auth', require('./api/auth'));
app.use('/api/admin', require('./api/admin'));
app.use('/api/simple', require('./api/simpleOTP'));
app.use('/api/advanced', require('./api/advancedAuth'));
app.use('/api/ai', require('./api/ai'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'OK', timestamp: new Date().toISOString(), version: '2.0.0-socket' });
});

// TwiML endpoint for voice calls
app.get('/twiml/otp/:otp', (req, res) => {
  const { otp } = req.params;
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">
    Hello. This is an automated call from Vignan University.
    Your one time password is.
    <Pause length="1"/>
    ${otp.split('').join(' <Pause length="0.5"/> ')}
    <Pause length="1"/>
    Your password is ${otp}.
    Please enter this password to complete your login.
    Thank you.
  </Say>
</Response>`;
  
  res.type('text/xml');
  res.send(twiml);
});

// Error handling
app.use((err, req, res, next) => {
  console.error('[Error]', err.stack);
  res.status(500).json({ success: false, error: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong!' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'API endpoint not found' });
});

let attemptPort = PORT;
const startServer = () => {
  server.listen(attemptPort, () => {
    console.log(`================================`);
    console.log(`🚀 Student Results API  (Socket.IO enabled)`);
    console.log(`📡 http://localhost:${attemptPort}`);
    console.log(`================================`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      attemptPort++;
      console.log(`Port ${attemptPort-1} in use, retrying on ${attemptPort}...`);
      setTimeout(startServer, 500);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
};
startServer();

// Export io for use from routes if needed via require
module.exports = { io };

