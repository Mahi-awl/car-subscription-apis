import Car from '../models/carModel.js';
import sendResponse from '../utils/responseHandler.js';
import { createCarValidationSchema, updateCarValidationSchema } from '../validation/carValidation.js';
import { uploadFileToCloudinary, deleteFileFromCloudinary } from '../utils/cloudinaryHelper.js';
import { getPagination, getPaginationResult } from '../utils/pagination.js'; 

//----------Create a new car (Admin only)----------

export const createCar = async (req, res) => {
  try {

    const { error } = createCarValidationSchema.validate(req.body);
    if (error) {
      return sendResponse(res, 400, false, error.details[0].message);
    }

    if (!req.file) {
      return sendResponse(res, 400, false, "Car image is required");
    }

    const { name, brand, model, monthlySubscriptionPrice, registrationNumber } = req.body;


    const existingCar = await Car.findOne({ registrationNumber });
    if (existingCar) {
      return sendResponse(res, 400, false, "Car with this registration number already exists");
    }

    const uploadResult = await uploadFileToCloudinary(req.file.buffer, 'car-rental-cars');


    const car = await Car.create({
      name,
      brand,
      model,
      monthlySubscriptionPrice,
      registrationNumber,
      image: uploadResult.secure_url,
    });

    return sendResponse(res, 201, true, "Car added successfully", car);

  } catch (error) {
    console.error("CREATE CAR ERROR =>", error);
    return sendResponse(res, 500, false, "Internal Server Error while adding car");
  }
};


//---------------Get all cars--------------------
export const getAllCars = async (req, res) => {
  try {
    const { search, brand, isAvailable } = req.query;
    let query = {};

    // 1. Advanced Search Logic
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }
    if (brand) query.brand = { $regex: brand, $options: 'i' };
    if (isAvailable !== undefined) {
      query.isAvailable = isAvailable === 'true' || isAvailable === true;
    }

    const { page, limit, skip } = getPagination(req.query);

    const cars = await Car.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    
    const totalCars = await Car.countDocuments(query);

    
    const paginationMetadata = getPaginationResult(totalCars, page, limit);

    return sendResponse(res, 200, true, "Cars fetched successfully", {
      ...paginationMetadata,
      cars,
    });
  } catch (error) {
    console.error("GET CARS ERROR =>", error);
    return sendResponse(res, 500, false, "Internal Server Error while fetching cars");
  }
};


//---------------Update a car (Admin only)-------------
// @route   PUT /api/cars/:id
// @access  Private/Admin
export const updateCar = async (req, res) => {
  try {
    const { error } = updateCarValidationSchema.validate(req.body);
    if (error) return sendResponse(res, 400, false, error.details[0].message);

    const car = await Car.findById(req.params.id);
    if (!car) return sendResponse(res, 404, false, "Car not found");

    if (req.file) {
      await deleteFileFromCloudinary(car.image);
      const uploadResult = await uploadFileToCloudinary(req.file.buffer, 'car-rental-cars');
      car.image = uploadResult.secure_url;
    }

    if (req.body.name) car.name = req.body.name;
    if (req.body.brand) car.brand = req.body.brand;
    if (req.body.model) car.model = req.body.model;
    if (req.body.monthlySubscriptionPrice) car.monthlySubscriptionPrice = req.body.monthlySubscriptionPrice;
    if (req.body.registrationNumber) car.registrationNumber = req.body.registrationNumber;
    if (req.body.isAvailable !== undefined) car.isAvailable = req.body.isAvailable;

    const updatedCar = await car.save();
    return sendResponse(res, 200, true, "Car updated successfully", updatedCar);
  } catch (error) {
    console.error("UPDATE CAR ERROR =>", error);
    return sendResponse(res, 500, false, "Internal Server Error while updating car");
  }
};

//--------Delete a car (Admin only)----------

export const deleteCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return sendResponse(res, 404, false, "Car not found");

    await deleteFileFromCloudinary(car.image);
    await car.deleteOne();

    return sendResponse(res, 200, true, "Car deleted successfully");
  } catch (error) {
    console.error("DELETE CAR ERROR =>", error);
    return sendResponse(res, 500, false, "Internal Server Error while deleting car");
  }
};