import express from 'express';
import { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateUserProfile, 
  getAllUsers,
  changePassword,    
  forgotPassword,  
  resetPassword
} from '../controllers/userController.js';

import { protect, admin } from '../middlewares/authMiddleware.js'; 
import { upload } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, upload.array('documents', 5), updateUserProfile);



router.put('/change-password', protect, changePassword); 
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

router.get('/all', protect, admin, getAllUsers);

export default router;
