
import { Request, Response } from 'express';
import { User } from '../models/User';

// Get all addresses
export const getAddresses = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).auth?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const user = await User.findOne({ clerkId: userId });
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.status(200).json(user.addresses || []);
    } catch (error) {
        console.error('Error fetching addresses:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add a new address
export const addAddress = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).auth?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const { street, city, district, state, zip, phone, type, isDefault } = req.body;

        const user = await User.findOne({ clerkId: userId });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // If it's the first address, make it default automatically
        const isFirstAddress = user.addresses.length === 0;
        const shouldBeDefault = isDefault || isFirstAddress;

        // If making this default, unset others
        if (shouldBeDefault && user.addresses.length > 0) {
            user.addresses.forEach((addr: any) => addr.isDefault = false);
        }

        user.addresses.push({
            street,
            city,
            district,
            state,
            zip,
            country: 'India', // Fixed as per requirements
            phone,
            type: type || 'Home',
            isDefault: shouldBeDefault
        });

        await user.save();
        res.status(201).json(user.addresses);
    } catch (error) {
        console.error('Error adding address:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update an address
export const updateAddress = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).auth?.userId;
        const { addressId } = req.params;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const user = await User.findOne({ clerkId: userId });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const address = user.addresses.id(addressId);
        if (!address) return res.status(404).json({ message: 'Address not found' });

        const { street, city, district, state, zip, phone, type, isDefault } = req.body;

        // If setting as default, unset others first
        if (isDefault) {
            user.addresses.forEach((addr: any) => addr.isDefault = false);
        }

        if (street) address.street = street;
        if (city) address.city = city;
        if (district) address.district = district;
        if (state) address.state = state;
        if (zip) address.zip = zip;
        if (phone) address.phone = phone;
        if (type) address.type = type;
        if (typeof isDefault === 'boolean') address.isDefault = isDefault;

        await user.save();
        res.status(200).json(user.addresses);
    } catch (error) {
        console.error('Error updating address:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete an address
export const deleteAddress = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).auth?.userId;
        const { addressId } = req.params;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const user = await User.findOne({ clerkId: userId });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const addressIndex = user.addresses.findIndex((addr: any) => addr._id.toString() === addressId);

        if (addressIndex === -1) {
            return res.status(404).json({ message: 'Address not found' });
        }

        const wasDefault = user.addresses[addressIndex].isDefault;
        user.addresses.splice(addressIndex, 1);

        // If we deleted the default address, make the first available one default
        if (wasDefault && user.addresses.length > 0) {
            user.addresses[0].isDefault = true;
        }

        await user.save();
        res.status(200).json(user.addresses);
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Set default address
export const setDefaultAddress = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).auth?.userId;
        const { addressId } = req.params;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const user = await User.findOne({ clerkId: userId });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const address = user.addresses.id(addressId);
        if (!address) return res.status(404).json({ message: 'Address not found' });

        // Unset all, set specific one
        user.addresses.forEach((addr: any) => addr.isDefault = false);
        address.isDefault = true;

        await user.save();
        res.status(200).json(user.addresses);
    } catch (error) {
        console.error('Error setting default address:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
