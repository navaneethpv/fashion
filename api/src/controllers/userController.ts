
import { Request, Response } from 'express';
import { getAuth } from "@clerk/express";
import { User } from '../models/User';

// Get all addresses
export const getAddresses = async (req: Request, res: Response) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const user = await User.findOne({ clerkId: userId });
        if (!user) return res.status(200).json([]);

        res.status(200).json(user.addresses || []);
    } catch (error) {
        console.error('Error fetching addresses:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get current user profile (ID, email, ROLE)
export const getUserProfile = async (req: Request, res: Response) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const user = await User.findOne({ clerkId: userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            id: user._id,
            clerkId: user.clerkId,
            email: user.email,
            role: user.role, // VITAL for frontend auth check
            firstName: user.firstName,
            lastName: user.lastName
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add a new address
export const addAddress = async (req: Request, res: Response) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const { name, street, city, district, state, zip, phone, type, isDefault } = req.body;

        let user = await User.findOne({ clerkId: userId });

        if (!user) {
            user = await User.create({
                clerkId: userId,
                email: req.body.email || "unknown@clerk.user",
                addresses: [],
            });
        }

        // If it's the first address, make it default automatically
        const isFirstAddress = user.addresses.length === 0;
        const shouldBeDefault = isDefault || isFirstAddress;

        // If making this default, unset others
        if (shouldBeDefault && user.addresses.length > 0) {
            user.addresses.forEach((addr: any) => addr.isDefault = false);
        }

        user.addresses.push({
            name,
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
        const { userId } = getAuth(req);
        const { addressId } = req.params;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const user = await User.findOne({ clerkId: userId });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const address = user.addresses.id(addressId);
        if (!address) return res.status(404).json({ message: 'Address not found' });

        const { name, street, city, district, state, zip, phone, type, isDefault } = req.body;

        // If setting as default, unset others first
        if (isDefault) {
            user.addresses.forEach((addr: any) => addr.isDefault = false);
        }

        if (name) address.name = name;
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
        const { userId } = getAuth(req);
        const { addressId } = req.params;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

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
        const { userId } = getAuth(req);
        const { addressId } = req.params;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

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



// Super Admin: Promote to Admin
export const promoteToAdmin = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role === 'admin' || user.role === 'super_admin') {
            return res.status(400).json({ message: 'User is already an admin' });
        }

        user.role = 'admin';
        await user.save();

        res.json({ message: `User ${user.email} promoted to Admin`, user });
    } catch (error) {
        console.error('Promote Error:', error);
        res.status(500).json({ message: 'Failed to promote user' });
    }
};

// Super Admin: Demote to Customer
export const demoteFromAdmin = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const currentSuperAdmin = (req as any).user;

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role === 'customer') {
            return res.status(400).json({ message: 'User is already a customer' });
        }

        // Safety: Cannot demote self
        if (user._id.toString() === currentSuperAdmin._id.toString()) {
            return res.status(403).json({ message: 'You cannot demote yourself' });
        }

        // Safety: Cannot demote another Super Admin (optional but good practice)
        if (user.role === 'super_admin') {
            return res.status(403).json({ message: 'Cannot demote another Super Admin' });
        }

        user.role = 'customer';
        await user.save();

        res.json({ message: `User ${user.email} demoted to Customer`, user });
    } catch (error) {
        console.error('Demote Error:', error);
        res.status(500).json({ message: 'Failed to demote user' });
    }
};
