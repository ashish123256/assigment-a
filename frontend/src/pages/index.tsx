import { useState } from 'react';
import Head from 'next/head';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Types
interface InventoryItem {
  id: number;
  product_name: string;
  category: string;
  price: number;
  quantity: number;
  supplier: string;
  city: string;
}

interface SearchParams {
  searchQuery: string;
  category: string;
  minPrice: string;
  maxPrice: string;
}

interface CategoriesResponse {
  categories: string[];
}

interface SearchResponse {
  success?: boolean;
  error?: string;
  results: InventoryItem[];
}

// API functions
const fetchCategories = async (): Promise<string[]> => {
  const { data } = await axios.get<CategoriesResponse>(`${API_URL}/categories`);
  return data.categories || [];
};

const searchInventory = async (params: SearchParams): Promise<InventoryItem[]> => {
  const queryParams = new URLSearchParams();
  if (params.searchQuery) queryParams.append('q', params.searchQuery);
  if (params.category && params.category !== 'all') queryParams.append('category', params.category);
  if (params.minPrice) queryParams.append('minPrice', params.minPrice);
  if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice);

  const { data } = await axios.get<SearchResponse>(`${API_URL}/search?${queryParams.toString()}`);
  
  if (data.success === false) {
    throw new Error(data.error || 'Search failed');
  }
  
  return data.results || [];
};

export default function Home() {
  // Form state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [category, setCategory] = useState<string>('all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  
  // Search params state (triggers API call)
  const [searchParams, setSearchParams] = useState<SearchParams>({
    searchQuery: '',
    category: 'all',
    minPrice: '',
    maxPrice: ''
  });
  
  const [validationError, setValidationError] = useState<string>('');

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Search inventory with React Query
  const { 
    data: results = [], 
    isLoading, 
    error,
    isFetching 
  } = useQuery({
    queryKey: ['inventory', searchParams],
    queryFn: () => searchInventory(searchParams),
    staleTime: 30 * 1000, // 30 seconds
    retry: 1,
  });

  // Handle search
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Validate price range
    if (minPrice && maxPrice && parseFloat(minPrice) > parseFloat(maxPrice)) {
      setValidationError('Minimum price cannot be greater than maximum price');
      return;
    }

    setValidationError('');
    setSearchParams({
      searchQuery,
      category,
      minPrice,
      maxPrice
    });
  };

  // Reset all filters and show all products
  const handleReset = () => {
    setSearchQuery('');
    setCategory('all');
    setMinPrice('');
    setMaxPrice('');
    setValidationError('');
    
    // Reset to show all products
    setSearchParams({
      searchQuery: '',
      category: 'all',
      minPrice: '',
      maxPrice: ''
    });
  };

  // Format price
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const errorMessage = validationError || (error as Error)?.message;
  const showResults = !isLoading && !isFetching;

  return (
    <>
      <Head>
        <title>Inventory Search - 2026 Edition</title>
        <meta name="description" content="Search and discover surplus inventory from multiple suppliers" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-900 to-slate-900">
        {/* Header */}
        <header className="bg-linear-to-r from-slate-900 to-blue-900 shadow-2xl border-b border-blue-500/30 sticky top-0 z-10 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-linear-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/50 transform hover:scale-105 transition-transform ring-2 ring-blue-400/50">
                <span className="text-3xl">🔍</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-linear-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
                  Inventory Search
                </h1>
                <p className="text-blue-200 text-sm mt-1">
                  Search surplus inventory across multiple suppliers · 2026 Edition
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search Form */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-500/30 p-8 mb-8 hover:border-blue-400/50 transition-all">
            <form onSubmit={handleSearch} className="space-y-6">
              {/* Search Input */}
              <div>
                <label htmlFor="search" className="block text-sm font-semibold text-blue-300 mb-3">
                  Search Product Name
                </label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 text-xl pointer-events-none group-focus-within:text-cyan-400 transition-colors">
                    🔎
                  </span>
                  <input
                    id="search"
                    type="text"
                    placeholder="Enter product name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-900/70 border border-blue-500/30 text-white placeholder-slate-400 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all hover:border-blue-400/50 font-medium"
                  />
                </div>
              </div>

              {/* Filters Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Category Dropdown */}
                <div>
                  <label htmlFor="category" className="block text-sm font-semibold text-blue-300 mb-3">
                    Category
                  </label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none group-focus-within:text-cyan-400 transition-colors">
                      📦
                    </span>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full pl-12 pr-10 py-4 bg-slate-900/70 border border-blue-500/30 text-white rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all appearance-none cursor-pointer hover:border-blue-400/50 font-medium"
                    >
                      <option value="all" className="bg-slate-900">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat} className="bg-slate-900">
                          {cat}
                        </option>
                      ))}
                    </select>
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none">
                      ▼
                    </span>
                  </div>
                </div>

                {/* Min Price */}
                <div>
                  <label htmlFor="minPrice" className="block text-sm font-semibold text-blue-300 mb-3">
                    Min Price ($)
                  </label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 font-bold pointer-events-none group-focus-within:text-cyan-400 transition-colors">
                      $
                    </span>
                    <input
                      id="minPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full pl-10 pr-4 py-4 bg-slate-900/70 border border-blue-500/30 text-white placeholder-slate-400 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all hover:border-blue-400/50 font-medium"
                    />
                  </div>
                </div>

                {/* Max Price */}
                <div>
                  <label htmlFor="maxPrice" className="block text-sm font-semibold text-blue-300 mb-3">
                    Max Price ($)
                  </label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 font-bold pointer-events-none group-focus-within:text-cyan-400 transition-colors">
                      $
                    </span>
                    <input
                      id="maxPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="999.99"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full pl-10 pr-4 py-4 bg-slate-900/70 border border-blue-500/30 text-white placeholder-slate-400 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all hover:border-blue-400/50 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button
                  type="submit"
                  disabled={isLoading || isFetching}
                  className="flex-1 bg-linear-to-r from-blue-600 via-cyan-500 to-blue-600 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/50 hover:shadow-cyan-400/50 focus:ring-4 focus:ring-cyan-400/50 transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-blue-500/50"
                >
                  <span className="flex items-center justify-center gap-3">
                    {(isLoading || isFetching) ? (
                      <>
                        <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Searching...
                      </>
                    ) : (
                      <>
                        🔍 Search
                      </>
                    )}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isLoading || isFetching}
                  className="flex-1 sm:flex-initial bg-slate-700/70 text-cyan-300 px-8 py-4 rounded-xl font-bold text-lg border border-blue-500/30 hover:bg-slate-600/70 hover:border-cyan-400/50 focus:ring-4 focus:ring-cyan-400/50 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  🔄 Reset
                </button>
              </div>
            </form>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-900/50 backdrop-blur-sm border-l-4 border-red-500 text-red-200 p-5 rounded-xl mb-8 shadow-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">❌</span>
                <p className="font-semibold text-lg">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {(isLoading || isFetching) && (
            <div className="bg-blue-900/30 backdrop-blur-sm border border-blue-500/30 rounded-3xl p-16 text-center shadow-xl">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-400/30 border-t-cyan-400 mb-6"></div>
              <p className="text-cyan-300 font-bold text-xl">Searching inventory...</p>
            </div>
          )}

          {/* Results Section */}
          {showResults && (
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-500/30 overflow-hidden">
              {/* Results Header */}
              <div className="bg-linear-to-r from-blue-600 to-cyan-500 px-8 py-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Search Results</h2>
                  <span className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full text-base font-bold shadow-lg">
                    {results.length} {results.length === 1 ? 'item' : 'items'} found
                  </span>
                </div>
              </div>

              {/* No Results State */}
              {results.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="text-7xl mb-6 opacity-50">📭</div>
                  <h3 className="text-2xl font-bold text-blue-300 mb-3">No results found</h3>
                  <p className="text-blue-200">Try adjusting your search filters or search terms</p>
                </div>
              ) : (
                /* Results Table - Desktop */
                <>
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-900/70 border-b border-blue-500/30">
                        <tr>
                          <th className="px-8 py-5 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-8 py-5 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-8 py-5 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">
                            Price
                          </th>
                          <th className="px-8 py-5 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-8 py-5 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">
                            Supplier
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-blue-500/20">
                        {results.map((item, index) => (
                          <tr 
                            key={item.id || index} 
                            className="hover:bg-blue-900/30 transition-colors"
                          >
                            <td className="px-8 py-5">
                              <div className="font-bold text-white text-lg">{item.product_name}</div>
                            </td>
                            <td className="px-8 py-5">
                              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                                {item.category}
                              </span>
                            </td>
                            <td className="px-8 py-5">
                              <div className="text-xl font-black text-emerald-400">
                                {formatPrice(item.price)}
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <div className="text-blue-100 text-base">
                                <span className="font-bold text-white">{item.quantity}</span> units
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <div className="font-bold text-white text-base">{item.supplier}</div>
                              <div className="text-sm text-blue-300 flex items-center gap-1 mt-1">
                                📍 {item.city}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Results Cards - Mobile */}
                  <div className="md:hidden divide-y divide-blue-500/20">
                    {results.map((item, index) => (
                      <div 
                        key={item.id || index} 
                        className="p-6 hover:bg-blue-900/30 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-bold text-white text-lg flex-1">
                            {item.product_name}
                          </h3>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 ml-2">
                            {item.category}
                          </span>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-blue-300 font-semibold">Price:</span>
                            <span className="text-xl font-black text-emerald-400">
                              {formatPrice(item.price)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-blue-300 font-semibold">Quantity:</span>
                            <span className="text-sm font-bold text-white">
                              {item.quantity} units
                            </span>
                          </div>
                          <div className="pt-3 border-t border-blue-500/20">
                            <div className="text-base font-bold text-white">{item.supplier}</div>
                            <div className="text-sm text-blue-300 flex items-center gap-1 mt-1">
                              📍 {item.city}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-slate-900/50 backdrop-blur-sm border-t border-blue-500/30 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-blue-300 text-sm">
            <p className="font-medium">© 2026 Inventory Search. All rights reserved.</p>
          </div>
        </footer>
      </div>

      <style jsx global>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .bg-size-200 {
          background-size: 200% auto;
        }
        
        .bg-pos-0 {
          background-position: 0% center;
        }
        
        .bg-pos-100:hover {
          background-position: 100% center;
        }
      `}</style>
    </>
  );
}