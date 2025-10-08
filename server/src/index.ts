import { createServer } from 'http';
import { app } from './app';
import { env } from './config/environment';

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
