import express, { RequestHandler } from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'node:module';
import expressLayouts from 'express-ejs-layouts';
import chokidar from 'chokidar';
import _ from 'lodash';
import { config } from 'dotenv';
import basicAuth from 'express-basic-auth';
import fs from 'fs';
import https from 'https';
import path from 'path';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const _require = createRequire(import.meta.url);

config();

interface LogEntry {
  name: string;
  path: string;
  size: number;
  modified: Date;
  type: 'file' | 'directory';
  children?: LogEntry[];
}

interface LogFileData {
  name: string;
  path: string;
  size: number;
  modified: Date;
}

// Handle paths that start with ~ by expanding to home directory
const expandPath = (filepath: string) => {
  if (filepath.startsWith('~')) {
    return filepath.replace('~', os.homedir());
  }
  return filepath;
};

const logsPath = process.env.LOGS_DIR ? expandPath(process.env.LOGS_DIR) : join(process.cwd(), 'logs');
const logStructure: LogEntry[] = [];
const fileCache = new Map<string, LogEntry>();

const authConfig = {
  users: {
    [process.env.LOGS_USERNAME || 'admin']: process.env.LOGS_PASSWORD || 'secret'
  },
  challenge: true,
  realm: 'Logs Dashboard'
};

const buildLogStructure = () => {
  const structure: LogEntry[] = [];

  const walkDir = (dirPath: string, parent: LogEntry[]) => {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      entries.forEach(entry => {
        if (entry.name.endsWith('-audit.json')) {
          return;
        }

        const fullPath = join(dirPath, entry.name);
        try {
          const stats = fs.statSync(fullPath);

          const node: LogEntry = {
            name: entry.name,
            path: fullPath,
            size: stats.size / 1024,
            modified: stats.mtime,
            type: entry.isDirectory() ? 'directory' : 'file'
          };

          if (entry.isDirectory()) {
            node.children = [];
            walkDir(fullPath, node.children);
          }

          parent.push(node);
          fileCache.set(fullPath, node);
        } catch (err) {
          console.error(`Error processing ${fullPath}:`, err);
        }
      });
    } catch (err) {
      console.error(`Error reading directory ${dirPath}:`, err);
    }
  };

  walkDir(logsPath, structure);
  return structure;
};

const watcher = chokidar.watch(logsPath, {
  ignored: /(^|[\/\\])\../,
  persistent: true,
  depth: 99,
  ignoreInitial: false
});

watcher
  .on('ready', () => {
    console.log('Initial scan complete. Ready for changes.');
    logStructure.length = 0;
    logStructure.push(...buildLogStructure());
  })
  .on('add', (path) => {
    console.log(`File ${path} has been added`);
    const parentPath = dirname(path);
    const parent = fileCache.get(parentPath);

    if (parent && parent.type === 'directory') {
      try {
        const stats = fs.statSync(path);
        const newFile = {
          name: path.split('/').pop() || path,
          path,
          size: stats.size / 1024,
          modified: stats.mtime,
          type: 'file' as const
        };
        parent.children = parent.children || [];
        parent.children.push(newFile);
        fileCache.set(path, newFile);
      } catch (err) {
        console.error(`Error processing new file ${path}:`, err);
      }
    }
  })
  .on('unlink', (path) => {
    console.log(`File ${path} has been removed`);
    const parentPath = dirname(path);
    const parent = fileCache.get(parentPath);

    if (parent && parent.type === 'directory' && parent.children) {
      _.remove(parent.children, (child) => child.path === path);
    }
    fileCache.delete(path);
  })
  .on('change', (path) => {
    console.log(`File ${path} has been changed`);
    const file = fileCache.get(path);
    if (file && file.type === 'file') {
      try {
        const stats = fs.statSync(path);
        file.size = stats.size / 1024;
        file.modified = stats.mtime;
      } catch (err) {
        console.error(`Error updating file ${path}:`, err);
      }
    }
  });

function setupServer() {
  const app = express();

  // Setup authentication for protected routes
  const secureRoutes = ['/', '/logs', '/logs/view', '/logs/download', '/logs/stream'];
  secureRoutes.forEach(route => {
    app.use(route, (req, res, next) => {
      console.log(`Request to protected route: ${req.path}`);
      basicAuth(authConfig)(req, res, next);
    });
  });

  app.use(expressLayouts);

  // Fix static file paths for standalone structure
  app.use('/assets/css', express.static(join(__dirname, 'public/css')));
  app.use('/assets/js', express.static(join(__dirname, 'public/js')));
  app.use('/assets/fonts', express.static(join(__dirname, 'assets/fonts')));
  
  // Fix view paths 
  app.set('views', join(__dirname, 'views'));
  app.set('view engine', 'ejs');
  
  // Fix fontawesome path
  const nodemodulesPath = path.resolve(__dirname, 'node_modules');
  app.use('/fonts', express.static(join(nodemodulesPath, '@fortawesome/fontawesome-free')));

  // Redirect root to logs page
  app.get('/', (req, res) => {
    res.redirect('/logs');
  });

  const dashboardHandler: RequestHandler = (req, res) => {
    res.render('dashboard', {
      title: 'Log Dashboard',
      logs: logStructure,
      layout: 'layouts/main'
    });
  };
  app.get('/logs', dashboardHandler);

  const viewLogHandler: RequestHandler = (req, res) => {
    try {
      const filePath = req.query.file as string;
      if (!filePath) {
        res.status(400).send('File path is required');
        return;
      }

      console.log('Request to view file:', filePath);
      
      if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        res.status(404).send('File not found');
        return;
      }
      
      if (!filePath.includes('logs')) {
        console.error(`Security check failed: ${filePath} does not appear to be a log file`);
        res.status(403).send('Access denied - not a log file');
        return;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const fileName = filePath.split('/').pop() || filePath;
      
      res.render('log-viewer', {
        title: `Viewing: ${fileName}`,
        content,
        layout: 'layouts/main'
      });
    } catch (error) {
      console.error('Error reading log file:', error);
      res.status(500).send('Error reading log file');
    }
  };
  app.get('/logs/view', viewLogHandler);

  const downloadHandler: RequestHandler = (req, res) => {
    try {
      const filePath = req.query.file as string;
      if (!filePath) {
        res.status(400).send('File path is required');
        return;
      }

      console.log('Request to download file:', filePath);
      
      if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        res.status(404).send('File not found');
        return;
      }
      
      if (!filePath.includes('logs')) {
        console.error(`Security check failed: ${filePath} does not appear to be a log file`);
        res.status(403).send('Access denied - not a log file');
        return;
      }

      const fileName = filePath.split('/').pop() || 'log.txt';
      res.download(filePath, fileName);
    } catch (error) {
      console.error('Error downloading log file:', error);
      res.status(500).send('Error downloading log file');
    }
  };
  app.get('/logs/download', downloadHandler);

  const streamHandler: RequestHandler = (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendUpdate = () => {
      const filesData: LogFileData[] = [];
      const processEntries = (entries: LogEntry[]) => {
        for (const entry of entries) {
          if (entry.type === 'file') {
            filesData.push({
              name: entry.name,
              path: entry.path,
              size: entry.size,
              modified: entry.modified
            });
          }
          if (entry.children && entry.children.length > 0) {
            processEntries(entry.children);
          }
        }
      };

      processEntries(logStructure);
      res.write(`data: ${JSON.stringify(filesData)}\n\n`);
    };

    sendUpdate();

    const intervalId = setInterval(sendUpdate, 10000);

    req.on('close', () => {
      clearInterval(intervalId);
    });
  };
  app.get('/logs/stream', streamHandler);

  return app;
}

// Start the server
function startServer() {
  const app = setupServer();
  const port = Number(process.env.LOG_PORT) || 3001;
  const domain = process.env.DOMAIN;

  // Check if SSL certificates are provided
  if (process.env.SSL_KEY_PATH && process.env.SSL_CERT_PATH) {
    try {
      const sslKey = fs.readFileSync(expandPath(process.env.SSL_KEY_PATH));
      const sslCert = fs.readFileSync(expandPath(process.env.SSL_CERT_PATH));
      
      const httpsOptions = {
        key: sslKey,
        cert: sslCert
      };
      
      const server = https.createServer(httpsOptions, app);
      server.listen(port, '0.0.0.0', () => {
        console.log(`🔐 HTTPS Log dashboard running at https://0.0.0.0:${port}/logs`);
        if (domain) {
          console.log(`🔐 HTTPS Log dashboard available at https://${domain}:${port}/logs`);
        }
      });
    } catch (error) {
      console.error('Error setting up HTTPS server:', error);
      console.log('Falling back to HTTP server');
      startHttpServer(app, port);
    }
  } else {
    console.log('SSL certificate paths not provided in .env, starting HTTP server');
    startHttpServer(app, port);
  }
}

function startHttpServer(app: express.Express, port: number) {
  const domain = process.env.DOMAIN;
  app.listen(port, '0.0.0.0', () => {
    console.log(`📋 HTTP Log dashboard running at http://0.0.0.0:${port}/logs`);
    if (domain) {
      console.log(`📋 HTTP Log dashboard available at http://${domain}:${port}/logs`);
    }
  });
}

if (import.meta.url === `file://${__filename}`) {
  startServer();
}

export { setupServer, startServer };