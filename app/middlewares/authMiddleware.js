import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import sendResponse from '../utils/responseHandler.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password');
      return next(); 
    } catch (error) {
      console.error("TOKEN ERROR =>", error);
      return sendResponse(res, 401, false, "Not authorized, token failed or expired");
    }
  }

  if (!token) {
    return sendResponse(res, 401, false, "Not authorized, no token provided");
  }
};

//------------Admin Check Middleware-------------//
export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  } else {
    return sendResponse(res, 403, false, "Access denied. Admin strictly only.");
  }
};