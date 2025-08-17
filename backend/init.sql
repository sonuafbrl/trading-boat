


CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    capital_per_day DECIMAL(10,2) DEFAULT 10000.00,
    max_trades_per_day INTEGER DEFAULT 5,
    stop_loss_percent DECIMAL(5,2) DEFAULT 2.00,
    broker VARCHAR(50),
    telegram_id VARCHAR(255),
    mode VARCHAR(50) DEFAULT 'paper',
    telegram_alerts BOOLEAN DEFAULT FALSE,
    email_notifications BOOLEAN DEFAULT TRUE,
    news_sentiment_enabled BOOLEAN DEFAULT FALSE,
    multi_strategy_enabled BOOLEAN DEFAULT FALSE,
    bucket_trading_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS broker_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    encrypted_token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trades (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    stock VARCHAR(50) NOT NULL,
    action VARCHAR(10) NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    result DECIMAL(10,2),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS backtests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    strategy VARCHAR(255) NOT NULL,
    results_json JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS wishlist (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    stock_symbol VARCHAR(20) NOT NULL,
    target_price DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, stock_symbol)
);

CREATE TABLE IF NOT EXISTS third_party_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    email_service_provider VARCHAR(50),
    email_api_key TEXT,
    news_api_key TEXT,
    telegram_bot_token TEXT,
    webhook_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS news_analysis (
    id SERIAL PRIMARY KEY,
    stock_symbol VARCHAR(20) NOT NULL,
    headline TEXT NOT NULL,
    sentiment_score DECIMAL(5,3) NOT NULL,
    source VARCHAR(100) NOT NULL,
    impact_score DECIMAL(5,3) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trading_strategies (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    parameters JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    risk_level VARCHAR(20) DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bucket_orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    stocks JSONB NOT NULL,
    scheduled_time TIMESTAMP NOT NULL,
    total_capital DECIMAL(12,2) NOT NULL,
    execution_type VARCHAR(50) DEFAULT 'market_open',
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS export_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    export_type VARCHAR(50) NOT NULL,
    format_type VARCHAR(10) NOT NULL,
    date_range JSONB NOT NULL,
    filters JSONB,
    status VARCHAR(20) DEFAULT 'processing',
    file_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_broker_tokens_user_id ON broker_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_timestamp ON trades(timestamp);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_backtests_user_id ON backtests(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_stock_symbol ON wishlist(stock_symbol);
CREATE INDEX IF NOT EXISTS idx_third_party_settings_user_id ON third_party_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_news_analysis_stock_symbol ON news_analysis(stock_symbol);
CREATE INDEX IF NOT EXISTS idx_news_analysis_timestamp ON news_analysis(timestamp);
CREATE INDEX IF NOT EXISTS idx_trading_strategies_user_id ON trading_strategies(user_id);
CREATE INDEX IF NOT EXISTS idx_bucket_orders_user_id ON bucket_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_bucket_orders_scheduled_time ON bucket_orders(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_export_requests_user_id ON export_requests(user_id);
