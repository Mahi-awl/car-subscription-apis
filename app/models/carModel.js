import mongoose from 'mongoose';

const carSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    monthlySubscriptionPrice: {
      type: Number,
      required: true,
    },

    image: {
      type: String, 
      required: true,
    },
    registrationNumber: {
      type: String,
      required: true,
      unique: true, 
      trim: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    }
  },
  {
    timestamps: true, 
  }
);

const Car = mongoose.model('Car', carSchema);

export default Car;