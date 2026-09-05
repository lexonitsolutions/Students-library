import http from 'node:http';
import { handleCollegesSearchRequest } from './collegesHandler.js';

const PORT = process.env.PORT || 5001;

const server = http.createServer(async (req, res) => {
  // Enable CORS for local development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/api/colleges/search' && req.method === 'GET') {
    await handleCollegesSearchRequest(req, res);
    return;
  }

  if (url.pathname === '/api/health') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'ok', service: 'quicklearnit-backend' }));
    return;
  }

  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`QuickLearnit Backend Server running at http://localhost:${PORT}`);
  console.log(`Endpoint: http://localhost:${PORT}/api/colleges/search?q=<query>`);
});
