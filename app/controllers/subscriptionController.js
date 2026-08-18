import Subscription from '../models/subscriptionModel.js';
import Car from '../models/carModel.js';
import User from '../models/userModel.js';
import sendResponse from '../utils/responseHandler.js';
import { createSubscriptionValidationSchema, updateStatusValidationSchema } from '../validation/subscriptionValidation.js';
import { razorpay } from '../utils/razorpay.js';
import crypto from 'crypto';
import { getPagination, getPaginationResult } from '../utils/pagination.js'; 
import { sendPushNotification } from '../utils/sendPushNotification.js';

//  -------------Create Subscription & Razorpay Order---------------

export const createSubscription = async (req, res) => {
  try {
    const { error } = createSubscriptionValidationSchema.validate(req.body);
    if (error) return sendResponse(res, 400, false, error.details[0].message);

    const { carId, durationMonths } = req.body;

    const car = await Car.findById(carId);
    if (!car) return sendResponse(res, 404, false, "Car not found");

    if (!car.isAvailable) {
      return sendResponse(res, 400, false, "This car is currently unavailable or already subscribed");
    }

    const userProfile = await User.findById(req.user._id);
    if (!userProfile) {
      return sendResponse(res, 404, false, "User not found");
    }

    if (!userProfile.address) {
      return sendResponse(res, 400, false, "Please add an address in your profile first");
    }

    const totalAmount = car.monthlySubscriptionPrice * durationMonths;
    
    const options = {
      amount: totalAmount * 100,
      currency: "INR",
      receipt: `receipt_sub_${Date.now()}`
    };

    const razorpayOrder = await razorpay.orders.create(options);

    let subscription = await Subscription.create({
      user: req.user._id,
      car: carId,
      address: userProfile.address, 
      durationMonths,
      totalAmount,
      razorpayOrderId: razorpayOrder.id,
      paymentStatus: "pending",
      status: "pending",
    });
    subscription = await subscription.populate([
      { path: 'user', select: 'name email role contactNumber address role' },
      { path: 'car', select: 'name brand monthlySubscriptionPrice' }
    ]);
 await sendPushNotification({
      token: userProfile.fcmToken,

      title: "Subscription Created",

      body: `Your subscription for ${car.name} has been created. Please complete the payment.`,

      data: {
        type: "subscription_created",
        subscriptionId: subscription._id,
        orderId: razorpayOrder.id,
        carId: car._id,
      },
    });
    
   
    const subscriptionResponse = subscription.toObject();
    delete subscriptionResponse.address; 
    return sendResponse(res, 201, true, "Subscription & Payment Order created successfully.", {
      subscription: subscriptionResponse, 
      razorpayOrder,
    });


  } catch (error) {
    console.error("CREATE SUBSCRIPTION ERROR =>", error);
    return sendResponse(res, 500, false, "Internal Server Error while creating subscription");
  }
};


//---------------Verify Payment After Checkout---------------
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, subscriptionId } = req.body;

    // (Razorpay Security Check)
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return sendResponse(res, 400, false, "Payment verification failed. Invalid signature!");
    }

    
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) return sendResponse(res, 404, false, "Subscription not found");

    subscription.paymentStatus = "completed";
    subscription.status = "active";
    subscription.razorpayPaymentId = razorpay_payment_id;
    await subscription.save();

    const car = await Car.findById(subscription.car);
    if (car) {
      car.isAvailable = false;
      await car.save();
    }

    return sendResponse(res, 200, true, "Payment verified and subscription activated successfully!", subscription);
  } catch (error) {
    console.error("VERIFY PAYMENT ERROR =>", error);
    return sendResponse(res, 500, false, "Internal Server Error during payment verification");
  }
};

//---------------Get all subscriptions---------------

export const getSubscriptions = async (req, res) => {
  try {

    const { page, limit, skip } = getPagination(req.query);
    
    let subscriptions;
    let totalSubscriptions;

    if (req.user.role === 'admin') {

      totalSubscriptions = await Subscription.countDocuments();
      subscriptions = await Subscription.find({})
        .populate('user', 'name email contactNumber address role')
        .populate('car', 'name brand registrationNumber monthlySubscriptionPrice image')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    } else {

      totalSubscriptions = await Subscription.countDocuments({ user: req.user._id });
      subscriptions = await Subscription.find({ user: req.user._id })
        .populate('car', 'name brand registrationNumber monthlySubscriptionPrice image')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    }

    
    const paginationMetadata = getPaginationResult(totalSubscriptions, page, limit);

    
    return sendResponse(res, 200, true, "Subscriptions fetched successfully", {
      ...paginationMetadata,
      subscriptions,
    });
  } catch (error) {
    console.error("GET SUBSCRIPTIONS ERROR =>", error);
    return sendResponse(res, 500, false, "Internal Server Error while fetching subscriptions");
  }
};


//---------------Update subscription status (Admin only)---------------

export const updateSubscriptionStatus = async (req, res) => {
  try {
    const { error } = updateStatusValidationSchema.validate(req.body);
    if (error) return sendResponse(res, 400, false, error.details[0].message);

    const { status } = req.body;
    const subscription = await Subscription.findById(req.params.id);
    
    if (!subscription) return sendResponse(res, 404, false, "Subscription not found");

    if (status === 'active' && subscription.status !== 'active') {
      const car = await Car.findById(subscription.car);
      if (car) {
        car.isAvailable = false;
        await car.save();
      }
    }

    if ((status === 'completed' || status === 'rejected') && subscription.status === 'active') {
      const car = await Car.findById(subscription.car);
      if (car) {
        car.isAvailable = true;
        await car.save();
      }
    }

    subscription.status = status;
    const updatedSubscription = await subscription.save();

    return sendResponse(res, 200, true, `Subscription status updated to ${status}`, updatedSubscription);
  } catch (error) {
    console.error("UPDATE STATUS ERROR =>", error);
    return sendResponse(res, 500, false, "Internal Server Error while updating subscription status");
  }
};