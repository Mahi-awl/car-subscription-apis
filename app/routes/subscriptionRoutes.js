import express from 'express';

import { 
  createSubscription, 
  getSubscriptions, 
  updateSubscriptionStatus 
} from '../controllers/subscriptionController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';
import { verifyPayment } from '../controllers/subscriptionController.js';


const router = express.Router();

// User routes
router.post('/', protect, createSubscription);
router.get('/', protect, getSubscriptions);
router.post('/verify-payment', protect, verifyPayment);

// Admin route
router.put('/:id', protect, admin, updateSubscriptionStatus);

export default router;