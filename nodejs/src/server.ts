import http from 'http';
import dotenv from 'dotenv';
import url from 'url';
dotenv.config();

const hostname = '127.0.0.1';

const port = parseInt(process.env.PORT ?? '3000');
const CONTENT_TYPE_JSON = { 'Content-Type': 'application/json' };
const CONTENT_TYPE_HTML = { 'Content-Type': 'text/html' };

const server = http.createServer((req, res) => {
  if (req.url) {
    const parsedUrl = url.parse(req.url, true);
    if ((req.method === 'GET', parsedUrl.path === '/ping')) {
      res.writeHead(200, CONTENT_TYPE_JSON);
      res.end(JSON.stringify({ hello: 'world' }));
    } 
  }
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
