import http from 'http';
import dotenv from 'dotenv';
import url from 'url';
dotenv.config();

const HOSTNAME = '127.0.0.1';
const PORT = parseInt(process.env.PORT ?? '3000');
const BACKUP_FILE_PATH = process.env.BACKUP_FILE_PATH;
const CONTENT_TYPE_JSON = { 'Content-Type': 'application/json' };
const CONTENT_TYPE_HTML = { 'Content-Type': 'text/html' };

const server = http.createServer((req, res) => {
  try {
    if (req.url) {
      const parsedUrl = url.parse(req.url, true);
      if (req.method === 'GET' && parsedUrl.path === '/') {
        res.writeHead(200, CONTENT_TYPE_HTML);
        res.end('123123123123123123');
      } else if (req.method === 'GET' && parsedUrl.path === '/ping') {
        res.writeHead(200, CONTENT_TYPE_JSON);
        res.end(JSON.stringify({ hello: 'world' }));
      } 
      else if (req.method === 'POST' && parsedUrl.path === '/echo') {

      } else {
        res.writeHead(404, CONTENT_TYPE_JSON);
        res.end(JSON.stringify({ message: 'Not found' }));
      }
    }
  } catch (error) {
    console.error(error);
  }
});

server.listen(PORT, HOSTNAME, () => {
  console.log(`Server running at http://${HOSTNAME}:${PORT}/`);
});
