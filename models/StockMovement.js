import mongoose from 'mongoose';

const stockMovementSchema = new mongoose.Schema({
  inventoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Inventory ID is required']
  },
  type: {
    type: String,
    enum: ['in', 'out', 'damage'],
    required: [true, 'Movement type is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: 1
  },
  reason: {
    type: String,
    required: [true, 'Reason is required'],
    trim: true
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  // Additional fields for enhanced tracking
  reference: {
    type: String,
    trim: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    trim: true
  },
  previousStock: {
    type: Number,
    required: true
  },
  newStock: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// Indexes for faster queries
stockMovementSchema.index({ inventoryId: 1, date: -1 });
stockMovementSchema.index({ type: 1 });
stockMovementSchema.index({ date: -1 });

const StockMovement = mongoose.model('StockMovement', stockMovementSchema);

export default StockMovement;
