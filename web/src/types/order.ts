export interface OrderItem {
    productId: string;
    name: string;
    variantSku?: string;
    quantity: number;
    price_cents: number;
    image?: string;
}

export interface Order {
    _id: string;
    userId: string;
    items: OrderItem[];
    total_cents: number;
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
    orderStatus: 'placed' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
    createdAt: string;
    updatedAt: string;
    shippingAddress: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    };
}
