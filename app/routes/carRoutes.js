import express from 'express';
import { createCar, getAllCars, updateCar, deleteCar } from '../controllers/carController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';
import { upload } from '../middlewares/uploadMiddleware.js';

const router = express.Router();


router.post('/', protect, admin, upload.single('image'), createCar);
router.put('/:id', protect, admin, upload.single('image'), updateCar);
router.delete('/:id', protect, admin, deleteCar);

router.get('/', protect, getAllCars);

export default router;