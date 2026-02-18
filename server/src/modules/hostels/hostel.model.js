const mongoose = require('mongoose');

const hostelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Hostel name is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    totalRooms: {
      type: Number,
      required: [true, 'Total rooms is required'],
      min: 1,
    },
    imageUrl: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

hostelSchema.index({ name: 1 });

module.exports = mongoose.model('Hostel', hostelSchema);
