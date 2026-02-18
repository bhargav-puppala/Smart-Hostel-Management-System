const mongoose = require('mongoose');
const { FEE_STATUS } = require('../../shared/constants');

const feeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: 0,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    paidDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(FEE_STATUS),
      default: FEE_STATUS.PENDING,
    },
    description: {
      type: String,
      trim: true,
      default: 'Hostel fee',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

feeSchema.index({ studentId: 1 });
feeSchema.index({ status: 1 });
feeSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Fee', feeSchema);
