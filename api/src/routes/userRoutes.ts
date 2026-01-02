
import express from 'express';
import {
    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    getUserProfile
} from '../controllers/userController';

const router = express.Router();


router.get('/me', getUserProfile); // New endpoint for fetching own profile
router.get('/addresses', getAddresses);
router.post('/addresses', addAddress);
router.put('/addresses/:addressId', updateAddress);
router.delete('/addresses/:addressId', deleteAddress);
router.patch('/addresses/:addressId/default', setDefaultAddress);



export default router;
