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
const themeToggle = document.getElementById('theme-toggle');
const sunIcon = document.getElementById('sun-icon');
const moonIcon = document.getElementById('moon-icon');

// Theme management
function updateThemeIcons() {
  const isDark = document.documentElement.classList.contains('dark');
  sunIcon.classList.toggle('hidden', !isDark);
  moonIcon.classList.toggle('hidden', isDark);
}

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('clipboard-share-theme', isDark ? 'dark' : 'light');
  updateThemeIcons();
}

// Initialize theme icons on load
updateThemeIcons();

// Theme toggle event listener
themeToggle.addEventListener('click', toggleTheme);

// Connect and update status
socket.on('connect', () => {
  connectionStatus.textContent = 'Connected';
  connectionStatus.className = 'text-green-600 dark:text-green-400';
});

socket.on('disconnect', () => {
  connectionStatus.textContent = 'Disconnected';
  connectionStatus.className = 'text-red-600 dark:text-red-400';
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

// Drag and drop functionality for the entire page
let dragCounter = 0;

// Prevent default drag behaviors
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  document.body.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

// Highlight drop area when dragging over
['dragenter', 'dragover'].forEach(eventName => {
  document.body.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
  document.body.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
  if (e.type === 'dragenter') {
    dragCounter++;
  }
  if (dragCounter > 0) {
    document.body.classList.add('drag-active');
  }
}

function unhighlight(e) {
  if (e.type === 'dragleave') {
    dragCounter--;
  } else if (e.type === 'drop') {
    dragCounter = 0;
  }
  if (dragCounter === 0) {
    document.body.classList.remove('drag-active');
  }
}

// Handle dropped files
document.body.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;
  
  if (files.length > 0) {
    const file = files[0]; // Take the first file if multiple
    
    // Update file input
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput.files = dataTransfer.files;
    
    // Update UI
    fileName.textContent = file.name;
    fileName.classList.remove('hidden');
    fileLabel.classList.add('hidden');
    uploadButton.disabled = false;
    
    // Auto-upload the file
    uploadFile();
  }
}

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
  messageCard.className = 'bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-4 relative animate-fade-in';
  
  if (message.type === 'file') {
    // File message
    const fileInfo = message.file;
    const fileSize = formatFileSize(fileInfo.size);
    const isImage = fileInfo.mimetype.startsWith('image/');
    
    // File icon and name
    const fileHeader = document.createElement('div');
    fileHeader.className = 'mb-3 flex items-center';
    
    const fileIcon = document.createElement('div');
    fileIcon.className = 'flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded flex items-center justify-center mr-3';
    fileIcon.innerHTML = isImage ?
      '<svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>' :
      '<svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>';
    
    const fileDetails = document.createElement('div');
    fileDetails.className = 'flex-1 min-w-0';
    
    const fileNameEl = document.createElement('div');
    fileNameEl.className = 'font-medium text-gray-800 dark:text-white truncate';
    fileNameEl.textContent = fileInfo.originalName;

    const fileSizeEl = document.createElement('div');
    fileSizeEl.className = 'text-sm text-gray-500 dark:text-gray-400';
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
    messageText.className = 'mb-3 whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200';
    messageText.textContent = message.text;
    messageCard.appendChild(messageText);

    // Add copy button for text
    const copyButton = document.createElement('button');
    copyButton.className = 'absolute top-2 right-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs py-1 px-3 rounded transition-colors duration-300';
    copyButton.textContent = 'Copy';
    copyButton.addEventListener('click', () => {
      copyToClipboard(message.text)
        .then(() => {
          const originalText = copyButton.textContent;
          copyButton.textContent = 'Copied!';
          copyButton.className = 'absolute top-2 right-2 bg-green-500 text-white text-xs py-1 px-3 rounded transition-colors duration-300';

          setTimeout(() => {
            copyButton.textContent = originalText;
            copyButton.className = 'absolute top-2 right-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs py-1 px-3 rounded transition-colors duration-300';
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
  messageMeta.className = 'text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-2 mt-3';
  
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

// Helper function to copy text to clipboard with mobile fallback
function copyToClipboard(text) {
  return new Promise((resolve, reject) => {
    // Always use fallback on mobile for reliability
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (!isMobile && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(resolve)
        .catch(() => fallbackCopyToClipboard(text).then(resolve).catch(reject));
    } else {
      fallbackCopyToClipboard(text).then(resolve).catch(reject);
    }
  });
}

function fallbackCopyToClipboard(text) {
  return new Promise((resolve, reject) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;

    // Make textarea visible but transparent (required for Android)
    textArea.style.position = 'fixed';
    textArea.style.top = '50%';
    textArea.style.left = '50%';
    textArea.style.transform = 'translate(-50%, -50%)';
    textArea.style.width = '1px';
    textArea.style.height = '1px';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.style.color = 'transparent';
    textArea.style.caretColor = 'transparent';
    textArea.style.resize = 'none';
    textArea.style.zIndex = '99999';
    textArea.setAttribute('readonly', '');
    textArea.setAttribute('contenteditable', 'true');

    document.body.appendChild(textArea);

    // Focus and select
    textArea.focus();
    textArea.select();

    // Additional selection for iOS/Android
    textArea.setSelectionRange(0, text.length);

    let successful = false;
    try {
      successful = document.execCommand('copy');
    } catch (err) {
      console.error('execCommand error:', err);
    }

    document.body.removeChild(textArea);

    if (successful) {
      resolve();
    } else {
      reject(new Error('Copy failed'));
    }
  });
}

// Event listeners
sendButton.addEventListener('click', sendMessage);
uploadButton.addEventListener('click', uploadFile);

messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});
