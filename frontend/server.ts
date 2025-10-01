import express from 'express';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Simple static Express server for serving the built frontend (no SSR)
export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtmlPath = join(browserDistFolder, 'index.html');

  // Serve static assets
  server.get('*.*', express.static(browserDistFolder, { maxAge: '1y' }));

  // Fallback to index.html for client-side routing
  server.get('*', (req, res) => {
    try {
      const indexHtml = readFileSync(indexHtmlPath, 'utf-8');
      res.status(200).header('Content-Type', 'text/html').send(indexHtml);
    } catch (err) {
      res.status(500).send('Index file not found. Build the project first.');
    }
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;
  const server = app();
  server.listen(port, () => {
    console.log(`Static server listening on http://localhost:${port}`);
  });
}

run();
