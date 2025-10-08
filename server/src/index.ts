import { createServer } from 'http';
import { app } from './app';
import { env } from './config/environment';

console.log('--- DEBUGGING DATABASE CONNECTION ---');
if (process.env.DIRECT_URL) {
  try {
    const url = new URL(process.env.DIRECT_URL);
    console.log(`DIRECT_URL host: ${url.host}`);
    console.log(`DIRECT_URL user: ${url.username}`);
    console.log(`DIRECT_URL password length: ${url.password.length}`);
    console.log(`DIRECT_URL path: ${url.pathname}`);
  } catch (e) {
    console.log('Error parsing DIRECT_URL:', e.message);
    console.log('DIRECT_URL as a string:', process.env.DIRECT_URL);
  }
} else {
  console.log('DIRECT_URL is not set!');
}
console.log('------------------------------------');

const port = env.PORT;

const server = createServer(app);

server.listen(port, () => {
  console.log(`[krishi-mitra] Server listening on http://localhost:${port}`);
});

// Graceful shutdown
const shutdown = (signal: string) => {
  console.log(`[krishi-mitra] Received ${signal}. Shutting down...`);
  server.close(() => {
    console.log('[krishi-mitra] HTTP server closed.');
    process.exit(0);
  });
  // Force exit after timeout
  setTimeout(() => process.exit(1), 10000);
};

['SIGINT', 'SIGTERM'].forEach((sig) => {
  process.on(sig as NodeJS.Signals, () => shutdown(sig));
});
