const API_BASE_URL = (import.meta.env as any).VITE_API_URL || 'http://localhost:8000';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
}

export interface UserSettings {
  capital_per_day: number;
  max_trades_per_day: number;
  stop_loss_percent: number;
  broker: string | null;
  telegram_id: string | null;
  mode: 'paper' | 'live';
  telegram_alerts: boolean;
}

export interface Trade {
  id: number;
  stock: string;
  action: 'buy' | 'sell';
  quantity: number;
  price: number;
  result: number | null;
  timestamp: string;
}

export interface DashboardData {
  total_pnl: number;
  today_pnl: number;
  total_trades: number;
  today_trades: number;
  broker_connected: boolean;
  mode: 'paper' | 'live';
  recent_trades: Trade[];
}

export interface LogEntry {
  id: number;
  message: string;
  timestamp: string;
}

export interface BacktestResult {
  id: number;
  strategy: string;
  results: {
    start_date: string;
    end_date: string;
    total_trades: number;
    winning_trades: number;
    losing_trades: number;
    total_pnl: number;
    win_rate: number;
    max_drawdown: number;
    sharpe_ratio: number;
    equity_curve: Array<{ date: string; value: number }>;
  };
  created_at: string;
}

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.logout();
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || 'Request failed');
    }

    return response.json();
  }

  async register(name: string, email: string, password: string): Promise<User> {
    return this.request('/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  async login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    const response = await this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    this.token = response.access_token;
    localStorage.setItem('token', this.token!);
    
    return response;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('token');
  }

  async getCurrentUser(): Promise<User> {
    return this.request('/me');
  }

  async getUserSettings(): Promise<UserSettings> {
    return this.request('/me/settings');
  }

  async updateUserSettings(settings: Partial<UserSettings>): Promise<{ message: string }> {
    return this.request('/me/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async submitBrokerCredentials(broker: string, apiKey: string, apiSecret: string): Promise<{ message: string }> {
    return this.request('/me/broker', {
      method: 'POST',
      body: JSON.stringify({
        broker,
        api_key: apiKey,
        api_secret: apiSecret,
      }),
    });
  }

  async getBrokerStatus(): Promise<{ connected: boolean; expires_at: string | null }> {
    return this.request('/me/broker/status');
  }

  async getDashboard(): Promise<DashboardData> {
    return this.request('/me/dashboard');
  }

  async runScreener(): Promise<{ stocks: any[]; count: number }> {
    return this.request('/me/screener', { method: 'POST' });
  }

  async executeBuy(stock: string, price: number, quantity: number): Promise<{ message: string }> {
    return this.request('/me/trade/buy', {
      method: 'POST',
      body: JSON.stringify({ stock, price, quantity }),
    });
  }

  async executeSell(stock: string, price: number, quantity: number): Promise<{ message: string }> {
    return this.request('/me/trade/sell', {
      method: 'POST',
      body: JSON.stringify({ stock, price, quantity }),
    });
  }

  async getLogs(): Promise<LogEntry[]> {
    return this.request('/me/logs');
  }

  async runBacktest(startDate: string, endDate: string, strategy: string = 'default'): Promise<BacktestResult> {
    return this.request('/me/backtest', {
      method: 'POST',
      body: JSON.stringify({
        start_date: startDate,
        end_date: endDate,
        strategy,
      }),
    });
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    return this.request('/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return this.request('/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token,
        new_password: newPassword,
      }),
    });
  }

  async getAdminDashboard(): Promise<any> {
    return this.request('/admin/dashboard');
  }

  async getAllUsers(skip: number = 0, limit: number = 50): Promise<any> {
    return this.request(`/admin/users?skip=${skip}&limit=${limit}`);
  }

  async getUserById(userId: number): Promise<any> {
    return this.request(`/admin/users/${userId}`);
  }

  async getAllTrades(skip: number = 0, limit: number = 100): Promise<any> {
    return this.request(`/admin/trades?skip=${skip}&limit=${limit}`);
  }

  async getAllLogs(skip: number = 0, limit: number = 100): Promise<any> {
    return this.request(`/admin/logs?skip=${skip}&limit=${limit}`);
  }
}

export const apiService = new ApiService();
