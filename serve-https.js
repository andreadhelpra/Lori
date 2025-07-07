const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Simple HTTPS server for testing the PWA
const port = 3000;

// MIME types for different file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// Generate self-signed certificate if it doesn't exist
const certPath = path.join(__dirname, 'cert.pem');
const keyPath = path.join(__dirname, 'key.pem');

function generateCertificate() {
    if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
        console.log('🔐 Generating self-signed certificate...');
        try {
            // Generate private key and certificate
            execSync(`openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"`, { stdio: 'inherit' });
            console.log('✅ Certificate generated successfully!');
        } catch (error) {
            console.log('⚠️  Could not generate certificate with OpenSSL, using fallback...');
            // Fallback: create simple certificate files
            createFallbackCertificate();
        }
    }
}

function createFallbackCertificate() {
    // Create a simple certificate for testing
    const key = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7VJTUt9Us8cKB
wF7vJzKDFVpMjQqYKKJYxNjGqZ0m5SRpGzTON+DkANn2nMhpjrO2hTJRUGQOlQqQ
oUm4KrNOvNMfOLQqONdMBPdLDjWLfLJMUOYzBkqCqMWI3OBYtCTiKCjRxoE8K7Q6
vVm4zNZ5TfJP2gQGVgMXhQmLjHjJQjm7oSXfLUTh6e2KfVMBSjjSGFiVQHzZGIzh
mNFjvgpxFqCHgKjN+WzJ6qYFIqRXFiFU0WmVT0EFWtN2YjGhJhQV7XfBfYXnxOWD
rF+WsVEF1FkPxRMhm1cFXhGBOGPSLfqMGJ8kPNGMQ4J2pXhj8nIBUJwZnIxjFLAP
TIkJpDyNAgMBAAECggEBAFjWk9Y+3V83wabwHLk0XuhdaF6oVpACLxma0IWQSTzEk
r0CAU30d73aUWDLM6qCI0SxZ0UhHB9H0o1LkBbIwamKiXyXEErxrzdQA5wCWGiaN
qimUhy8VgYF75szjYEShh3xnRjHSdqmMjq/agSwlak3VhVRuoYAjWhX1BoS7gX5q
k5ih62SmlC1FVzOsFYzDgA4YGai8+iXZxfJNnhjz+sL1m0ixWu6l8RazWiQyVUoR
vhl4GjRqS7yeL+iMzCblb0KpyKlqgs2ihTTQaRphmiqQ8xak30HVCrTZr0Zt70JJ
e8Dhi71y4wBJAqmiVxhRCTuoMwDFRgUM5vSSYAUHxEKBgQDmxSvSBdcaLEqrOGXW
LO0vRqGT7pG3+sGf1GGhGbvZSZLwjdSAH7k2NjgCJGsJBMrT2gRmKOEIGGfvOJcG
VNB9kOGcFWJGYOGXwTZvjTvIKLJWZKgvwGLVYZ7LcmOKGHGnJjVMXcCDGq3J+L8K
qnC3KjzEEYEIWzJ3D1RNRLNv1QKBgQDMmTXQJmO4AKs2+rLrQGpSH1AzfEFmHqg9
0kXQf0pFjY7fqHmcFGjvKLkGzm3fVSjKzKOXOsNaKJhvn5iXVhcUvJ2NzJWBSZNK
hfGNJrOuP2kRTmMqOKfpwGe5gIFpWeLWEZAVH6qKYJJWOdlNhgVLDzKF8RvDjqxj
SfJnzNkV4QKBgD4FP4S8xgpL5qUzMzrNEGHw5y4VKdZzHQqRYxBPgKJ1sKFGIhqD
1kJNdwWWrNDqD9gYE9MkgdLmqrPIYBDPUZWWlW7pLMh6lP0oZYSaLdtKPYEqL4mQ
1J3vQgXoJQGnKXqFf3fJ4vJvHYVOlPgj4T6VWBfTgPEn6VX5gVBfKhXtAoGBAKXr
yEYMHgLLVRcqOxdRLdVaJTpjSAiGlsQcaOKjPfUTSKvJF6yGhPGEJyMm7vx4BmOK
kXnhcQYHoGlqoI8HyJ4TbVPZoYhA5yGMuMaJhFNpqMqKkHpQvXoLPZaLnJQeYhFN
TnOFABNMqfHOXHHfV8uJdBvXkrOmXPdNdpOCXyKhAoGAYsqgz2UjnWXTMq1WbEpN
I6rjRXfCdj4QqKqbL5GQwXWOjmgdSWFrU2oQs3vYSJLbqaFvVdKUgHhAqgVgmVrp
FlsKgfpnPQEW0QyPdJUo4+SRLqTBNwTEzf6EEQiOGhLUVDdSATdqSgkwIYJzuAKg
bTBKfFMYKJHvBfRLhfAHCVQ=
-----END PRIVATE KEY-----`;

    const cert = `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAJC1+jEEt5dLMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX
aWRnaXRzIFB0eSBMdGQwHhcNMjQwMTAxMDAwMDAwWhcNMjUwMTAxMDAwMDAwWjBF
MQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50
ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAQEAu1SU1L7VLPHCgcBe7ycygxVaTI0KmCiiWMTYxqmdJuUkaRs0zjfg5ADZ
9pzIaY6ztoUyUVBkDpUKkKFJuCqzTrzTHzi0KjjXTAT3Sw41i3yyTFDmMwZKgqjF
iNzgWLQk4igo0caBPCu0Or1ZuMzWeU3yT9oEBlYDF4UJi4x4yUI5u6El3y1E4ent
in1TAUo40hhYlUB82RiM4ZjRY74KcRagh4CozflsyeqmBSKkVxYhVNFplU9BBVrT
dmIxoSYUFe13wX2F58Tlg6xflrFRBdRZD8UTIZtXBV4RgThj0i36jBifJDzRjEOC
dqV4Y/JyAVCcGZyMYxSwD0yJCaQ8jQIDAQABo1AwTjAdBgNVHQ4EFgQUkFpGUKhQ
XCrVDGqAzuoHRFzLjYswHwYDVR0jBBgwFoAUkFpGUKhQXCrVDGqAzuoHRFzLjYsw
DAYDVR0TBAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEABRvN9iMqKZkp8tPx7Goo
wKJRqwOlMqKhP2lGVYZOWpEqjGwYoZMZhDz/mEPXEHCQ2wf2rIQXBzGrPHoZlZl2
4wZO6KtMTcCXzPNGXVPqEcIGw5+5nPTXKBSGCNowlLsK1hVlFeCFaMEP7PBZ8KvQ
LmPnvZdnFMOPvhO8diFJPJiDjlO1HMdg5qIFJQJJEJjYSCK6hJfGJGUWaWsTUEpO
bFhO7MjbdvuqhGCTCjNjhsGmAIVlWvYEEeVfzALQPpKgvqXXxk4j2yMwNaGPZZ0c
SHWKjCPcVxQ9yEAyXrNaKhJKQ9sJqmKfGKF6z9qfNLgGLLjOJhSGvFqKmJWxFZrY
BQ==
-----END CERTIFICATE-----`;

    fs.writeFileSync(keyPath, key);
    fs.writeFileSync(certPath, cert);
}

// Generate certificate before starting server
generateCertificate();

// Server options
const serverOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
};

const server = https.createServer(serverOptions, (req, res) => {
    let filePath = req.url === '/' ? '/index.html' : req.url;
    
    // Remove query parameters
    filePath = filePath.split('?')[0];
    
    // Construct full path
    const fullPath = path.join(__dirname, filePath);
    
    // Get file extension
    const ext = path.extname(fullPath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    fs.readFile(fullPath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end('<h1>500 Internal Server Error</h1>');
            }
        } else {
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Cache-Control': 'no-cache'
            });
            res.end(data);
        }
    });
});

server.listen(port, () => {
    console.log(`🎵 Lori Music App running on https://localhost:${port}`);
    console.log('📱 You can now test voice recognition with HTTPS!');
    console.log('⚠️  You may need to accept the self-signed certificate warning.');
    console.log('🔐 Certificate files created: cert.pem, key.pem');
});

// Handle errors
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} is already in use. Try a different port.`);
    } else {
        console.error('Server error:', err);
    }
});

// Clean up certificate files on exit
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    if (fs.existsSync(certPath)) fs.unlinkSync(certPath);
    if (fs.existsSync(keyPath)) fs.unlinkSync(keyPath);
    process.exit(0);
}); 