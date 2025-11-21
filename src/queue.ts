import { Queue, Worker, JobsOptions } from 'bullmq';
import IORedis from 'ioredis';
import { MockDexRouter } from './dexRouter';
import { Order, OrderStatus, OrderStatusUpdate } from './types';
import { emitOrderUpdate } from './events';
import { updateOrderStatus } from './db';
import dotenv from 'dotenv';

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});


export const orderQueue = new Queue<Order>('orders', {
  connection
});

const router = new MockDexRouter();

async function sendStatus(
  orderId: string,
  status: OrderStatus,
  extra: Partial<OrderStatusUpdate> = {}
) {
  const update: OrderStatusUpdate = {
    orderId,
    status,
    dex: extra.dex,
    txHash: extra.txHash,
    executedPrice: extra.executedPrice,
    error: extra.error,
    timestamp: new Date().toISOString()
  };

  await updateOrderStatus(orderId, status, {
    dex: extra.dex ?? null,
    executedPrice: extra.executedPrice ?? null,
    txHash: extra.txHash ?? null,
    error: extra.error ?? null
  });

  emitOrderUpdate(update);
}

export const defaultJobOptions: JobsOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 500
  },
  removeOnComplete: true,
  removeOnFail: false
};

export const orderWorker = new Worker<Order>(
  'orders',
  async (job) => {
    const order = job.data;
    const { id } = order;

    try {
      await sendStatus(id, 'pending');

      await sendStatus(id, 'routing');

      const [rayQuote, metQuote] = await Promise.all([
        router.getRaydiumQuote(order.tokenIn, order.tokenOut, order.amount),
        router.getMeteoraQuote(order.tokenIn, order.tokenOut, order.amount)
      ]);

      const bestQuote = rayQuote.price >= metQuote.price ? rayQuote : metQuote;

      await sendStatus(id, 'building', { dex: bestQuote.dex });

      await new Promise(r => setTimeout(r, 500));

      await sendStatus(id, 'submitted', { dex: bestQuote.dex });

      const execResult = await router.executeSwap(bestQuote.dex);

      await sendStatus(id, 'confirmed', {
        dex: bestQuote.dex,
        txHash: execResult.txHash,
        executedPrice: execResult.executedPrice
      });

      return execResult;

    } catch (err: any) {
      await sendStatus(order.id, 'failed', { error: err?.message });
      throw err;
    }
  },
  { connection, concurrency: 10 }
);

orderWorker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

orderWorker.on('failed', (job, err) => {
  console.log(`❌ Job ${job?.id} failed:`, err);
});
