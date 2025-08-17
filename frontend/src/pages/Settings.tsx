import React, { useState, useEffect } from 'react';
import { apiService, UserSettings } from '../services/api';
import { Save } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await apiService.getUserSettings();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await apiService.updateUserSettings(settings);
      setSuccess('Settings updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof UserSettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading settings...</div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
            Trading Settings
          </h3>

          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 p-4 mb-4">
              <div className="text-sm text-green-700">{success}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="capital" className="block text-sm font-medium text-gray-700">
                Capital per Day (₹)
              </label>
              <input
                type="number"
                id="capital"
                min="1000"
                step="100"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={settings.capital_per_day}
                onChange={(e) => updateSetting('capital_per_day', parseFloat(e.target.value))}
              />
              <p className="mt-2 text-sm text-gray-500">
                Total capital to use for trading each day
              </p>
            </div>

            <div>
              <label htmlFor="maxTrades" className="block text-sm font-medium text-gray-700">
                Max Trades per Day
              </label>
              <input
                type="number"
                id="maxTrades"
                min="1"
                max="20"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={settings.max_trades_per_day}
                onChange={(e) => updateSetting('max_trades_per_day', parseInt(e.target.value))}
              />
              <p className="mt-2 text-sm text-gray-500">
                Maximum number of trades to execute per day
              </p>
            </div>

            <div>
              <label htmlFor="stopLoss" className="block text-sm font-medium text-gray-700">
                Stop Loss (%)
              </label>
              <input
                type="number"
                id="stopLoss"
                min="0.5"
                max="10"
                step="0.1"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={settings.stop_loss_percent}
                onChange={(e) => updateSetting('stop_loss_percent', parseFloat(e.target.value))}
              />
              <p className="mt-2 text-sm text-gray-500">
                Stop loss percentage for trades
              </p>
            </div>

            <div>
              <label htmlFor="mode" className="block text-sm font-medium text-gray-700">
                Trading Mode
              </label>
              <select
                id="mode"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={settings.mode}
                onChange={(e) => updateSetting('mode', e.target.value as 'paper' | 'live')}
              >
                <option value="paper">Paper Trading</option>
                <option value="live">Live Trading</option>
              </select>
              <p className="mt-2 text-sm text-gray-500">
                Paper trading uses simulated trades, live trading uses real money
              </p>
            </div>

            <div>
              <label htmlFor="telegramId" className="block text-sm font-medium text-gray-700">
                Telegram Chat ID (Optional)
              </label>
              <input
                type="text"
                id="telegramId"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={settings.telegram_id || ''}
                onChange={(e) => updateSetting('telegram_id', e.target.value || null)}
                placeholder="Your Telegram chat ID for notifications"
              />
            </div>

            <div className="flex items-center">
              <input
                id="telegramAlerts"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                checked={settings.telegram_alerts}
                onChange={(e) => updateSetting('telegram_alerts', e.target.checked)}
              />
              <label htmlFor="telegramAlerts" className="ml-2 block text-sm text-gray-900">
                Enable Telegram Alerts
              </label>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
