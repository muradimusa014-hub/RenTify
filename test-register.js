const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

const body = JSON.stringify({ email: 'test@example.com', password: 'password123', role: 'tenant' });

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => { console.log('Status:', res.statusCode); console.log('Body:', data); });
});

req.on('error', (e) => { console.error('Error:', e.message); });
req.write(body);
req.end();
