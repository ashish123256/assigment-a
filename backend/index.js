const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

// Load inventory Data

const inventoryData = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'data', 'inventory.json'), 'utf-8')
);

// Helper function: Case-insensitive partial match
const matchesQuery = (text, query) => {
    if (!query) return true;
     
    return text.toLowerCase().includes(query.toLowerCase());
}



// Helper function: Get unique categories
const getCategories = () => {
  const categories = [...new Set(inventoryData.map(item => item.category))];
  return categories.sort();
};


/**
 * GET /search
 * Search inventory with multiple filters
 * Query params:
 *  - q: product name (partial, case-insensitive)
 *  - category: exact category match
 *  - minPrice: minimum price (inclusive)
 *  - maxPrice: maximum price (inclusive)
 */

app.get('/search', (req, res) => {
  try {
    const { q, category, minPrice, maxPrice } = req.query;

    // Start with all inventory
    let results = [...inventoryData];

    // Filter by product name (partial, case-insensitive)
    if (q) {
      results = results.filter(item => matchesQuery(item.product_name, q));
    }

    // Filter by category (exact match, case-insensitive)
    if (category && category !== 'all') {
      results = results.filter(
        item => item.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by minimum price
    if (minPrice !== undefined && minPrice !== '') {
      const min = parseFloat(minPrice);
      if (!isNaN(min)) {
        results = results.filter(item => item.price >= min);
      }
    }

    // Filter by maximum price
    if (maxPrice !== undefined && maxPrice !== '') {
      const max = parseFloat(maxPrice);
      if (!isNaN(max)) {
        results = results.filter(item => item.price <= max);
      }
    }

    // Validate price range
    if (minPrice && maxPrice) {
      const min = parseFloat(minPrice);
      const max = parseFloat(maxPrice);
      if (!isNaN(min) && !isNaN(max) && min > max) {
        return res.status(400).json({
          success: false,
          error: 'Invalid price range: minPrice cannot be greater than maxPrice',
          results: []
        });
      }
    }

    // Return results
    res.json({
      success: true,
      count: results.length,
      query: {
        q: q || null,
        category: category || null,
        minPrice: minPrice || null,
        maxPrice: maxPrice || null
      },
      results: results
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      results: []
    });
  }
});

/**
 * GET /categories
 * Get all unique categories
 */
app.get('/categories', (req, res) => {
  try {
    const categories = getCategories();
    res.json({
      success: true,
      categories: categories
    });
  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      categories: []
    });
  }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})



