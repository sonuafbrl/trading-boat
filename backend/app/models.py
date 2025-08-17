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
                 mode: TradingMode = TradingMode.PAPER, telegram_alerts: bool = False):
        self.user_id = user_id
        self.capital_per_day = capital_per_day
        self.max_trades_per_day = max_trades_per_day
        self.stop_loss_percent = stop_loss_percent
        self.broker = broker
        self.telegram_id = telegram_id
        self.mode = mode
        self.telegram_alerts = telegram_alerts

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

users_db: List[User] = []
user_settings_db: List[UserSettings] = []
broker_tokens_db: List[BrokerToken] = []
trades_db: List[Trade] = []
logs_db: List[Log] = []
backtests_db: List[Backtest] = []
password_reset_tokens_db: List[PasswordResetToken] = []
