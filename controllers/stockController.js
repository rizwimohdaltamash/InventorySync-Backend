import StockMovement from '../models/StockMovement.js';
import Product from '../models/Product.js';

//     Get all stock movements
//     GET /api/stock-movements
//     Private
export const getStockMovements = async (req, res) => {
  try {
    const { type, inventoryId, startDate, endDate } = req.query;
    
    let query = {};
    
    if (type) query.type = type;
    if (inventoryId) query.inventoryId = inventoryId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const movements = await StockMovement.find(query)
      .populate('inventoryId', 'sku name category')
      .populate('performedBy', 'name email')
      .sort({ date: -1 });
    
    res.json(movements);
  } catch (error) {
    console.error('Get stock movements error:', error);
    res.status(500).json({ message: 'Server error fetching stock movements' });
  }
};

//     Create stock movement (IN/OUT/DAMAGE)
//     POST /api/stock-movements
//    Private
export const createStockMovement = async (req, res) => {
  try {
    const { inventoryId, type, quantity, reason, reference, notes } = req.body;

    // Validate input
    if (!inventoryId || !type || !quantity || !reason) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Get product
    const product = await Product.findById(inventoryId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const previousStock = product.quantity;
    let newStock;

    // Calculate new stock based on movement type
    switch (type) {
      case 'in':
        newStock = previousStock + quantity;
        product.totalIn = (product.totalIn || 0) + quantity;
        break;
      case 'out':
        if (previousStock < quantity) {
          return res.status(400).json({ message: 'Insufficient stock' });
        }
        newStock = previousStock - quantity;
        product.totalOut = (product.totalOut || 0) + quantity;
        break;
      case 'damage':
        if (previousStock < quantity) {
          return res.status(400).json({ message: 'Insufficient stock' });
        }
        newStock = previousStock - quantity;
        product.totalOut = (product.totalOut || 0) + quantity;
        break;
      default:
        return res.status(400).json({ message: 'Invalid movement type' });
    }

    // Create stock movement record
    const movement = await StockMovement.create({
      inventoryId,
      type,
      quantity,
      reason,
      reference,
      notes,
      performedBy: req.user._id,
      previousStock,
      newStock,
      date: new Date()
    });

    // Update product stock and last movement date
    product.quantity = newStock;
    product.lastMovementDate = new Date();
    await product.save();

    // Populate and return
    await movement.populate('inventoryId', 'sku name category');
    await movement.populate('performedBy', 'name email');

    res.status(201).json(movement);
  } catch (error) {
    console.error('Create stock movement error:', error);
    res.status(500).json({ message: 'Server error creating stock movement' });
  }
};

//     Get stock movements by product
//     GET /api/stock-movements/product/:productId
//   Private
export const getProductStockHistory = async (req, res) => {
  try {
    const movements = await StockMovement.find({ inventoryId: req.params.productId })
      .populate('performedBy', 'name email')
      .sort({ date: -1 });
    
    res.json(movements);
  } catch (error) {
    console.error('Get product history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

//    Stock IN - Add inventory
//    POST /api/stock/in
//   Private
export const stockIn = async (req, res) => {
  try {
    const { inventoryId, quantity, reason, reference, notes } = req.body;

    // Validate input
    if (!inventoryId || !quantity || !reason) {
      return res.status(400).json({ message: 'Please provide inventoryId, quantity, and reason' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than 0' });
    }

    // Get product
    const product = await Product.findById(inventoryId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const previousStock = product.quantity;
    const newStock = previousStock + quantity;

    // Create stock movement record
    const movement = await StockMovement.create({
      inventoryId,
      type: 'in',
      quantity,
      reason,
      reference,
      notes,
      performedBy: req.user._id,
      previousStock,
      newStock,
      date: new Date()
    });

    // Update product: quantity, totalIn, lastMovementDate
    product.quantity = newStock;
    product.totalIn = (product.totalIn || 0) + quantity;
    product.lastMovementDate = new Date();
    await product.save();

    // Populate and return
    await movement.populate('inventoryId', 'sku name category');
    await movement.populate('performedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Stock added successfully',
      movement,
      updatedProduct: {
        _id: product._id,
        sku: product.sku,
        name: product.name,
        quantity: product.quantity,
        totalIn: product.totalIn,
        lastMovementDate: product.lastMovementDate
      }
    });
  } catch (error) {
    console.error('Stock IN error:', error);
    res.status(500).json({ message: 'Server error adding stock', error: error.message });
  }
};

//   Stock OUT - Remove inventory
//  POST /api/stock/out
//   Private
export const stockOut = async (req, res) => {
  try {
    const { inventoryId, quantity, reason, reference, notes } = req.body;

    // Validate input
    if (!inventoryId || !quantity || !reason) {
      return res.status(400).json({ message: 'Please provide inventoryId, quantity, and reason' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than 0' });
    }

    // Get product
    const product = await Product.findById(inventoryId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const previousStock = product.quantity;

    // Check sufficient stock
    if (previousStock < quantity) {
      return res.status(400).json({ 
        message: 'Insufficient stock',
        available: previousStock,
        requested: quantity
      });
    }

    const newStock = previousStock - quantity;

    // Create stock movement record
    const movement = await StockMovement.create({
      inventoryId,
      type: 'out',
      quantity,
      reason,
      reference,
      notes,
      performedBy: req.user._id,
      previousStock,
      newStock,
      date: new Date()
    });

    // Update product: quantity, totalOut, lastMovementDate
    product.quantity = newStock;
    product.totalOut = (product.totalOut || 0) + quantity;
    product.lastMovementDate = new Date();
    await product.save();

    // Populate and return
    await movement.populate('inventoryId', 'sku name category');
    await movement.populate('performedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Stock removed successfully',
      movement,
      updatedProduct: {
        _id: product._id,
        sku: product.sku,
        name: product.name,
        quantity: product.quantity,
        totalOut: product.totalOut,
        lastMovementDate: product.lastMovementDate
      }
    });
  } catch (error) {
    console.error('Stock OUT error:', error);
    res.status(500).json({ message: 'Server error removing stock', error: error.message });
  }
};

//     Stock DAMAGE - Report damaged inventory
//     POST /api/stock/damage
//    Private
export const stockDamage = async (req, res) => {
  try {
    const { inventoryId, quantity, reason, reference, notes } = req.body;

    // Validate input
    if (!inventoryId || !quantity || !reason) {
      return res.status(400).json({ message: 'Please provide inventoryId, quantity, and reason' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than 0' });
    }

    // Get product
    const product = await Product.findById(inventoryId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const previousStock = product.quantity;

    // Check sufficient stock
    if (previousStock < quantity) {
      return res.status(400).json({ 
        message: 'Insufficient stock to report as damaged',
        available: previousStock,
        requested: quantity
      });
    }

    const newStock = previousStock - quantity;

    // Create stock movement record
    const movement = await StockMovement.create({
      inventoryId,
      type: 'damage',
      quantity,
      reason,
      reference,
      notes,
      performedBy: req.user._id,
      previousStock,
      newStock,
      date: new Date()
    });

    // Update product: quantity, totalOut (damage counts as out), lastMovementDate
    product.quantity = newStock;
    product.totalOut = (product.totalOut || 0) + quantity;
    product.lastMovementDate = new Date();
    await product.save();

    // Populate and return
    await movement.populate('inventoryId', 'sku name category');
    await movement.populate('performedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Damage reported successfully',
      movement,
      updatedProduct: {
        _id: product._id,
        sku: product.sku,
        name: product.name,
        quantity: product.quantity,
        totalOut: product.totalOut,
        lastMovementDate: product.lastMovementDate
      }
    });
  } catch (error) {
    console.error('Stock DAMAGE error:', error);
    res.status(500).json({ message: 'Server error reporting damage', error: error.message });
  }
};
