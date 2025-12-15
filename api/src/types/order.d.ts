// TypeScript interfaces for Order functionality
export interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}


export interface OrderItem {
  productId: string;
  name: string;
  variantSku: string;
  quantity: number;
  price_cents: number;
  image?: string | null;
}

// Status enums
export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';
export type OrderStatus = 'Placed' | 'Shipped' | 'Delivered' | 'Cancelled';
export type LegacyStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

export interface CreateOrderRequest {
  userId: string;
  shippingAddress: ShippingAddress;
  total_cents?: number; // Optional, will be calculated server-side
}


export interface CreateOrderResponse {
  _id: string;
  userId: string;
  items: OrderItem[];
  total_cents: number;
  
  // Legacy status field for backward compatibility
  status: LegacyStatus;
  
  // New separated status fields
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  
  paymentInfo: {
    id: string;
    status: string;
    method: string;
  };
  shippingAddress: ShippingAddress;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  revenue: number;
  orders: number;
  products: number;
  users: number;
  recentOrders: any[];
}

export interface MonthlySalesData {
  year: number;
  monthlySales: {
    month: number;
    totalSales: number;
    orderCount: number;
  }[];
}


export interface PriceMismatchError {
  message: string;
  calculated_total: number;
  requested_total: number;
}

export interface UpdateOrderStatusRequest {
  orderStatus: OrderStatus;
}

export interface UpdatePaymentStatusRequest {
  paymentStatus: PaymentStatus;
}

export interface OrderStatusUpdateResponse {
  _id: string;
  userId: string;
  items: OrderItem[];
  total_cents: number;
  status: LegacyStatus;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  paymentInfo: {
    id: string;
    status: string;
    method: string;
  };
  shippingAddress: ShippingAddress;
  createdAt: string;
  updatedAt: string;
}
