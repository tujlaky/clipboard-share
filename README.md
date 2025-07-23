# Clipboard Share

A simple real-time collaborative clipboard application built with Node.js, Express, Socket.IO, and Tailwind CSS.

## Features

- Real-time text sharing across connected clients
- Copy button for easy clipboard access
- Modern UI with Tailwind CSS
- Responsive design
- No authentication required

## Installation

1. Navigate to the project directory:
   ```
   cd /app/clipboard-share
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Build Tailwind CSS:
   ```
   npx tailwindcss -i ./src/input.css -o ./public/styles.css
   ```

4. Start the server:
   ```
   npm start
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Development

To watch for CSS changes during development:
```
npm run build:css
```

## How to Use

1. Enter text in the input field
2. Press the "Send" button or hit Enter
3. The text appears as a card for all connected users
4. Use the "Copy" button to copy text to your clipboard

## Technical Details

- Server: Node.js with Express
- Real-time communication: Socket.IO
- Frontend: HTML, Tailwind CSS, and vanilla JavaScript
- No database (messages are stored in memory and lost on server restart)
