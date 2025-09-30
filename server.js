const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { exec } = require('child_process');
const multer = require('multer');
const fs = require('fs');

// Initialize express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  maxHttpBufferSize: 50 * 1024 * 1024 // 50MB max file size
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Build Tailwind CSS
if (process.env.NODE_ENV !== 'production') {
  console.log('Building Tailwind CSS...');
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

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// Serve main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle file upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const fileInfo = {
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
    path: `/uploads/${req.file.filename}`
  };
  
  res.json(fileInfo);
});

// Store messages in memory (will be lost on server restart)
const messages = [];

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Send existing messages to newly connected client
  socket.emit('initial-messages', messages);
  
  // Handle new message from client (text or file)
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
