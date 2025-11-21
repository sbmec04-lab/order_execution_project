export type OrderType = 'market';

export type OrderSide = 'buy' | 'sell';

export type OrderStatus =
  | 'pending'
  | 'routing'
  | 'building'
  | 'submitted'
  | 'confirmed'
  | 'failed';

export interface CreateOrderRequest {
  tokenIn: string;
  tokenOut: string;
  amount: number;
  side: OrderSide;
}

export interface Order extends CreateOrderRequest {
  id: string;
  type: OrderType;
  status: OrderStatus;
  dex?: string;
  executedPrice?: number;
  txHash?: string;
  error?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderStatusUpdate {
  orderId: string;
  status: OrderStatus;
  dex?: string;
  txHash?: string;
  executedPrice?: number;
  error?: string;
  timestamp: string;
}
