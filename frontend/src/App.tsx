import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { apiService, User } from './services/api';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import BrokerSetup from './pages/BrokerSetup';
import Logs from './pages/Logs';
import Backtest from './pages/Backtest';
import Trading from './pages/Trading';
import NewsSentiment from './pages/NewsSentiment';
import AdvancedAnalytics from './pages/AdvancedAnalytics';
import BucketTrading from './pages/BucketTrading';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import OAuthCallback from './pages/OAuthCallback';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminTrades from './pages/AdminTrades';
import AdminLogs from './pages/AdminLogs';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (apiService.isAuthenticated()) {
        try {
          const userData = await apiService.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error('Auth check failed:', error);
          apiService.logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    apiService.logout();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-900">
        {user ? (
          user.role === 'admin' ? (
            <AdminLayout user={user} onLogout={handleLogout}>
              <Routes>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/trades" element={<AdminTrades />} />
                <Route path="/admin/logs" element={<AdminLogs />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Routes>
            </AdminLayout>
          ) : (
            <Layout user={user} onLogout={handleLogout}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/trading" element={<Trading />} />
                <Route path="/news-sentiment" element={<NewsSentiment />} />
                <Route path="/advanced-analytics" element={<AdvancedAnalytics />} />
                <Route path="/bucket-trading" element={<BucketTrading />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/broker" element={<BrokerSetup />} />
                <Route path="/callback" element={<OAuthCallback />} />
                <Route path="/logs" element={<Logs />} />
                <Route path="/backtest" element={<Backtest />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          )
        ) : (
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/register" element={<Register onLogin={handleLogin} />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/callback" element={<OAuthCallback />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App;
