import { useState, useEffect } from 'react';
import { apiService, StockSearchResult, WishlistItem, StockQuote } from '../services/api';
import { Search, Plus, Trash2, Activity } from 'lucide-react';

export default function Trading() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [selectedStock, setSelectedStock] = useState<StockQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [tradeForm, setTradeForm] = useState({
    stock_symbol: '',
    action: 'buy' as 'buy' | 'sell',
    quantity: 1,
    price: undefined as number | undefined,
  });

  const [wishlistForm, setWishlistForm] = useState({
    target_price: undefined as number | undefined,
    notes: '',
  });

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      const data = await apiService.getWishlist();
      setWishlist(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wishlist');
    }
  };

  const searchStocks = async () => {
    if (searchQuery.length < 2) return;
    
    setLoading(true);
    try {
      const result = await apiService.searchStocks(searchQuery);
      setSearchResults(result.stocks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search stocks');
    } finally {
      setLoading(false);
    }
  };

  const getStockQuote = async (symbol: string) => {
    try {
      const quote = await apiService.getStockQuote(symbol);
      setSelectedStock(quote);
      setTradeForm(prev => ({ ...prev, stock_symbol: symbol }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get stock quote');
    }
  };

  const executeManualTrade = async () => {
    if (!tradeForm.stock_symbol || tradeForm.quantity <= 0) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const result = await apiService.executeManualTrade(tradeForm);
      setSuccess(result.message);
      setTradeForm({
        stock_symbol: '',
        action: 'buy',
        quantity: 1,
        price: undefined,
      });
      setSelectedStock(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute trade');
    }
  };

  const addToWishlist = async (stockSymbol: string) => {
    try {
      const result = await apiService.addToWishlist(
        stockSymbol,
        wishlistForm.target_price,
        wishlistForm.notes
      );
      setSuccess(result.message);
      setWishlistForm({ target_price: undefined, notes: '' });
      loadWishlist();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to wishlist');
    }
  };

  const removeFromWishlist = async (wishlistId: number) => {
    try {
      const result = await apiService.removeFromWishlist(wishlistId);
      setSuccess(result.message);
      loadWishlist();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove from wishlist');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Trading & Research</h1>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="text-sm text-green-700">{success}</div>
        </div>
      )}

      {/* Stock Search */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Stock Search & Research
          </h3>
          
          <div className="flex space-x-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search stocks by symbol or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchStocks()}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={searchStocks}
              disabled={loading || searchQuery.length < 2}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((stock) => (
                <div key={stock.symbol} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{stock.symbol}</h4>
                      <p className="text-sm text-gray-500">{stock.name}</p>
                      <p className="text-xs text-gray-400">{stock.exchange}</p>
                      {stock.current_price && (
                        <p className="text-lg font-semibold text-green-600 mt-2">
                          ₹{stock.current_price.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => getStockQuote(stock.symbol)}
                        className="text-indigo-600 hover:text-indigo-900 text-sm"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => addToWishlist(stock.symbol)}
                        className="text-green-600 hover:text-green-900"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stock Details & Manual Trading */}
      {selectedStock && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              {selectedStock.symbol} - Stock Details & Trading
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Stock Performance */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Performance</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Current Price:</span>
                    <span className="font-semibold">₹{selectedStock.current_price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Day Change:</span>
                    <span className={`font-semibold ${selectedStock.day_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedStock.day_change >= 0 ? '+' : ''}₹{selectedStock.day_change.toFixed(2)} 
                      ({selectedStock.day_change_percent.toFixed(2)}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Volume:</span>
                    <span className="font-semibold">{selectedStock.volume.toLocaleString()}</span>
                  </div>
                  {selectedStock.market_cap && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Market Cap:</span>
                      <span className="font-semibold">₹{(selectedStock.market_cap / 10000000).toFixed(2)}Cr</span>
                    </div>
                  )}
                  {selectedStock.pe_ratio && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">P/E Ratio:</span>
                      <span className="font-semibold">{selectedStock.pe_ratio.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Manual Trading Form */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Place Order</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Action</label>
                    <select
                      value={tradeForm.action}
                      onChange={(e) => setTradeForm(prev => ({ ...prev, action: e.target.value as 'buy' | 'sell' }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="buy">Buy</option>
                      <option value="sell">Sell</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={tradeForm.quantity}
                      onChange={(e) => setTradeForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Price (Leave empty for market price)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={tradeForm.price || ''}
                      onChange={(e) => setTradeForm(prev => ({ ...prev, price: parseFloat(e.target.value) || undefined }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  
                  <button
                    onClick={executeManualTrade}
                    className={`w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                      tradeForm.action === 'buy' 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-red-600 hover:bg-red-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    {tradeForm.action === 'buy' ? 'Buy' : 'Sell'} {tradeForm.quantity} shares
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wishlist */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            My Watchlist
          </h3>
          
          {wishlist.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {wishlist.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.stock_symbol}</h4>
                      {item.current_price && (
                        <p className="text-lg font-semibold text-green-600">
                          ₹{item.current_price.toFixed(2)}
                        </p>
                      )}
                      {item.target_price && (
                        <p className="text-sm text-gray-500">
                          Target: ₹{item.target_price.toFixed(2)}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-sm text-gray-400 mt-1">{item.notes}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Added: {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => getStockQuote(item.stock_symbol)}
                        className="text-indigo-600 hover:text-indigo-900 text-sm"
                      >
                        Trade
                      </button>
                      <button
                        onClick={() => removeFromWishlist(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">
              No stocks in your watchlist yet. Search for stocks above and add them to your watchlist.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
