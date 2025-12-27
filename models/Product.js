import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  reorderLevel: {
    type: Number,
    required: true,
    default: 10,
    min: 0
  },
  totalIn: {
    type: Number,
    default: 0,
    min: 0
  },
  totalOut: {
    type: Number,
    default: 0,
    min: 0
  },
  lastMovementDate: {
    type: Date,
    default: Date.now
  },
  // Additional fields for enhanced functionality
  description: {
    type: String,
    trim: true
  },
  unitPrice: {
    type: Number,
    min: 0
  },
  supplier: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  weightValue: {
    type: Number,
    min: 0
  },
  weightUnit: {
    type: String,
    enum: ['kg', 'g', 'mg', 'lb', 'oz', 'ton', 'mm', 'cm', 'm', 'in', 'ft'],
    default: 'kg'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Index for faster queries
productSchema.index({ category: 1 });
productSchema.index({ status: 1 });

const Product = mongoose.model('Product', productSchema);

export default Product;
