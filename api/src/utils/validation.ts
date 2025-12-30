import { Request, Response, NextFunction } from 'express';
import {
  CreateOrderRequest,
  ShippingAddress,
  PriceMismatchError
} from '../types/order';

// Validation utilities
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const validateShippingAddress = (address: any): ShippingAddress => {
  const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'street', 'city', 'district', 'state', 'zip'];

  for (const field of requiredFields) {
    if (!address[field] || typeof address[field] !== 'string' || !address[field].trim()) {
      throw new ValidationError(`Invalid or missing field: ${field}`, field);
    }
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(address.email)) {
    throw new ValidationError('Invalid email format', 'email');
  }

  // Phone validation (basic)
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  const cleanPhone = address.phone.replace(/[\s\-\(\)]/g, '');
  if (!phoneRegex.test(cleanPhone)) {
    throw new ValidationError('Invalid phone number format', 'phone');
  }

  return {
    firstName: address.firstName.trim(),
    lastName: address.lastName.trim(),
    email: address.email.trim().toLowerCase(),
    phone: cleanPhone,
    street: address.street.trim(),
    city: address.city.trim(),
    district: address.district.trim(),
    state: address.state.trim(),
    zip: address.zip.trim(),
    country: address.country?.trim() || 'US'
  };
};

export const validateCreateOrderRequest = (body: any): CreateOrderRequest => {
  if (!body.userId || typeof body.userId !== 'string' || !body.userId.trim()) {
    throw new ValidationError('Valid userId is required', 'userId');
  }

  if (!body.shippingAddress) {
    throw new ValidationError('Shipping address is required', 'shippingAddress');
  }

  const shippingAddress = validateShippingAddress(body.shippingAddress);

  // Validate optional total_cents
  if (body.total_cents !== undefined) {
    if (typeof body.total_cents !== 'number' || body.total_cents < 0) {
      throw new ValidationError('total_cents must be a positive number', 'total_cents');
    }
  }

  return {
    userId: body.userId.trim(),
    shippingAddress,
    total_cents: body.total_cents
  };
};

export const validateOrderItems = (items: any[]): void => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ValidationError('Order items must be a non-empty array');
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (!item.productId || typeof item.productId !== 'string') {
      throw new ValidationError(`Invalid productId at index ${i}`, `items[${i}].productId`);
    }

    if (!item.name || typeof item.name !== 'string') {
      throw new ValidationError(`Invalid name at index ${i}`, `items[${i}].name`);
    }

    if (!item.variantSku || typeof item.variantSku !== 'string') {
      throw new ValidationError(`Invalid variantSku at index ${i}`, `items[${i}].variantSku`);
    }

    if (typeof item.quantity !== 'number' || item.quantity <= 0) {
      throw new ValidationError(`Invalid quantity at index ${i}`, `items[${i}].quantity`);
    }

    if (typeof item.price_cents !== 'number' || item.price_cents < 0) {
      throw new ValidationError(`Invalid price_cents at index ${i}`, `items[${i}].price_cents`);
    }
  }
};

// Express middleware for request validation
export const validateCreateOrder = (req: Request, res: Response, next: NextFunction): void => {
  try {
    req.body = validateCreateOrderRequest(req.body);
    next();
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({
        error: 'Validation Error',
        message: error.message,
        field: error.field
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Validation failed'
      });
    }
  }
};

// Error handling for cart operations
export const handleCartError = (error: any, res: Response): void => {
  if (error.name === 'ValidationError') {
    res.status(400).json({
      error: 'Validation Error',
      message: error.message
    });
  } else if (error.name === 'CastError') {
    res.status(400).json({
      error: 'Invalid ID',
      message: 'One or more IDs are invalid'
    });
  } else {
    console.error('Cart Operation Error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process cart operation'
    });
  }
};

// Price validation utilities
export const validatePriceSnapshot = (
  cartPrice: number,
  productPrice: number,
  maxVariance: number = 0.05 // 5% variance allowed
): boolean => {
  const variance = Math.abs(cartPrice - productPrice) / productPrice;
  return variance <= maxVariance;
};

export const formatPriceForResponse = (priceCents: number): string => {
  return (priceCents / 100).toFixed(2);
};

export const calculateOrderTotal = (items: any[]): number => {
  return items.reduce((total, item) => total + (item.price_cents * item.quantity), 0);
};
