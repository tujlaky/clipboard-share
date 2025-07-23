const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { exec } = require('child_process');

// Initialize express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Build Tailwind CSS
if (process.env.NODE_ENV !== 'production') {
  console.log('Building Tailwind CSS...');
  // Only run this in development, not in production
  exec('npx tailwindcss -i ./src/input.css -o ./public/styles.css', (error, stdout, stderr) => {
    if (error) {
      console.error(`Tailwind build error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Tailwind stderr: ${stderr}`);
      return;
    }
    console.log(`Tailwind build stdout: ${stdout}`);
  });
}

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Store messages in memory (will be lost on server restart)
const messages = [];

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Send existing messages to newly connected client
  socket.emit('initial-messages', messages);
  
  // Handle new message from client
  socket.on('new-message', (message) => {
    console.log('New message received:', message);
    
    // Add message to the collection
    messages.push(message);
    
    // Broadcast to all clients
    io.emit('message-received', message);
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
