import Product from '../models/Product.js';
import StockMovement from '../models/StockMovement.js';

//    Get dashboard statistics
//   GET /api/dashboard/stats
//  Private
export const getDashboardStats = async (req, res) => {
  try {
    // Total products
    const totalProducts = await Product.countDocuments();
    
    // Active products
    const activeProducts = await Product.countDocuments({ status: 'active' });
    
    // Low stock products
    const lowStockProducts = await Product.countDocuments({
      $expr: { $lte: ['$quantity', '$reorderLevel'] },
      status: 'active'
    });
    
    // Total inventory value
    const products = await Product.find({ status: 'active' });
    const totalValue = products.reduce((sum, product) => {
      return sum + (product.quantity * (product.unitPrice || 0));
    }, 0);
    
    // Recent movements (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentMovements = await StockMovement.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });
    
    // Stock in/out/damage counts
    const stockIn = await StockMovement.countDocuments({ type: 'in' });
    const stockOut = await StockMovement.countDocuments({ type: 'out' });
    const stockDamage = await StockMovement.countDocuments({ type: 'damage' });
    
    res.json({
      totalProducts,
      activeProducts,
      lowStockProducts,
      totalValue: totalValue.toFixed(2),
      recentMovements,
      movementTypes: {
        in: stockIn,
        out: stockOut,
        damage: stockDamage
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard stats' });
  }
};

//    Get stock movement trends
//   GET /api/dashboard/trends
//   Private
export const getStockTrends = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const movements = await StockMovement.aggregate([
      {
        $match: {
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            type: '$type'
          },
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    res.json(movements);
  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({ message: 'Server error fetching trends' });
  }
};

//   Get top performing SKUs
//   GET /api/dashboard/top-skus
//   Private
export const getTopSKUs = async (req, res) => {
  try {
    // Get all products with their total sold quantities
    const products = await Product.find({ status: 'active' });
    
    // Get sold quantities from stock movements
    const soldQuantities = await StockMovement.aggregate([
      {
        $match: { type: 'out' }
      },
      {
        $group: {
          _id: '$inventoryId',
          totalQuantity: { $sum: '$quantity' },
          movements: { $sum: 1 }
        }
      }
    ]);

    // Create a map of product IDs to sold quantities
    const soldMap = {};
    soldQuantities.forEach(item => {
      soldMap[item._id.toString()] = {
        totalQuantity: item.totalQuantity,
        movements: item.movements
      };
    });

    // Combine product data with sold quantities
    const topSKUs = products.map(product => ({
      _id: product._id,
      sku: product.sku,
      name: product.name,
      category: product.category,
      quantity: product.quantity,
      totalQuantity: soldMap[product._id.toString()]?.totalQuantity || 0,
      movements: soldMap[product._id.toString()]?.movements || 0
    }));

    // Sort by total sold quantity (descending)
    topSKUs.sort((a, b) => b.totalQuantity - a.totalQuantity);

    res.json(topSKUs);
  } catch (error) {
    console.error('Get top SKUs error:', error);
    res.status(500).json({ message: 'Server error fetching top SKUs' });
  }
};
