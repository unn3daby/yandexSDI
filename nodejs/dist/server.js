var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var _a;
import fs from 'node:fs';
import http from 'http';
import dotenv from 'dotenv';
import url from 'url';
import readline from 'readline';
dotenv.config();
const HOSTNAME = '127.0.0.1';
const PORT = parseInt((_a = process.env.PORT) !== null && _a !== void 0 ? _a : '3000');
const BACKUP_FILE_PATH = process.env.BACKUP_FILE_PATH;
const CONTENT_TYPE_JSON = { 'Content-Type': 'application/json' };
const CONTENT_TYPE_HTML = { 'Content-Type': 'text/html' };
const API_PATH = '/api/v1';
function makeMoviesArray(path, searchTerm, page = 1, size = 10) {
    var _a, e_1, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        const data = [];
        let lineCount = 0;
        const startLine = (page - 1) * size;
        const endLine = startLine + size - 1;
        const rl = readline.createInterface({
            input: fs.createReadStream(path),
            crlfDelay: Infinity,
        });
        try {
            for (var _d = true, rl_1 = __asyncValues(rl), rl_1_1; rl_1_1 = yield rl_1.next(), _a = rl_1_1.done, !_a;) {
                _c = rl_1_1.value;
                _d = false;
                try {
                    const line = _c;
                    if (lineCount >= startLine && lineCount <= endLine) {
                        try {
                            const movie = JSON.parse(line);
                            if (!searchTerm ||
                                movie.title.toLowerCase().includes(searchTerm.toLowerCase())) {
                                const { id, title, description, genre, release_year } = movie;
                                data.push({ id, title, description, genre, release_year });
                            }
                            else {
                                lineCount--;
                            }
                        }
                        catch (err) {
                            console.error('Error parsing JSON:', err);
                        }
                    }
                    lineCount++;
                    if (lineCount > endLine) {
                        break;
                    }
                }
                finally {
                    _d = true;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = rl_1.return)) yield _b.call(rl_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return data;
    });
}
function findMovie(path, id) {
    var _a, e_2, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        const rl = readline.createInterface({
            input: fs.createReadStream(path),
            crlfDelay: Infinity,
        });
        try {
            for (var _d = true, rl_2 = __asyncValues(rl), rl_2_1; rl_2_1 = yield rl_2.next(), _a = rl_2_1.done, !_a;) {
                _c = rl_2_1.value;
                _d = false;
                try {
                    const line = _c;
                    try {
                        const movie = JSON.parse(line);
                        if (movie.id == id) {
                            const { id, title, description, genre, release_year } = movie;
                            return { id, title, description, genre, release_year };
                        }
                    }
                    catch (err) {
                        console.error('Error parsing JSON:', err);
                    }
                }
                finally {
                    _d = true;
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = rl_2.return)) yield _b.call(rl_2);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return null;
    });
}
const server = http.createServer((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
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
                        }
                        else {
                            throw new Error('No message in your JSON');
                        }
                    }
                    catch (error) {
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
                        const rawRecords = yield makeMoviesArray(BACKUP_FILE_PATH, title, page, 10);
                        res.writeHead(200, CONTENT_TYPE_JSON);
                        res.end(JSON.stringify(rawRecords));
                    }
                    catch (error) {
                        console.error(error);
                        res.writeHead(500, CONTENT_TYPE_JSON);
                        res.end(JSON.stringify({ message: 'Error parsing file' }));
                    }
                }
                return;
            }
            if (req.method === 'GET' &&
                ((_b = parsedUrl.pathname) === null || _b === void 0 ? void 0 : _b.startsWith(`${API_PATH}/movie`))) {
                const movieId = parsedUrl.pathname.substring(`${API_PATH}/movie`.length + 1);
                if (BACKUP_FILE_PATH) {
                    try {
                        const movie = yield findMovie(BACKUP_FILE_PATH, movieId);
                        console.log(movie);
                        res.writeHead(200, CONTENT_TYPE_JSON);
                        res.end(JSON.stringify(movie));
                    }
                    catch (error) {
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
    }
    catch (error) {
        console.error(error);
        res.writeHead(500, CONTENT_TYPE_JSON);
        res.end(JSON.stringify({ message: 'Server Error' }));
    }
}));
server.listen(PORT, HOSTNAME, () => {
    console.log(`Server running at http://${HOSTNAME}:${PORT}/`);
});
