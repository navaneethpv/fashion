import { getUserOrders } from '../controllers/orderController';
import { Order } from '../models/Order';
import { Request, Response } from 'express';

jest.mock('../models/Order');

describe('getUserOrders', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    req = {
      params: {
        userId: 'testUserId',
      },
    };
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    res = {
      status: statusMock,
    };
  });

  it('should return orders for a user', async () => {
    const mockOrders = [{ orderId: '123' }, { orderId: '456' }];
    (Order.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockResolvedValue(mockOrders),
    });

    await getUserOrders(req as Request, res as Response);

    expect(Order.find).toHaveBeenCalledWith({ userId: 'testUserId' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(mockOrders);
  });

  it('should return a 500 error if fetching fails', async () => {
    (Order.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockRejectedValue(new Error('Test Error')),
    });

    await getUserOrders(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ message: 'Failed to retrieve orders' });
  });
});
