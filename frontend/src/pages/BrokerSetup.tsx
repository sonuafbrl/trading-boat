import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Link as LinkIcon, CheckCircle, XCircle } from 'lucide-react';

export default function BrokerSetup() {
  const [broker, setBroker] = useState<'zerodha' | 'angel'>('zerodha');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [brokerStatus, setBrokerStatus] = useState<{ connected: boolean; expires_at: string | null } | null>(null);

  useEffect(() => {
    loadBrokerStatus();
  }, []);

  const loadBrokerStatus = async () => {
    try {
      const status = await apiService.getBrokerStatus();
      setBrokerStatus(status);
    } catch (err) {
      console.error('Failed to load broker status:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiService.submitBrokerCredentials(broker, apiKey, apiSecret);
      setSuccess('Broker credentials saved successfully');
      setApiKey('');
      setApiSecret('');
      loadBrokerStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save broker credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-6">
            <LinkIcon className="h-6 w-6 text-indigo-600 mr-2" />
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Broker Setup
            </h3>
          </div>

          {/* Broker Status */}
          {brokerStatus && (
            <div className="mb-6 p-4 rounded-lg border">
              <div className="flex items-center">
                {brokerStatus.connected ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 mr-2" />
                )}
                <span className={`font-medium ${
                  brokerStatus.connected ? 'text-green-700' : 'text-red-700'
                }`}>
                  {brokerStatus.connected ? 'Broker Connected' : 'Broker Not Connected'}
                </span>
              </div>
              {brokerStatus.connected && brokerStatus.expires_at && (
                <p className="text-sm text-gray-600 mt-1">
                  Expires: {new Date(brokerStatus.expires_at).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Broker
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`relative rounded-lg border p-4 cursor-pointer ${
                    broker === 'zerodha'
                      ? 'border-indigo-500 ring-2 ring-indigo-500'
                      : 'border-gray-300'
                  }`}
                  onClick={() => setBroker('zerodha')}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="broker"
                      value="zerodha"
                      checked={broker === 'zerodha'}
                      onChange={() => setBroker('zerodha')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <label className="ml-3 block text-sm font-medium text-gray-700">
                      Zerodha
                    </label>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Use Kite Connect API
                  </p>
                </div>

                <div
                  className={`relative rounded-lg border p-4 cursor-pointer ${
                    broker === 'angel'
                      ? 'border-indigo-500 ring-2 ring-indigo-500'
                      : 'border-gray-300'
                  }`}
                  onClick={() => setBroker('angel')}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="broker"
                      value="angel"
                      checked={broker === 'angel'}
                      onChange={() => setBroker('angel')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <label className="ml-3 block text-sm font-medium text-gray-700">
                      Angel Broking
                    </label>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Use SmartAPI
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
                API Key
              </label>
              <input
                type="text"
                id="apiKey"
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
              />
            </div>

            <div>
              <label htmlFor="apiSecret" className="block text-sm font-medium text-gray-700">
                API Secret
              </label>
              <input
                type="password"
                id="apiSecret"
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="Enter your API secret"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Security Notice
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Your API credentials are encrypted and stored securely. They are only used
                      to execute trades on your behalf and are never shared with third parties.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    How to get API credentials & Setup
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li><strong>Zerodha:</strong> Visit Kite Connect developer console</li>
                      <li><strong>Angel Broking:</strong> Contact your relationship manager or visit SmartAPI portal</li>
                    </ul>
                    <div className="mt-3 p-3 bg-blue-100 rounded">
                      <p className="font-medium">For Zerodha Kite Connect App Setup:</p>
                      <p className="mt-1"><strong>Redirect URL:</strong></p>
                      <code className="text-xs bg-white px-2 py-1 rounded">
                        https://auto-stock-trading-app-h4x8x8pn.devinapps.com/callback
                      </code>
                      <p className="mt-2"><strong>Post back URL:</strong> (Optional - leave empty)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Credentials'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
