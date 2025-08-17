from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from enum import Enum

class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"

class BrokerType(str, Enum):
    ZERODHA = "zerodha"
    ANGEL = "angel"

class TradingMode(str, Enum):
    PAPER = "paper"
    LIVE = "live"

class TradeAction(str, Enum):
    BUY = "buy"
    SELL = "sell"

class User:
    def __init__(self, id: int, name: str, email: str, hashed_password: str, role: UserRole = UserRole.USER):
        self.id = id
        self.name = name
        self.email = email
        self.hashed_password = hashed_password
        self.role = role
        self.created_at = datetime.now()

class UserSettings:
    def __init__(self, user_id: int, capital_per_day: float = 10000.0, 
                 max_trades_per_day: int = 5, stop_loss_percent: float = 2.0,
                 broker: Optional[BrokerType] = None, telegram_id: Optional[str] = None,
                 mode: TradingMode = TradingMode.PAPER, telegram_alerts: bool = False,
                 email_notifications: bool = True, news_sentiment_enabled: bool = False,
                 multi_strategy_enabled: bool = False, bucket_trading_enabled: bool = False):
        self.user_id = user_id
        self.capital_per_day = capital_per_day
        self.max_trades_per_day = max_trades_per_day
        self.stop_loss_percent = stop_loss_percent
        self.broker = broker
        self.telegram_id = telegram_id
        self.mode = mode
        self.telegram_alerts = telegram_alerts
        self.email_notifications = email_notifications
        self.news_sentiment_enabled = news_sentiment_enabled
        self.multi_strategy_enabled = multi_strategy_enabled
        self.bucket_trading_enabled = bucket_trading_enabled

class BrokerToken:
    def __init__(self, user_id: int, encrypted_token: str, expires_at: datetime):
        self.user_id = user_id
        self.encrypted_token = encrypted_token
        self.expires_at = expires_at
        self.created_at = datetime.now()

class Trade:
    def __init__(self, user_id: int, stock: str, action: TradeAction, 
                 quantity: int, price: float, result: Optional[float] = None):
        self.id = len(trades_db) + 1
        self.user_id = user_id
        self.stock = stock
        self.action = action
        self.quantity = quantity
        self.price = price
        self.result = result
        self.timestamp = datetime.now()

class Log:
    def __init__(self, user_id: int, message: str):
        self.id = len(logs_db) + 1
        self.user_id = user_id
        self.message = message
        self.timestamp = datetime.now()

class PasswordResetToken:
    def __init__(self, user_id: int, token: str):
        self.id = len(password_reset_tokens_db) + 1
        self.user_id = user_id
        self.token = token
        self.created_at = datetime.now()
        self.expires_at = datetime.now().replace(hour=datetime.now().hour + 1)
        self.used = False

class Wishlist:
    def __init__(self, user_id: int, stock_symbol: str, target_price: Optional[float] = None, notes: Optional[str] = None):
        self.id = len(wishlist_db) + 1
        self.user_id = user_id
        self.stock_symbol = stock_symbol
        self.target_price = target_price
        self.notes = notes
        self.created_at = datetime.now()

class StockPerformance:
    def __init__(self, symbol: str, current_price: float, day_change: float, day_change_percent: float,
                 volume: int, market_cap: Optional[float] = None, pe_ratio: Optional[float] = None):
        self.symbol = symbol
        self.current_price = current_price
        self.day_change = day_change
        self.day_change_percent = day_change_percent
        self.volume = volume
        self.market_cap = market_cap
        self.pe_ratio = pe_ratio
        self.timestamp = datetime.now()

class Backtest:
    def __init__(self, user_id: int, strategy: str, results_json: dict):
        self.id = len(backtests_db) + 1
        self.user_id = user_id
        self.strategy = strategy
        self.results_json = results_json
        self.created_at = datetime.now()

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[UserRole] = UserRole.USER

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    created_at: datetime

class UserSettingsUpdate(BaseModel):
    capital_per_day: Optional[float] = None
    max_trades_per_day: Optional[int] = None
    stop_loss_percent: Optional[float] = None
    broker: Optional[BrokerType] = None
    telegram_id: Optional[str] = None
    mode: Optional[TradingMode] = None
    telegram_alerts: Optional[bool] = None
    email_notifications: Optional[bool] = None
    news_sentiment_enabled: Optional[bool] = None
    multi_strategy_enabled: Optional[bool] = None
    bucket_trading_enabled: Optional[bool] = None

class BrokerCredentials(BaseModel):
    broker: BrokerType
    api_key: str
    api_secret: str
    access_token: Optional[str] = None

class TradeResponse(BaseModel):
    id: int
    stock: str
    action: TradeAction
    quantity: int
    price: float
    result: Optional[float]
    timestamp: datetime

class LogResponse(BaseModel):
    id: int
    message: str
    timestamp: datetime

class BacktestRequest(BaseModel):
    start_date: str
    end_date: str
    strategy: str = "default"

class BacktestResponse(BaseModel):
    id: int
    strategy: str
    results: dict
    created_at: datetime

class ManualTradeRequest(BaseModel):
    stock_symbol: str
    action: TradeAction
    quantity: int
    price: Optional[float] = None  # If None, use market price

class WishlistCreate(BaseModel):
    stock_symbol: str
    target_price: Optional[float] = None
    notes: Optional[str] = None

class WishlistResponse(BaseModel):
    id: int
    stock_symbol: str
    target_price: Optional[float]
    notes: Optional[str]
    current_price: Optional[float]
    created_at: datetime

class StockQuote(BaseModel):
    symbol: str
    current_price: float
    day_change: float
    day_change_percent: float
    volume: int
    market_cap: Optional[float] = None
    pe_ratio: Optional[float] = None

class StockSearchResult(BaseModel):
    symbol: str
    name: str
    exchange: str
    current_price: Optional[float] = None

class PasswordResetRequest(BaseModel):
    email: str

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

class AdminUserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    created_at: datetime
    total_trades: int
    total_pnl: float
    last_login: Optional[datetime] = None

class AdminDashboardResponse(BaseModel):
    total_users: int
    total_trades: int
    total_pnl: float
    active_users_today: int
    recent_users: List[AdminUserResponse]

class DashboardResponse(BaseModel):
    total_pnl: float
    today_pnl: float
    total_trades: int
    today_trades: int
    broker_connected: bool
    mode: TradingMode
    recent_trades: List[TradeResponse]

class ThirdPartySettings:
    def __init__(self, user_id: int, email_service_provider: Optional[str] = None,
                 email_api_key: Optional[str] = None, news_api_key: Optional[str] = None,
                 telegram_bot_token: Optional[str] = None, webhook_url: Optional[str] = None):
        self.id = len(third_party_settings_db) + 1
        self.user_id = user_id
        self.email_service_provider = email_service_provider  # sendgrid, mailgun, smtp
        self.email_api_key = email_api_key
        self.news_api_key = news_api_key
        self.telegram_bot_token = telegram_bot_token
        self.webhook_url = webhook_url
        self.created_at = datetime.now()

class NewsAnalysis:
    def __init__(self, stock_symbol: str, headline: str, sentiment_score: float, 
                 source: str, impact_score: float):
        self.id = len(news_analysis_db) + 1
        self.stock_symbol = stock_symbol
        self.headline = headline
        self.sentiment_score = sentiment_score  # -1 to 1
        self.source = source
        self.impact_score = impact_score  # 0 to 1
        self.timestamp = datetime.now()

class TradingStrategy:
    def __init__(self, user_id: int, name: str, parameters: dict, 
                 is_active: bool = True, risk_level: str = "medium"):
        self.id = len(trading_strategies_db) + 1
        self.user_id = user_id
        self.name = name
        self.parameters = parameters
        self.is_active = is_active
        self.risk_level = risk_level  # low, medium, high
        self.created_at = datetime.now()

class BucketOrder:
    def __init__(self, user_id: int, name: str, stocks: List[dict], 
                 scheduled_time: datetime, total_capital: float, 
                 execution_type: str = "market_open"):
        self.id = len(bucket_orders_db) + 1
        self.user_id = user_id
        self.name = name
        self.stocks = stocks  # [{"symbol": "RELIANCE", "weight": 0.3, "action": "buy"}]
        self.scheduled_time = scheduled_time
        self.total_capital = total_capital
        self.execution_type = execution_type  # market_open, specific_time, condition_based
        self.status = "pending"  # pending, executed, cancelled
        self.created_at = datetime.now()

class ExportRequest:
    def __init__(self, user_id: int, export_type: str, format_type: str, 
                 date_range: dict, filters: Optional[dict] = None):
        self.id = len(export_requests_db) + 1
        self.user_id = user_id
        self.export_type = export_type  # trades, analytics, performance, logs
        self.format_type = format_type  # csv, pdf
        self.date_range = date_range
        self.filters = filters
        self.status = "processing"  # processing, completed, failed
        self.file_path = None
        self.created_at = datetime.now()

class ThirdPartySettingsUpdate(BaseModel):
    email_service_provider: Optional[str] = None
    email_api_key: Optional[str] = None
    news_api_key: Optional[str] = None
    telegram_bot_token: Optional[str] = None
    webhook_url: Optional[str] = None

class NewsAnalysisResponse(BaseModel):
    id: int
    stock_symbol: str
    headline: str
    sentiment_score: float
    source: str
    impact_score: float
    timestamp: datetime

class TradingStrategyCreate(BaseModel):
    name: str
    parameters: dict
    risk_level: str = "medium"

class TradingStrategyResponse(BaseModel):
    id: int
    name: str
    parameters: dict
    is_active: bool
    risk_level: str
    created_at: datetime

class BucketOrderCreate(BaseModel):
    name: str
    stocks: List[dict]
    scheduled_time: datetime
    total_capital: float
    execution_type: str = "market_open"

class BucketOrderResponse(BaseModel):
    id: int
    name: str
    stocks: List[dict]
    scheduled_time: datetime
    total_capital: float
    execution_type: str
    status: str
    created_at: datetime

class ExportRequestCreate(BaseModel):
    export_type: str
    format_type: str
    date_range: dict
    filters: Optional[dict] = None

class ExportRequestResponse(BaseModel):
    id: int
    export_type: str
    format_type: str
    status: str
    file_path: Optional[str]
    created_at: datetime

class AdvancedAnalyticsResponse(BaseModel):
    portfolio_value: float
    total_return: float
    sharpe_ratio: float
    max_drawdown: float
    win_rate: float
    avg_trade_duration: float
    risk_metrics: dict
    performance_chart_data: List[dict]

users_db: List[User] = []
user_settings_db: List[UserSettings] = []
broker_tokens_db: List[BrokerToken] = []
trades_db: List[Trade] = []
logs_db: List[Log] = []
backtests_db: List[Backtest] = []
password_reset_tokens_db: List[PasswordResetToken] = []
wishlist_db: List[Wishlist] = []
third_party_settings_db: List[ThirdPartySettings] = []
news_analysis_db: List[NewsAnalysis] = []
trading_strategies_db: List[TradingStrategy] = []
bucket_orders_db: List[BucketOrder] = []
export_requests_db: List[ExportRequest] = []
