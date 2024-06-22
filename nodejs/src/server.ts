import fs from 'node:fs';
import http from 'http';
import dotenv from 'dotenv';
import url from 'url';
import readline from 'readline';
import MoveResponseModel from './models/MoveResponseModel';
import MovieModel from './models/MovieModel';

dotenv.config();

const HOSTNAME = '127.0.0.1';
const PORT = parseInt(process.env.PORT ?? '3000');
const BACKUP_FILE_PATH = process.env.BACKUP_FILE_PATH;
const CONTENT_TYPE_JSON = { 'Content-Type': 'application/json' };
const CONTENT_TYPE_HTML = { 'Content-Type': 'text/html' };
const API_PATH = '/api/v1';

async function makeMoviesArray(
  path: string,
  searchTerm?: string,
  page: number = 1,
  size: number = 10
): Promise<Array<MoveResponseModel>> {
  const data: Array<MoveResponseModel> = [];

  let lineCount = 0;
  const startLine = (page - 1) * size;
  const endLine = startLine + size - 1;

  const rl = readline.createInterface({
    input: fs.createReadStream(path),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (lineCount >= startLine && lineCount <= endLine) {
      try {
        const movie = JSON.parse(line) as MovieModel;
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

async function findMovie(path: string, id: string) {
  const rl = readline.createInterface({
    input: fs.createReadStream(path),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    try {
      const movie = JSON.parse(line);
      if (movie.id == id) {
        const { id, title, description, genre, release_year } = movie;
        return { id, title, description, genre, release_year };
      }
    } catch (err) {
      console.error('Error parsing JSON:', err);
    }
  }
  return null;
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

      if (req.method === 'GET' && parsedUrl.pathname === `${API_PATH}/search`) {
        const page = parseInt(String(parsedUrl.query.page || '')) || undefined;
        const title = String(parsedUrl.query.title || '') || undefined;

        if (BACKUP_FILE_PATH) {
          try {
            const rawRecords = await makeMoviesArray(
              BACKUP_FILE_PATH,
              title,
              page,
              10
            );
            res.writeHead(200, CONTENT_TYPE_JSON);
            res.end(JSON.stringify(rawRecords));
          } catch (error) {
            console.error(error);
            res.writeHead(500, CONTENT_TYPE_JSON);
            res.end(JSON.stringify({ message: 'Error parsing file' }));
          }
        }
        return;
      }

      if (
        req.method === 'GET' &&
        parsedUrl.pathname?.startsWith(`${API_PATH}/movie`)
      ) {
        const movieId = parsedUrl.pathname.substring(
          `${API_PATH}/movie`.length + 1
        );
        if (BACKUP_FILE_PATH) {
          try {
            const movie = await findMovie(BACKUP_FILE_PATH, movieId);
            console.log(movie);
            res.writeHead(200, CONTENT_TYPE_JSON);
            res.end(JSON.stringify(movie));
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
