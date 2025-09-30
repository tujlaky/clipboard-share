// Connect to the server using Socket.io
const socket = io();

// DOM elements
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const fileInput = document.getElementById('file-input');
const uploadButton = document.getElementById('upload-button');
const fileLabel = document.getElementById('file-label');
const fileName = document.getElementById('file-name');
const uploadProgress = document.getElementById('upload-progress');
const progressBar = document.getElementById('progress-bar');
const progressPercent = document.getElementById('progress-percent');
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

// File input change handler
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    fileName.textContent = file.name;
    fileName.classList.remove('hidden');
    fileLabel.classList.add('hidden');
    uploadButton.disabled = false;
  } else {
    fileName.classList.add('hidden');
    fileLabel.classList.remove('hidden');
    uploadButton.disabled = true;
  }
});

// Upload file function
async function uploadFile() {
  const file = fileInput.files[0];
  if (!file) return;
  
  uploadButton.disabled = true;
  uploadProgress.classList.remove('hidden');
  
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const xhr = new XMLHttpRequest();
    
    // Progress tracking
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        progressBar.style.width = percentComplete + '%';
        progressPercent.textContent = Math.round(percentComplete) + '%';
      }
    });
    
    // Handle completion
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const fileInfo = JSON.parse(xhr.responseText);
        
        const message = {
          type: 'file',
          file: fileInfo,
          timestamp: new Date().toISOString()
        };
        
        // Send to server via socket
        socket.emit('new-message', message);
        
        // Reset UI
        fileInput.value = '';
        fileName.classList.add('hidden');
        fileLabel.classList.remove('hidden');
        uploadButton.disabled = true;
        uploadProgress.classList.add('hidden');
        progressBar.style.width = '0%';
        progressPercent.textContent = '0%';
      } else {
        alert('Upload failed. Please try again.');
      }
    });
    
    xhr.addEventListener('error', () => {
      alert('Upload failed. Please try again.');
      uploadButton.disabled = false;
      uploadProgress.classList.add('hidden');
      progressBar.style.width = '0%';
    });
    
    xhr.open('POST', '/upload');
    xhr.send(formData);
    
  } catch (error) {
    console.error('Upload error:', error);
    alert('Upload failed. Please try again.');
    uploadButton.disabled = false;
    uploadProgress.classList.add('hidden');
  }
}

// Send text message function
function sendMessage() {
  const text = messageInput.value.trim();
  if (text) {
    const message = {
      type: 'text',
      text,
      timestamp: new Date().toISOString()
    };
    
    // Send to server
    socket.emit('new-message', message);
    
    // Clear input
    messageInput.value = '';
    messageInput.focus();
  }
}

// Function to add a message to the UI
function addMessageToUI(message) {
  // Create message card element
  const messageCard = document.createElement('div');
  messageCard.className = 'bg-white rounded-lg shadow p-4 relative animate-fade-in';
  
  if (message.type === 'file') {
    // File message
    const fileInfo = message.file;
    const fileSize = formatFileSize(fileInfo.size);
    const isImage = fileInfo.mimetype.startsWith('image/');
    
    // File icon and name
    const fileHeader = document.createElement('div');
    fileHeader.className = 'mb-3 flex items-center';
    
    const fileIcon = document.createElement('div');
    fileIcon.className = 'flex-shrink-0 w-12 h-12 bg-blue-100 rounded flex items-center justify-center mr-3';
    fileIcon.innerHTML = isImage ? 
      '<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>' :
      '<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>';
    
    const fileDetails = document.createElement('div');
    fileDetails.className = 'flex-1 min-w-0';
    
    const fileNameEl = document.createElement('div');
    fileNameEl.className = 'font-medium text-gray-800 truncate';
    fileNameEl.textContent = fileInfo.originalName;
    
    const fileSizeEl = document.createElement('div');
    fileSizeEl.className = 'text-sm text-gray-500';
    fileSizeEl.textContent = fileSize;
    
    fileDetails.appendChild(fileNameEl);
    fileDetails.appendChild(fileSizeEl);
    fileHeader.appendChild(fileIcon);
    fileHeader.appendChild(fileDetails);
    messageCard.appendChild(fileHeader);
    
    // Image preview
    if (isImage) {
      const imgPreview = document.createElement('img');
      imgPreview.src = fileInfo.path;
      imgPreview.className = 'max-w-full h-auto rounded mb-3 cursor-pointer';
      imgPreview.style.maxHeight = '300px';
      imgPreview.addEventListener('click', () => {
        window.open(fileInfo.path, '_blank');
      });
      messageCard.appendChild(imgPreview);
    }
    
    // Download button
    const downloadBtn = document.createElement('a');
    downloadBtn.href = fileInfo.path;
    downloadBtn.download = fileInfo.originalName;
    downloadBtn.className = 'inline-block bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-4 rounded transition-colors duration-300';
    downloadBtn.textContent = 'Download';
    messageCard.appendChild(downloadBtn);
    
  } else {
    // Text message
    const messageText = document.createElement('div');
    messageText.className = 'mb-3 whitespace-pre-wrap break-words';
    messageText.textContent = message.text;
    messageCard.appendChild(messageText);
    
    // Add copy button for text
    const copyButton = document.createElement('button');
    copyButton.className = 'absolute top-2 right-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs py-1 px-3 rounded transition-colors duration-300';
    copyButton.textContent = 'Copy';
    copyButton.addEventListener('click', () => {
      navigator.clipboard.writeText(message.text)
        .then(() => {
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
  }
  
  // Add metadata (timestamp)
  const messageMeta = document.createElement('div');
  messageMeta.className = 'text-xs text-gray-500 border-t border-gray-100 pt-2 mt-3';
  
  const timestamp = new Date(message.timestamp);
  const formattedTime = timestamp.toLocaleTimeString() + ' ' + timestamp.toLocaleDateString();
  
  messageMeta.textContent = formattedTime;
  messageCard.appendChild(messageMeta);
  
  // Add to container (at the beginning to show newest first)
  messageContainer.insertBefore(messageCard, messageContainer.firstChild);
}

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Event listeners
sendButton.addEventListener('click', sendMessage);
uploadButton.addEventListener('click', uploadFile);

messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});
