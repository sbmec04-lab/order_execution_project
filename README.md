📦 Order Execution Engine

A high-performance simulated DEX order execution engine supporting real-time status updates, routing, and WebSocket-based event streaming — built using TypeScript, Fastify, BullMQ, Redis, PostgreSQL.

This project executes mock market swap orders, routes them across simulated Solana DEXs (Raydium & Meteora), and sends live status updates to the client through WebSockets.

🚀 Features
🛒 Order Execution Pipeline

Create market orders via REST API

Orders run through:

pending

routing

building

submitted

confirmed

failed

⚡ Real-Time WebSocket Updates

Each order gets a dedicated WebSocket channel:

/ws/orders/:orderId


Client receives real-time JSON events:

{
  "orderId": "123",
  "status": "submitted",
  "dex": "Raydium",
  "txHash": "0xabc123",
  "timestamp": "2025-01-01T12:00:00Z"
}

🤖 Background Job Processing (BullMQ)

Redis-backed job queues

Worker concurrency

Retry logic (with exponential backoff)

Automatic order status updates

🗄️ PostgreSQL Persistence

Each order is stored with:

id

tokenIn

tokenOut

side

amount

execution metadata

timestamps


Architecture Overview:
┌──────────────┐       POST       ┌──────────────┐
│   Client     │ ───────────────▶ │   Fastify     │
└──────┬───────┘                  └──────┬───────┘
       │        WebSocket                │
       │ ◀───────────────────────────────┘
       │
       │                         (Add Job)
       │                          ┌───────┐
       └────────────────────────▶ │Queue  │
                                  └───┬───┘
                                      │
                                      ▼
                               ┌─────────────┐
                               │   Worker    │
                               │ (BullMQ)    │
                               └─────┬───────┘
                                     │
                                emitStatus()
                                     ▼
                              ┌─────────────┐
                              │ WebSocket   │
                              │ Clients     │
                              └─────────────┘

*Project structure

src/
│── index.ts            → Fastify server + WebSocket
│── routes.ts           → REST + WebSocket routes
│── queue.ts            → BullMQ queue + worker
│── events.ts           → EventEmitter for WS updates
│── db.ts               → PostgreSQL client
│── types.ts            → TypeScript types
│── dexRouter.ts        → Mock Raydium/Meteora routers
client.html             → Simple frontend UI
