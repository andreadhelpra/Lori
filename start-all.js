const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Lori Music App with all services...\n');

// Start the music proxy server
const musicProxy = spawn('node', ['music-proxy.js'], {
    stdio: 'inherit',
    cwd: __dirname
});

// Start the main HTTPS server
const httpsServer = spawn('node', ['serve-https.js'], {
    stdio: 'inherit',
    cwd: __dirname
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down all services...');
    musicProxy.kill('SIGINT');
    httpsServer.kill('SIGINT');
    process.exit(0);
});

// Handle child process errors
musicProxy.on('error', (error) => {
    console.error('❌ Music proxy error:', error);
});

httpsServer.on('error', (error) => {
    console.error('❌ HTTPS server error:', error);
});

musicProxy.on('exit', (code) => {
    console.log(`🎵 Music proxy exited with code ${code}`);
});

httpsServer.on('exit', (code) => {
    console.log(`🌐 HTTPS server exited with code ${code}`);
});

console.log('🎵 Music proxy server starting on http://localhost:4000');
console.log('🌐 Main app server starting on https://localhost:3000');
console.log('📱 Open https://localhost:3000 in your browser to test the app');
console.log('⚠️  Make sure to accept the self-signed certificate warning');
console.log('\n💡 Press Ctrl+C to stop all services'); 