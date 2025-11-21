import { FastifyInstance } from 'fastify';
import { orderQueue, defaultJobOptions } from './queue';
import { insertOrder } from './db';
import { CreateOrderRequest, Order } from './types';
import { emitOrderUpdate, orderEvents } from './events';
import { randomUUID } from 'crypto';

export async function registerRoutes(app: FastifyInstance) {
  // -------------------------------------
  // POST /api/orders/execute
  // -------------------------------------
  app.post<{ Body: CreateOrderRequest }>(
    '/api/orders/execute',
    async (request, reply) => {
      const { tokenIn, tokenOut, amount, side } = request.body;

      const id = randomUUID();

      const order: Order = {
        id,
        type: 'market',
        tokenIn,
        tokenOut,
        amount,
        side,
        status: 'pending'
      };

      await insertOrder(order);

      emitOrderUpdate({
        orderId: id,
        status: 'pending',
        timestamp: new Date().toISOString()
      });

      await orderQueue.add('execute-order', order, defaultJobOptions);

      return reply.send({
        orderId: id,
        message: 'Order received',
        wsUrl: `/ws/orders/${id}`
      });
    }
  );

  // -------------------------------------
  // WebSocket /ws/orders/:orderId
  // -------------------------------------
app.get(
  '/ws/orders/:orderId',
  { websocket: true },
  (socket, req) => {
    const { orderId } = req.params as { orderId: string };

    console.log("🔌 WebSocket connected:", orderId);

    // Keep the connection alive
    socket.on('message', () => {});

    const listener = (update: any) => {
      if (update.orderId === orderId) {
        if (socket.readyState === socket.OPEN) {
          socket.send(JSON.stringify(update));
        } else {
          console.log("⚠ WebSocket not open, skipping:", orderId);
        }
      }
    };

    orderEvents.on(`order-updated:${orderId}`, listener);

    socket.on('close', () => {
      console.log("❌ WebSocket closed:", orderId);
      orderEvents.off(`order-updated:${orderId}`, listener);
    });
  }
);

}
