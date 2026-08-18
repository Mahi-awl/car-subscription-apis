import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true, 
    },
    email: {
      type: String,
      required: true,
      unique: true, 
    },
    contactNumber: {
      type: String, 
      required: true,
    },
    address: {
      type: String,
      required: false, 
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    resetPasswordToken: {
        type: String,
        default: null
    },
      fcmToken: {
        type: String,
        default: null
    },
    resetPasswordExpire: {
        type: Date,
        default: null
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },

    documents: {
      type: [String], 
      default: [],
    }

  },
  {
    timestamps: true, 
  }
);
const User = mongoose.model('User', userSchema);

export default User;