// Connect to the server using Socket.io
const socket = io();

// DOM elements
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const messageContainer = document.getElementById('message-container');
const connectionStatus = document.getElementById('connection-status');

// Connect and update status
socket.on('connect', () => {
  connectionStatus.textContent = 'Connected';
  connectionStatus.className = 'text-green-600';
});

socket.on('disconnect', () => {
  connectionStatus.textContent = 'Disconnected';
  connectionStatus.className = 'text-red-600';
});

// Handle initial messages from the server
socket.on('initial-messages', (messages) => {
  messages.forEach(message => {
    addMessageToUI(message);
  });
});

// Handle new messages from the server
socket.on('message-received', (message) => {
  addMessageToUI(message);
});

// Send message function
function sendMessage() {
  const text = messageInput.value.trim();
  if (text) {
    const message = {
      text,
      timestamp: new Date().toISOString()
    };
    
    // Send to server
    socket.emit('new-message', message);
    
    // Clear input
    messageInput.value = '';
    messageInput.focus();
  }
}// Function to add a message to the UI
function addMessageToUI(message) {
  // Create message card element
  const messageCard = document.createElement('div');
  messageCard.className = 'bg-white rounded-lg shadow p-4 relative animate-fade-in';
  
  // Add message text
  const messageText = document.createElement('div');
  messageText.className = 'mb-3 whitespace-pre-wrap break-words';
  messageText.textContent = message.text;
  messageCard.appendChild(messageText);
  
  // Add metadata (timestamp)
  const messageMeta = document.createElement('div');
  messageMeta.className = 'text-xs text-gray-500 border-t border-gray-100 pt-2 flex justify-between';
  
  const timestamp = new Date(message.timestamp);
  const formattedTime = timestamp.toLocaleTimeString() + ' ' + timestamp.toLocaleDateString();
  
  messageMeta.textContent = formattedTime;
  messageCard.appendChild(messageMeta);
  
  // Add copy button
  const copyButton = document.createElement('button');
  copyButton.className = 'absolute top-2 right-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs py-1 px-3 rounded transition-colors duration-300';
  copyButton.textContent = 'Copy';
  copyButton.addEventListener('click', () => {
    navigator.clipboard.writeText(message.text)
      .then(() => {
        // Visual feedback for successful copy
        const originalText = copyButton.textContent;
        copyButton.textContent = 'Copied!';
        copyButton.className = 'absolute top-2 right-2 bg-green-500 text-white text-xs py-1 px-3 rounded transition-colors duration-300';
        
        setTimeout(() => {
          copyButton.textContent = originalText;
          copyButton.className = 'absolute top-2 right-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs py-1 px-3 rounded transition-colors duration-300';
        }, 1500);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        copyButton.textContent = 'Failed!';
        copyButton.className = 'absolute top-2 right-2 bg-red-500 text-white text-xs py-1 px-3 rounded transition-colors duration-300';
      });
  });
  messageCard.appendChild(copyButton);
  
  // Add to container (at the beginning to show newest first)
  messageContainer.insertBefore(messageCard, messageContainer.firstChild);
}

// Event listeners
sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});