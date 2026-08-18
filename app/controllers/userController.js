import { sendEmail } from '../utils/sendEmail.js';
import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import sendResponse from '../utils/responseHandler.js';
import { registerValidationSchema, loginValidationSchema, updateProfileValidationSchema } from '../validation/userValidation.js';
import jwt from 'jsonwebtoken';
import { uploadFileToCloudinary, deleteFileFromCloudinary } from '../utils/cloudinaryHelper.js';
import crypto from 'crypto';



//-------------Register---------//

export const registerUser = async (req, res) => {
  try {
    const { error } = registerValidationSchema.validate(req.body);
    
    if (error) {
      return sendResponse(res, 400, false, error.details[0].message);
    }

    const { name, email, contactNumber, password, address } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return sendResponse(res, 400, false, "User already exists with this email");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      contactNumber,
      password: hashedPassword,
      address,
    });

    if (user) {
      const userData = {
        id: user._id,
        name: user.name,
        email: user.email,
        contactNumber: user.contactNumber,
        address: user.address
      };
      return sendResponse(res, 201, true, "User registered successfully", userData);
    } else {
      return sendResponse(res, 400, false, "Invalid user data");
    }

  } catch (error) {
    console.error("REGISTER ERROR =>", error);
    return sendResponse(res, 500, false, "Internal Server Error");
  }
};


// -------------Login----------------//
export const loginUser = async (req, res) => {
  try {
    const { error } = loginValidationSchema.validate(req.body);
    
    if (error) {
      return sendResponse(res, 400, false, error.details[0].message);
    }

    const { email, password } = req.body;
    
    const user = await User.findOne({ email }).select("+password");

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
      });

      const userData = {
        id: user._id,
        name: user.name,
        email: user.email,
        contactNumber: user.contactNumber,
        address: user.address,
        token: token
      };
      return sendResponse(res, 200, true, "Login Successful! ", userData);
    } else {
      return sendResponse(res, 401, false, "Invalid email or password");
    }
  } catch (error) {
    console.error("LOGIN ERROR =>", error);
    return sendResponse(res, 500, false, "Internal Server Error during login");
  }
};

//------------Get user profile---------------//

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      const userData = {
        id: user._id,
        name: user.name,
        email: user.email,
        contactNumber: user.contactNumber,
        address: user.address,
        documents: user.documents,
        role: user.role
      };
      return sendResponse(res, 200, true, "User profile fetched successfully", userData);
    } else {
      return sendResponse(res, 404, false, "User not found");
    }
  } catch (error) {
    console.error("PROFILE ERROR =>", error);
    return sendResponse(res, 500, false, "Internal Server Error while fetching profile");
  }
};


//------------Get all users (Admin only)---------------//

export const getAllUsers = async (req, res) => {
  try {
    // Database se saare users fetch karega aur password hide kar dega
    const users = await User.find({}).select('-password');

    return sendResponse(res, 200, true, "All users fetched successfully", users);
  } catch (error) {
    console.error("GET ALL USERS ERROR =>", error);
    return sendResponse(res, 500, false, "Internal Server Error while fetching all users");
  }
};


//------------Update user profile & upload multiple documents------------//

export const updateUserProfile = async (req, res) => {
  try {
    const { error } = updateProfileValidationSchema.validate(req.body);
    if (error) {
      return sendResponse(res, 400, false, error.details[0].message);
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return sendResponse(res, 404, false, "User not found");
    }

    if (req.body.name) user.name = req.body.name;
    if (req.body.contactNumber) user.contactNumber = req.body.contactNumber;
    if (req.body.address) user.address = req.body.address;

    if (req.files && req.files.length > 0) {
      if (user.documents && user.documents.length > 0) {
        const deletePromises = user.documents.map(oldImageUrl => deleteFileFromCloudinary(oldImageUrl));
        await Promise.all(deletePromises); 
        user.documents = []; 
      }

      const uploadPromises = req.files.map(file => uploadFileToCloudinary(file.buffer, 'car-rental-documents'));
      const uploadResults = await Promise.all(uploadPromises); 
      
      uploadResults.forEach(result => {
        user.documents.push(result.secure_url);
      });
    }

    const updatedUser = await user.save();

    const userData = {
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      contactNumber: updatedUser.contactNumber,
      address: updatedUser.address,
      documents: updatedUser.documents, 
      role: updatedUser.role
    };

    return sendResponse(res, 200, true, "Profile updated successfully", userData);

  } catch (error) {
    console.error("UPDATE PROFILE ERROR =>", error);
    return sendResponse(res, 500, false, "Internal Server Error while updating profile");
  }
};


//--------------------Change Password---------------------//
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return sendResponse(res, 400, false, "Please provide old and new passwords");
    }

    if (!req.user || !req.user._id) {
      return sendResponse(res, 401, false, "Not authorized, user not found in request");
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return sendResponse(res, 404, false, "User not found in database");
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return sendResponse(res, 400, false, "Incorrect old password");
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    await user.save({ validateBeforeSave: false });

    return sendResponse(res, 200, true, "Password changed successfully");
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR =>", error);
    return sendResponse(res, 500, false, error.message || "Error changing password");
  }
};


//--------------------Forgot Password (with Nodemailer)---------------------//
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return sendResponse(res, 404, false, "User not found with this email");
    }

    const resetToken = crypto.randomBytes(32).toString('hex');


    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; 
    await user.save({ validateBeforeSave: false });

    const resetUrl = `http://localhost:5000/api/users/reset-password/${resetToken}`;
    
    const message = `You are receiving this email because you (or someone else) have requested the reset of a password.\n\nPlease click on the following link to reset your password:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.`;

    try {
      
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Token / Link',
        message,
      });

      return sendResponse(res, 200, true, "Password reset link sent to email successfully!");
    } catch (emailError) {
      console.error("EMAIL SEND ERROR =>", emailError);
      
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return sendResponse(res, 500, false, "Email could not be sent. Please check credentials.");
    }
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR =>", error);
    return sendResponse(res, 500, false, "Internal Server Error");
  }
};



//-------------------Reset Password-----------------//
export const resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ 
      resetPasswordToken: hashedToken, 
      resetPasswordExpire: { $gt: Date.now() } 
    });

    if (!user) return sendResponse(res, 400, false, "Invalid or expired token");

    user.password = await bcrypt.hash(req.body.newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return sendResponse(res, 200, true, "Password reset successfully");
  } catch (error) {
    return sendResponse(res, 500, false, "Server Error");
  }
};