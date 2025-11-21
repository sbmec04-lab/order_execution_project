import { Pool } from 'pg';
import dotenv from 'dotenv';
import { Order, OrderStatus } from './types';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function initDb() {
  await pool.query('SELECT 1');
  console.log('✅ Connected to PostgreSQL');
}

export async function insertOrder(order: Order): Promise<void> {
  const query = `
    INSERT INTO orders (
      id, type, token_in, token_out, amount, side, status,
      dex, executed_price, tx_hash, error, created_at, updated_at
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),NOW())
  `;
  
  const values = [
    order.id,
    order.type,
    order.tokenIn,
    order.tokenOut,
    order.amount,
    order.side,
    order.status,
    order.dex ?? null,
    order.executedPrice ?? null,
    order.txHash ?? null,
    order.error ?? null
  ];

  await pool.query(query, values);
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  fields: {
    dex?: string | null;
    executedPrice?: number | null;
    txHash?: string | null;
    error?: string | null;
  } = {}
): Promise<void> {
  const query = `
    UPDATE orders
    SET status = $2,
        dex = COALESCE($3, dex),
        executed_price = COALESCE($4, executed_price),
        tx_hash = COALESCE($5, tx_hash),
        error = COALESCE($6, error),
        updated_at = NOW()
    WHERE id = $1
  `;

  const values = [
    orderId,
    status,
    fields.dex ?? null,
    fields.executedPrice ?? null,
    fields.txHash ?? null,
    fields.error ?? null
  ];

  await pool.query(query, values);
}
