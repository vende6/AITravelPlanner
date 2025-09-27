#!/usr/bin/env node

/**
 * Development script to run both frontend and backend servers concurrently
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Travel Planner MCP development servers...');

// Start backend server
const backendProcess = spawn('nodemon', ['startup.js'], {
  stdio: 'inherit',
  shell: true
});

console.log('📡 Backend server started');

// Start frontend development server
const frontendProcess = spawn('npm', ['start'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'inherit',
  shell: true
});

console.log('🖥️  Frontend development server started');

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Terminating servers...');
  backendProcess.kill('SIGINT');
  frontendProcess.kill('SIGINT');
  process.exit(0);
});

// Handle backend process exit
backendProcess.on('close', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`❌ Backend server exited with code ${code}`);
  }
  frontendProcess.kill('SIGINT');
  process.exit(code);
});

// Handle frontend process exit
frontendProcess.on('close', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`❌ Frontend server exited with code ${code}`);
  }
  backendProcess.kill('SIGINT');
  process.exit(code);
});

console.log('✅ Development environment running');
console.log('📊 Backend API available at: http://localhost:3000/api/travel');
console.log('🌐 Frontend available at: http://localhost:3001');
console.log('\n🛠️  Press Ctrl+C to stop both servers');