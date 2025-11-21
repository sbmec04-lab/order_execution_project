import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';   // ⬅ ADD THIS
import dotenv from 'dotenv';
import { registerRoutes } from './routes';
import { initDb } from './db';
import './queue';

dotenv.config();

async function start() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: "*" });   // ⬅ ADD THIS
  await app.register(websocket);

  await registerRoutes(app);
  await initDb();

  const port = Number(process.env.PORT) || 3000;
  await app.listen({ port, host: '0.0.0.0' });

  console.log(`🚀 Server running on port ${port}`);
}

start();
