import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const requestToken = searchParams.get('request_token');
      const status = searchParams.get('status');
      const error = searchParams.get('error');

      if (error || status === 'error') {
        setStatus('error');
        setMessage('OAuth authentication failed. Please try again.');
        return;
      }

      if (!requestToken) {
        setStatus('error');
        setMessage('No request token received. Please try again.');
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/me/broker/oauth/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ request_token: requestToken }),
        });

        if (response.ok) {
          setStatus('success');
          setMessage('Broker connected successfully!');
          setTimeout(() => {
            navigate('/broker');
          }, 2000);
        } else {
          const errorData = await response.json();
          setStatus('error');
          setMessage(errorData.detail || 'Failed to complete OAuth authentication');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Network error occurred. Please try again.');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full">
            {status === 'loading' && <Loader className="h-8 w-8 text-indigo-600 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-8 w-8 text-green-600" />}
            {status === 'error' && <XCircle className="h-8 w-8 text-red-600" />}
          </div>
          
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            {status === 'loading' && 'Processing OAuth...'}
            {status === 'success' && 'Success!'}
            {status === 'error' && 'Authentication Failed'}
          </h2>
          
          <p className="mt-2 text-center text-sm text-gray-400">
            {message}
          </p>
          
          {status === 'success' && (
            <p className="mt-4 text-center text-sm text-gray-400">
              Redirecting to broker setup...
            </p>
          )}
          
          {status === 'error' && (
            <div className="mt-4">
              <button
                onClick={() => navigate('/broker')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Back to Broker Setup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
