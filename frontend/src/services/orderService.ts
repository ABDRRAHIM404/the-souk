import api from "./api";
import type { Order, CreateOrderPayload } from "@/types";

export const orderService = {
  // Tourist: place order from cart
  create: (payload: CreateOrderPayload): Promise<Order[]> =>
    api.post("/orders", payload).then((r) => r.data),

  // Tourist: get own orders
  getMyOrders: (): Promise<Order[]> =>
    api.get("/orders/my").then((r) => r.data),

  // Coop owner: get incoming orders for their cooperative
  getCoopOrders: (): Promise<Order[]> =>
    api.get("/orders/coop").then((r) => r.data),

  // Coop owner: update order status
  updateStatus: (
    id: string,
    status: "confirmed" | "delivered" | "cancelled"
  ): Promise<Order> =>
    api.patch(`/orders/${id}/status`, { status }).then((r) => r.data),
};
