#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const port = 8080;
const distPath = path.join(__dirname, 'dist');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let filePath = url.parse(req.url).pathname;
  
  // Корневой путь -> index.html
  if (filePath === '/') {
    filePath = '/index.html';
  }
  
  const fullPath = path.join(distPath, filePath);
  const extname = path.extname(fullPath);
  const contentType = mimeTypes[extname] || 'text/plain';
  
  // Проверяем существование файла
  if (!fs.existsSync(fullPath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
    return;
  }
  
  // Проверяем что файл в пределах dist папки (безопасность)
  if (!fullPath.startsWith(distPath)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }
  
  // Читаем и отправляем файл
  fs.readFile(fullPath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Internal Server Error');
      return;
    }
    
    res.writeHead(200, { 
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });
    res.end(content);
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`🚀 Сервер запущен на http://127.0.0.1:${port}`);
  console.log(`📁 Обслуживает файлы из: ${distPath}`);
  console.log(`⏹️  Для остановки нажмите Ctrl+C`);
});
