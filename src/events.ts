import { EventEmitter } from 'events';
import { OrderStatusUpdate } from './types';

export const orderEvents = new EventEmitter();

orderEvents.setMaxListeners(0);

export function emitOrderUpdate(update: OrderStatusUpdate) {
  orderEvents.emit(`order-updated:${update.orderId}`, update);
}
