import { useState, useEffect } from 'react';
import { apiService, BucketOrder } from '../services/api';
import { Plus, Calendar, DollarSign, TrendingUp, Package } from 'lucide-react';

export default function BucketTrading() {
  const [bucketOrders, setBucketOrders] = useState<BucketOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    total_capital: 0,
    scheduled_time: '',
    execution_type: 'market',
    stocks: [{ symbol: '', weight: 0, action: 'buy' }]
  });

  useEffect(() => {
    loadBucketOrders();
  }, []);

  const loadBucketOrders = async () => {
    setLoading(true);
    setError('');

    try {
      const orders = await apiService.getBucketOrders();
      setBucketOrders(orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bucket orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await apiService.createBucketOrder(formData);
      setShowCreateForm(false);
      setFormData({
        name: '',
        total_capital: 0,
        scheduled_time: '',
        execution_type: 'market',
        stocks: [{ symbol: '', weight: 0, action: 'buy' }]
      });
      loadBucketOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create bucket order');
    }
  };

  const addStock = () => {
    setFormData({
      ...formData,
      stocks: [...formData.stocks, { symbol: '', weight: 0, action: 'buy' }]
    });
  };

  const updateStock = (index: number, field: string, value: string | number) => {
    const updatedStocks = formData.stocks.map((stock, i) => 
      i === index ? { ...stock, [field]: value } : stock
    );
    setFormData({ ...formData, stocks: updatedStocks });
  };

  const removeStock = (index: number) => {
    const updatedStocks = formData.stocks.filter((_, i) => i !== index);
    setFormData({ ...formData, stocks: updatedStocks });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'executed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading bucket orders...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bucket Trading</h1>
            <p className="text-gray-600">Create and manage scheduled multi-stock orders</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Bucket Order
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create Bucket Order</h2>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Order Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Total Capital (₹)</label>
                <input
                  type="number"
                  value={formData.total_capital}
                  onChange={(e) => setFormData({ ...formData, total_capital: Number(e.target.value) })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Scheduled Time</label>
                <input
                  type="datetime-local"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Execution Type</label>
                <select
                  value={formData.execution_type}
                  onChange={(e) => setFormData({ ...formData, execution_type: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="market">Market Order</option>
                  <option value="limit">Limit Order</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Stocks</label>
                  <button
                    type="button"
                    onClick={addStock}
                    className="text-indigo-600 hover:text-indigo-800 text-sm"
                  >
                    + Add Stock
                  </button>
                </div>
                {formData.stocks.map((stock, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Symbol"
                      value={stock.symbol}
                      onChange={(e) => updateStock(index, 'symbol', e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Weight %"
                      value={stock.weight}
                      onChange={(e) => updateStock(index, 'weight', Number(e.target.value))}
                      className="border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                    <select
                      value={stock.action}
                      onChange={(e) => updateStock(index, 'action', e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="buy">Buy</option>
                      <option value="sell">Sell</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeStock(index)}
                      className="text-red-600 hover:text-red-800"
                      disabled={formData.stocks.length === 1}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bucket Orders List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Your Bucket Orders</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {bucketOrders.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No bucket orders found. Create your first bucket order to get started.
            </div>
          ) : (
            bucketOrders.map((order) => (
              <div key={order.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Package className="h-8 w-8 text-indigo-600" />
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{order.name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          ₹{order.total_capital.toLocaleString()}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(order.scheduled_time).toLocaleString()}
                        </div>
                        <div className="flex items-center">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          {order.stocks.length} stocks
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Stocks in this bucket:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {order.stocks.map((stock, index) => (
                      <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                        <span className="font-medium">{stock.symbol}</span>
                        <span className="text-gray-500 ml-2">{stock.weight}%</span>
                        <span className={`ml-2 ${stock.action === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                          {stock.action.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
