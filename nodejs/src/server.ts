import fs from 'node:fs';
import http from 'http';
import dotenv from 'dotenv';
import url from 'url';
import readline from 'readline';

dotenv.config();

const HOSTNAME = '127.0.0.1';
const PORT = parseInt(process.env.PORT ?? '3000');
const BACKUP_FILE_PATH = process.env.BACKUP_FILE_PATH;
const CONTENT_TYPE_JSON = { 'Content-Type': 'application/json' };
const CONTENT_TYPE_HTML = { 'Content-Type': 'text/html' };

async function parseFile(
  filename: string,
  searchTerm?: string,
  page: number = 1,
  size: number = 10
) {
  const data: Array<object> = [];

  let lineCount = 0;
  const startLine = (page - 1) * size;
  const endLine = startLine + size - 1;

  const rl = readline.createInterface({
    input: fs.createReadStream(filename),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (lineCount >= startLine && lineCount <= endLine) {
      try {
        const movie = JSON.parse(line);
        if (
          !searchTerm ||
          movie.title.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          const { id, title, description, genre, release_year } = movie;
          data.push({ id, title, description, genre, release_year });
        } else {
          lineCount--;
        }
      } catch (err) {
        console.error('Error parsing JSON:', err);
      }
    }
    lineCount++;

    if (lineCount > endLine) {
      break;
    }
  }

  return data;
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url) {
      const parsedUrl = url.parse(req.url, true);

      if (req.method === 'GET' && parsedUrl.pathname === '/') {
        res.writeHead(200, CONTENT_TYPE_HTML);
        res.end('Hello world');
        return;
      }

      if (req.method === 'GET' && parsedUrl.pathname === '/ping') {
        res.writeHead(200, CONTENT_TYPE_JSON);
        res.end(JSON.stringify({ message: 'pong' }));
        return;
      }

      if (req.method === 'POST' && parsedUrl.pathname === '/echo') {
        let data = '';

        req.on('data', (chunk) => {
          data += chunk;
        });

        req.on('end', () => {
          try {
            const parsedJson = JSON.parse(data);
            console.log(parsedJson, 'Parsed JSON');
            if ('message' in parsedJson) {
              res.writeHead(200, CONTENT_TYPE_JSON);
              res.end(JSON.stringify({ yourMessage: parsedJson.message }));
            } else {
              throw new Error('No message in your JSON');
            }
          } catch (error) {
            res.writeHead(400, CONTENT_TYPE_JSON);
            res.end(JSON.stringify({ message: String(error) }));
          }
        });
        return;
      }

      if (req.method === 'GET' && parsedUrl.pathname === '/file') {
        const page = parseInt(String(parsedUrl.query.page || '')) || undefined;
        const title = String(parsedUrl.query.title || '') || undefined;

        if (BACKUP_FILE_PATH) {
          try {
            const rawRecords = await parseFile(
              BACKUP_FILE_PATH,
              title,
              page,
              10
            );
            res.writeHead(200, CONTENT_TYPE_JSON);
            res.end(JSON.stringify({ records: rawRecords }));
          } catch (error) {
            console.error(error);
            res.writeHead(500, CONTENT_TYPE_JSON);
            res.end(JSON.stringify({ message: 'Error parsing file' }));
          }
        }
        return;
      }

      res.writeHead(404, CONTENT_TYPE_JSON);
      res.end(JSON.stringify({ message: 'Not found' }));
    }
  } catch (error) {
    console.error(error);
    res.writeHead(500, CONTENT_TYPE_JSON);
    res.end(JSON.stringify({ message: 'Server Error' }));
  }
});

server.listen(PORT, HOSTNAME, () => {
  console.log(`Server running at http://${HOSTNAME}:${PORT}/`);
});
