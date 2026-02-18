const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student is required'],
    },
    visitorName: {
      type: String,
      required: [true, 'Visitor name is required'],
      trim: true,
    },
    visitorPhone: {
      type: String,
      trim: true,
      default: null,
    },
    relation: {
      type: String,
      trim: true,
      default: null,
    },
    purpose: {
      type: String,
      trim: true,
      default: null,
    },
    checkInAt: {
      type: Date,
      required: [true, 'Check-in time is required'],
    },
    checkOutAt: {
      type: Date,
      default: null,
    },
    loggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

visitorSchema.index({ studentId: 1 });
visitorSchema.index({ checkInAt: -1 });
visitorSchema.index({ checkOutAt: 1 });

module.exports = mongoose.model('Visitor', visitorSchema);
