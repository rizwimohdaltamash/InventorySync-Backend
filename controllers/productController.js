import Product from '../models/Product.js';

//   Get all products
//   GET /api/products
//  Private
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error fetching products' });
  }
};

//   Get single product
//   GET /api/products/:id
//   Private
export const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error fetching product' });
  }
};

//    Create new product
//    POST /api/products
//    Private
export const createProduct = async (req, res) => {
  try {
    const { sku, name, description, category, quantity, reorderLevel, unitPrice, supplier, location } = req.body;

    // Check if SKU exists
    const skuExists = await Product.findOne({ sku });
    if (skuExists) {
      return res.status(400).json({ message: 'Product with this SKU already exists' });
    }

    const product = await Product.create({
      sku,
      name,
      description,
      category,
      quantity: quantity || 0,
      reorderLevel: reorderLevel || 10,
      totalIn: 0,
      totalOut: 0,
      lastMovementDate: new Date(),
      unitPrice,
      supplier,
      location
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error creating product' });
  }
};

//    Update product
//    PUT /api/products/:id
//   Private
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(updatedProduct);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error updating product' });
  }
};

//    Delete product
//    DELETE /api/products/:id
//    Private
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product removed' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error deleting product' });
  }
};

//     Get low stock products
//    GET /api/products/low-stock
//    Private
export const getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({
      $expr: { $lte: ['$quantity', '$reorderLevel'] },
      status: 'active'
    });
    res.json(products);
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
