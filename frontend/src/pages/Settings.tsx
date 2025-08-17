import React, { useState, useEffect } from 'react';
import { apiService, UserSettings } from '../services/api';
import { Save, Settings as SettingsIcon, Bell, TrendingUp, Download, Zap } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [thirdPartySettings, setThirdPartySettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'trading' | 'integrations' | 'notifications' | 'advanced'>('trading');

  useEffect(() => {
    loadSettings();
    loadThirdPartySettings();
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

  const loadThirdPartySettings = async () => {
    try {
      const data = await apiService.getThirdPartySettings();
      setThirdPartySettings(data);
    } catch (err) {
      console.error('Failed to load third-party settings:', err);
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

  const updateThirdPartySetting = (key: string, value: any) => {
    if (!thirdPartySettings) return;
    setThirdPartySettings({ ...thirdPartySettings, [key]: value });
  };

  const handleThirdPartySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thirdPartySettings) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await apiService.updateThirdPartySettings(thirdPartySettings);
      setSuccess('Third-party settings updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update third-party settings');
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const exportRequest = {
        export_type: 'trades',
        format_type: 'csv',
        date_range: {
          start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: new Date().toISOString()
        },
        filters: {}
      };
      
      await apiService.createExportRequest(exportRequest);
      setSuccess('CSV export generated successfully');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate CSV export');
      setSuccess('');
    }
  };

  const handleExportPDF = async () => {
    try {
      const exportRequest = {
        export_type: 'trades',
        format_type: 'pdf',
        date_range: {
          start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: new Date().toISOString()
        },
        filters: {}
      };
      
      await apiService.createExportRequest(exportRequest);
      setSuccess('PDF export generated successfully');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate PDF export');
      setSuccess('');
    }
  };

  const tabs = [
    { id: 'trading', name: 'Trading', icon: TrendingUp },
    { id: 'integrations', name: 'Integrations', icon: Zap },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'advanced', name: 'Advanced', icon: SettingsIcon },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading settings...</div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'trading' | 'integrations' | 'notifications' | 'advanced')}
                  className={`${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="px-4 py-5 sm:p-6">

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

          {activeTab === 'trading' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Trading Settings
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Configure your trading parameters and risk management settings.
                </p>
              </div>

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
          )}

          {activeTab === 'integrations' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Third-Party Integrations
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Configure external services and API integrations.
                </p>
              </div>

              <form onSubmit={handleThirdPartySubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email Service Provider
                  </label>
                  <select
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={thirdPartySettings?.email_service_provider || ''}
                    onChange={(e) => updateThirdPartySetting('email_service_provider', e.target.value)}
                  >
                    <option value="">Select Provider</option>
                    <option value="sendgrid">SendGrid</option>
                    <option value="mailgun">Mailgun</option>
                    <option value="smtp">SMTP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email API Key
                  </label>
                  <input
                    type="password"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter your email service API key"
                    onChange={(e) => updateThirdPartySetting('email_api_key', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    News API Key
                  </label>
                  <input
                    type="password"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter your news API key (NewsAPI, Alpha Vantage, etc.)"
                    onChange={(e) => updateThirdPartySetting('news_api_key', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Telegram Bot Token
                  </label>
                  <input
                    type="password"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter your Telegram bot token"
                    onChange={(e) => updateThirdPartySetting('telegram_bot_token', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="https://your-webhook-url.com/webhook"
                    value={thirdPartySettings?.webhook_url || ''}
                    onChange={(e) => updateThirdPartySetting('webhook_url', e.target.value)}
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Integration Settings'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Notification Settings
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Configure how and when you receive notifications.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      id="emailNotifications"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      checked={settings?.email_notifications || false}
                      onChange={(e) => updateSetting('email_notifications', e.target.checked)}
                    />
                    <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-900">
                      Email Notifications
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="telegramAlerts"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      checked={settings?.telegram_alerts || false}
                      onChange={(e) => updateSetting('telegram_alerts', e.target.checked)}
                    />
                    <label htmlFor="telegramAlerts" className="ml-2 block text-sm text-gray-900">
                      Telegram Alerts
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="newsSentiment"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      checked={settings?.news_sentiment_enabled || false}
                      onChange={(e) => updateSetting('news_sentiment_enabled', e.target.checked)}
                    />
                    <label htmlFor="newsSentiment" className="ml-2 block text-sm text-gray-900">
                      News Sentiment Analysis Alerts
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Notification Settings'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Advanced Features
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Enable advanced trading features and analytics.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      id="multiStrategy"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      checked={settings?.multi_strategy_enabled || false}
                      onChange={(e) => updateSetting('multi_strategy_enabled', e.target.checked)}
                    />
                    <label htmlFor="multiStrategy" className="ml-2 block text-sm text-gray-900">
                      Multi-Strategy Trading
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="bucketTrading"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      checked={settings?.bucket_trading_enabled || false}
                      onChange={(e) => updateSetting('bucket_trading_enabled', e.target.checked)}
                    />
                    <label htmlFor="bucketTrading" className="ml-2 block text-sm text-gray-900">
                      Bucket Trading & Scheduled Orders
                    </label>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Export & Reports</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Generate detailed reports of your trading activity and performance.
                  </p>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </button>
                    <button
                      type="button"
                      onClick={handleExportPDF}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Advanced Settings'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
