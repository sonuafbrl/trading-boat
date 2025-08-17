import React, { useState } from 'react';
import { apiService, BacktestResult } from '../services/api';
import { TrendingUp, Play, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Backtest() {
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-01-31');
  const [strategy, setStrategy] = useState('default');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<BacktestResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const backtestResult = await apiService.runBacktest(startDate, endDate, strategy);
      setResult(backtestResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run backtest');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center mb-6">
        <TrendingUp className="h-6 w-6 text-indigo-600 mr-2" />
        <h1 className="text-2xl font-bold text-gray-900">Backtesting</h1>
      </div>

      {/* Backtest Form */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Run Backtest
          </h3>

          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <div className="mt-1 relative">
                  <input
                    type="date"
                    id="startDate"
                    required
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <Calendar className="absolute right-3 top-2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <div className="mt-1 relative">
                  <input
                    type="date"
                    id="endDate"
                    required
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                  <Calendar className="absolute right-3 top-2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="strategy" className="block text-sm font-medium text-gray-700">
                Strategy
              </label>
              <select
                id="strategy"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
              >
                <option value="default">Default Strategy (RSI + MACD + Momentum)</option>
                <option value="momentum">Momentum Only</option>
                <option value="rsi">RSI Only</option>
                <option value="macd">MACD Only</option>
              </select>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <Play className="h-4 w-4 mr-2" />
                {loading ? 'Running Backtest...' : 'Run Backtest'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Backtest Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Backtest Results
              </h3>
              
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">Total P&L</dt>
                  <dd className={`text-2xl font-bold ${
                    result.results.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ₹{result.results.total_pnl.toFixed(2)}
                  </dd>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">Win Rate</dt>
                  <dd className="text-2xl font-bold text-blue-600">
                    {(result.results.win_rate * 100).toFixed(1)}%
                  </dd>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">Total Trades</dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {result.results.total_trades}
                  </dd>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">Max Drawdown</dt>
                  <dd className="text-2xl font-bold text-red-600">
                    {(result.results.max_drawdown * 100).toFixed(1)}%
                  </dd>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mt-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">Winning Trades</dt>
                  <dd className="text-xl font-bold text-green-600">
                    {result.results.winning_trades}
                  </dd>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">Losing Trades</dt>
                  <dd className="text-xl font-bold text-red-600">
                    {result.results.losing_trades}
                  </dd>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">Sharpe Ratio</dt>
                  <dd className="text-xl font-bold text-blue-600">
                    {result.results.sharpe_ratio.toFixed(2)}
                  </dd>
                </div>
              </div>
            </div>
          </div>

          {/* Equity Curve */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Equity Curve
              </h3>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={result?.results.equity_curve || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Portfolio Value']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#4f46e5" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
