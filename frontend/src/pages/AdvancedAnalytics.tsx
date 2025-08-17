import { useState, useEffect } from 'react';
import { apiService, AdvancedAnalytics } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Target, Activity, AlertTriangle } from 'lucide-react';

export default function AdvancedAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AdvancedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeframe, setTimeframe] = useState(30);

  useEffect(() => {
    loadAnalytics();
  }, [timeframe]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await apiService.getAdvancedAnalytics(timeframe);
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading advanced analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">{error}</div>
      </div>
    );
  }

  if (!analytics) return null;

  const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;

  const getReturnColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getReturnIcon = (value: number) => {
    return value >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Timeframe Selector */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Advanced Analytics</h1>
          <div className="flex space-x-2">
            {[7, 30, 90, 365].map((days) => (
              <button
                key={days}
                onClick={() => setTimeframe(days)}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  timeframe === days
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {days}D
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Portfolio Value</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(analytics.portfolio_value)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={getReturnColor(analytics.return_percentage)}>
                {getReturnIcon(analytics.return_percentage)}
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Total Return</div>
              <div className={`text-2xl font-bold ${getReturnColor(analytics.return_percentage)}`}>
                {formatPercentage(analytics.return_percentage)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Target className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Win Rate</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatPercentage(analytics.win_rate)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Sharpe Ratio</div>
              <div className="text-2xl font-bold text-gray-900">
                {analytics.sharpe_ratio.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Performance Chart */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Portfolio Performance</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics.performance_chart_data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  name === 'portfolio_value' ? formatCurrency(value) : formatPercentage(value),
                  name === 'portfolio_value' ? 'Portfolio Value' : 'Cumulative Return'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="portfolio_value" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="cumulative_return" 
                stroke="#82ca9d" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Risk Metrics and Trade Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Metrics */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Maximum Drawdown</span>
              <span className="text-sm font-bold text-red-600">
                -{formatPercentage(analytics.max_drawdown)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Volatility</span>
              <span className="text-sm font-bold text-gray-900">
                {formatPercentage(analytics.volatility)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Value at Risk (5%)</span>
              <span className="text-sm font-bold text-orange-600">
                {formatCurrency(analytics.risk_metrics.value_at_risk)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Beta</span>
              <span className="text-sm font-bold text-gray-900">
                {analytics.risk_metrics.beta.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Alpha</span>
              <span className={`text-sm font-bold ${getReturnColor(analytics.risk_metrics.alpha)}`}>
                {formatPercentage(analytics.risk_metrics.alpha)}
              </span>
            </div>
          </div>
        </div>

        {/* Trade Statistics */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Trade Statistics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Total Trades</span>
              <span className="text-sm font-bold text-gray-900">{analytics.total_trades}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Winning Trades</span>
              <span className="text-sm font-bold text-green-600">{analytics.winning_trades}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Losing Trades</span>
              <span className="text-sm font-bold text-red-600">{analytics.losing_trades}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Average Win</span>
              <span className="text-sm font-bold text-green-600">
                {formatCurrency(analytics.avg_win)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Average Loss</span>
              <span className="text-sm font-bold text-red-600">
                {formatCurrency(analytics.avg_loss)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Profit Factor</span>
              <span className="text-sm font-bold text-blue-600">
                {analytics.profit_factor === Infinity ? '∞' : analytics.profit_factor.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Avg Trade Duration</span>
              <span className="text-sm font-bold text-gray-900">
                {analytics.avg_trade_duration.toFixed(1)}h
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg ${analytics.sharpe_ratio > 1 ? 'bg-green-50' : 'bg-yellow-50'}`}>
            <div className="flex items-center">
              <Activity className={`h-5 w-5 mr-2 ${analytics.sharpe_ratio > 1 ? 'text-green-600' : 'text-yellow-600'}`} />
              <span className="text-sm font-medium">Risk-Adjusted Returns</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {analytics.sharpe_ratio > 1 
                ? 'Excellent risk-adjusted performance' 
                : 'Consider optimizing risk management'}
            </p>
          </div>

          <div className={`p-4 rounded-lg ${analytics.win_rate > 50 ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center">
              <Target className={`h-5 w-5 mr-2 ${analytics.win_rate > 50 ? 'text-green-600' : 'text-red-600'}`} />
              <span className="text-sm font-medium">Win Rate Analysis</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {analytics.win_rate > 50 
                ? 'Strong winning consistency' 
                : 'Focus on improving trade selection'}
            </p>
          </div>

          <div className={`p-4 rounded-lg ${analytics.max_drawdown < 10 ? 'bg-green-50' : 'bg-orange-50'}`}>
            <div className="flex items-center">
              <AlertTriangle className={`h-5 w-5 mr-2 ${analytics.max_drawdown < 10 ? 'text-green-600' : 'text-orange-600'}`} />
              <span className="text-sm font-medium">Drawdown Control</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {analytics.max_drawdown < 10 
                ? 'Well-controlled risk exposure' 
                : 'Consider tighter stop-loss levels'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
