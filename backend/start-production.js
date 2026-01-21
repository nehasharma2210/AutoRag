const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting AutoRAG Production Services...');

// Start LLM API in background
console.log('Starting LLM API...');
const llmProcess = spawn('python3', ['-m', 'uvicorn', 'self_healing_rag:app', '--host', '0.0.0.0', '--port', '8000'], {
  cwd: path.join(__dirname, '..', 'llm-api'),
  stdio: 'inherit'
});

llmProcess.on('error', (err) => {
  console.error('LLM API failed to start:', err);
});

// Wait a bit for LLM API to start
setTimeout(() => {
  console.log('Starting Backend Server...');
  // Start the main server
  require('./server.js');
}, 5000);

// Handle process termination
process.on('SIGTERM', () => {
  console.log('Shutting down services...');
  llmProcess.kill();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Shutting down services...');
  llmProcess.kill();
  process.exit(0);
});