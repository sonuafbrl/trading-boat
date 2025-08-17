from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from typing import List
import logging

from .models import (
    User, UserSettings, BrokerToken, Trade, Log, Backtest, PasswordResetToken,
    UserCreate, UserLogin, UserResponse, UserSettingsUpdate, 
    BrokerCredentials, TradeResponse, LogResponse, BacktestRequest, 
    BacktestResponse, DashboardResponse, TradingMode, BrokerType, UserRole,
    PasswordResetRequest, PasswordResetConfirm, AdminUserResponse, AdminDashboardResponse,
    ManualTradeRequest, WishlistCreate, WishlistResponse, StockQuote, StockSearchResult,
    ThirdPartySettings, ThirdPartySettingsUpdate, NewsAnalysisResponse, 
    TradingStrategyCreate, TradingStrategyResponse, BucketOrderCreate, BucketOrderResponse,
    ExportRequestCreate, ExportRequestResponse, AdvancedAnalyticsResponse,
    users_db, user_settings_db, broker_tokens_db, trades_db, logs_db, backtests_db, 
    password_reset_tokens_db, wishlist_db, third_party_settings_db, news_analysis_db,
    trading_strategies_db, bucket_orders_db, export_requests_db
)
from .auth import (
    get_password_hash, authenticate_user, create_access_token, 
    get_current_user, get_admin_user, ACCESS_TOKEN_EXPIRE_MINUTES
)
from .encryption import encrypt_data, decrypt_data
from .trading import trading_engine
from .screener import screener
from .email_service import email_service
from .scheduler import trading_scheduler
from .news_service import news_service
from .export_service import export_service
from .analytics_service import analytics_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Auto Stock Trading Platform", version="1.0.0")

@app.on_event("startup")
async def startup_event():
    if not users_db:
        admin_user = User(
            id=1,
            name="Admin",
            email="admin@autotrader.com",
            hashed_password=get_password_hash("admin123"),
            role=UserRole.ADMIN
        )
        users_db.append(admin_user)
        
        admin_settings = UserSettings(1)
        user_settings_db.append(admin_settings)
        
        logger.info("Created default admin user: admin@autotrader.com / admin123")
    
    trading_scheduler.start()
    logger.info("Auto Stock Trading Platform started")

@app.on_event("shutdown")
async def shutdown_event():
    trading_scheduler.stop()
    logger.info("Auto Stock Trading Platform stopped")

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    for user in users_db:
        if user.email == user_data.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    user_id = len(users_db) + 1
    hashed_password = get_password_hash(user_data.password)
    user = User(user_id, user_data.name, user_data.email, hashed_password, user_data.role)
    users_db.append(user)
    
    settings = UserSettings(user_id)
    user_settings_db.append(settings)
    
    logger.info(f"New user registered: {user_data.email}")
    return UserResponse(id=user.id, name=user.name, email=user.email, role=user.role, created_at=user.created_at)

@app.post("/login")
async def login(user_data: UserLogin):
    user = authenticate_user(user_data.email, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(id=user.id, name=user.name, email=user.email, role=user.role, created_at=user.created_at)
    }

@app.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return UserResponse(id=current_user.id, name=current_user.name, email=current_user.email, role=current_user.role, created_at=current_user.created_at)

@app.get("/me/settings")
async def get_user_settings(current_user: User = Depends(get_current_user)):
    for settings in user_settings_db:
        if settings.user_id == current_user.id:
            return {
                "capital_per_day": settings.capital_per_day,
                "max_trades_per_day": settings.max_trades_per_day,
                "stop_loss_percent": settings.stop_loss_percent,
                "broker": settings.broker,
                "telegram_id": settings.telegram_id,
                "mode": settings.mode,
                "telegram_alerts": settings.telegram_alerts
            }
    
    return {
        "capital_per_day": 10000.0,
        "max_trades_per_day": 5,
        "stop_loss_percent": 2.0,
        "broker": None,
        "telegram_id": None,
        "mode": TradingMode.PAPER,
        "telegram_alerts": False
    }

@app.put("/me/settings")
async def update_user_settings(
    settings_update: UserSettingsUpdate,
    current_user: User = Depends(get_current_user)
):
    user_settings = None
    for settings in user_settings_db:
        if settings.user_id == current_user.id:
            user_settings = settings
            break
    
    if not user_settings:
        user_settings = UserSettings(current_user.id)
        user_settings_db.append(user_settings)
    
    if settings_update.capital_per_day is not None:
        user_settings.capital_per_day = settings_update.capital_per_day
    if settings_update.max_trades_per_day is not None:
        user_settings.max_trades_per_day = settings_update.max_trades_per_day
    if settings_update.stop_loss_percent is not None:
        user_settings.stop_loss_percent = settings_update.stop_loss_percent
    if settings_update.broker is not None:
        user_settings.broker = settings_update.broker
    if settings_update.telegram_id is not None:
        user_settings.telegram_id = settings_update.telegram_id
    if settings_update.mode is not None:
        user_settings.mode = settings_update.mode
    if settings_update.telegram_alerts is not None:
        user_settings.telegram_alerts = settings_update.telegram_alerts
    
    return {"message": "Settings updated successfully"}

@app.post("/me/broker")
async def submit_broker_credentials(
    credentials: BrokerCredentials,
    current_user: User = Depends(get_current_user)
):
    try:
        encrypted_token = encrypt_data(f"{credentials.api_key}:{credentials.api_secret}")
        
        expires_at = datetime.now() + timedelta(days=365)  # 1 year expiry
        broker_token = BrokerToken(current_user.id, encrypted_token, expires_at)
        
        broker_tokens_db[:] = [bt for bt in broker_tokens_db if bt.user_id != current_user.id]
        broker_tokens_db.append(broker_token)
        
        for settings in user_settings_db:
            if settings.user_id == current_user.id:
                settings.broker = credentials.broker
                break
        
        logger.info(f"Broker credentials updated for user {current_user.id}")
        return {"message": "Broker credentials saved successfully"}
        
    except Exception as e:
        logger.error(f"Error saving broker credentials: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save broker credentials"
        )

@app.get("/me/broker/status")
async def get_broker_status(current_user: User = Depends(get_current_user)):
    for token in broker_tokens_db:
        if token.user_id == current_user.id and token.expires_at > datetime.now():
            return {"connected": True, "expires_at": token.expires_at}
    
    return {"connected": False, "expires_at": None}

@app.get("/me/dashboard", response_model=DashboardResponse)
async def get_dashboard(current_user: User = Depends(get_current_user)):
    user_trades = [t for t in trades_db if t.user_id == current_user.id]
    today = datetime.now().date()
    today_trades = [t for t in user_trades if t.timestamp.date() == today]
    
    total_pnl = sum(t.result for t in user_trades if t.result is not None)
    today_pnl = sum(t.result for t in today_trades if t.result is not None)
    
    user_mode = TradingMode.PAPER
    for settings in user_settings_db:
        if settings.user_id == current_user.id:
            user_mode = settings.mode
            break
    
    broker_connected = False
    for token in broker_tokens_db:
        if token.user_id == current_user.id and token.expires_at > datetime.now():
            broker_connected = True
            break
    
    recent_trades = []
    for trade in sorted(user_trades, key=lambda x: x.timestamp, reverse=True)[:10]:
        recent_trades.append(TradeResponse(
            id=trade.id,
            stock=trade.stock,
            action=trade.action,
            quantity=trade.quantity,
            price=trade.price,
            result=trade.result,
            timestamp=trade.timestamp
        ))
    
    return DashboardResponse(
        total_pnl=total_pnl,
        today_pnl=today_pnl,
        total_trades=len(user_trades),
        today_trades=len(today_trades),
        broker_connected=broker_connected,
        mode=user_mode,
        recent_trades=recent_trades
    )

@app.post("/me/screener")
async def run_screener(current_user: User = Depends(get_current_user)):
    try:
        selected_stocks = screener.screen_stocks()
        logger.info(f"Screener found {len(selected_stocks)} stocks for user {current_user.id}")
        return {"stocks": selected_stocks, "count": len(selected_stocks)}
    except Exception as e:
        logger.error(f"Error running screener: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to run stock screener"
        )

@app.post("/me/trade/buy")
async def manual_buy(
    stock: str,
    price: float,
    quantity: int,
    current_user: User = Depends(get_current_user)
):
    try:
        success = trading_engine.execute_buy_order(current_user.id, stock, price, quantity)
        if success:
            return {"message": f"Buy order executed for {quantity} shares of {stock}"}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to execute buy order"
            )
    except Exception as e:
        logger.error(f"Error executing buy order: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to execute buy order"
        )

@app.post("/me/trade/sell")
async def manual_sell(
    stock: str,
    price: float,
    quantity: int,
    current_user: User = Depends(get_current_user)
):
    try:
        success = trading_engine.execute_sell_order(current_user.id, stock, price, quantity)
        if success:
            return {"message": f"Sell order executed for {quantity} shares of {stock}"}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to execute sell order"
            )
    except Exception as e:
        logger.error(f"Error executing sell order: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to execute sell order"
        )

@app.get("/me/logs", response_model=List[LogResponse])
async def get_user_logs(current_user: User = Depends(get_current_user)):
    user_logs = [log for log in logs_db if log.user_id == current_user.id]
    user_logs.sort(key=lambda x: x.timestamp, reverse=True)
    
    return [
        LogResponse(id=log.id, message=log.message, timestamp=log.timestamp)
        for log in user_logs[:50]  # Return last 50 logs
    ]

@app.post("/me/backtest", response_model=BacktestResponse)
async def run_backtest(
    backtest_request: BacktestRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        import random
        
        results = {
            "start_date": backtest_request.start_date,
            "end_date": backtest_request.end_date,
            "total_trades": random.randint(50, 200),
            "winning_trades": random.randint(30, 120),
            "losing_trades": random.randint(20, 80),
            "total_pnl": round(random.uniform(-5000, 15000), 2),
            "win_rate": round(random.uniform(0.4, 0.7), 2),
            "max_drawdown": round(random.uniform(0.05, 0.25), 2),
            "sharpe_ratio": round(random.uniform(0.5, 2.0), 2),
            "equity_curve": [
                {"date": f"2024-01-{i:02d}", "value": 10000 + random.randint(-2000, 5000)}
                for i in range(1, 31)
            ]
        }
        
        backtest = Backtest(current_user.id, backtest_request.strategy, results)
        backtests_db.append(backtest)
        
        return BacktestResponse(
            id=backtest.id,
            strategy=backtest.strategy,
            results=results,
            created_at=backtest.created_at
        )
        
    except Exception as e:
        logger.error(f"Error running backtest: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to run backtest"
        )

@app.post("/forgot-password")
async def forgot_password(request: PasswordResetRequest):
    user = None
    for u in users_db:
        if u.email == request.email:
            user = u
            break
    
    if not user:
        return {"message": "If the email exists, a password reset link has been sent"}
    
    import secrets
    reset_token = secrets.token_urlsafe(32)
    
    password_reset_token = PasswordResetToken(user.id, reset_token)
    password_reset_tokens_db.append(password_reset_token)
    
    frontend_url = "https://auto-stock-trading-app-h4x8x8pn.devinapps.com"
    email_sent = email_service.send_password_reset_email(user.email, reset_token, frontend_url)
    
    if email_sent:
        logger.info(f"Password reset email sent to {user.email}")
    else:
        logger.error(f"Failed to send password reset email to {user.email}")
    
    return {"message": "If the email exists, a password reset link has been sent"}

@app.post("/reset-password")
async def reset_password(request: PasswordResetConfirm):
    reset_token = None
    for token in password_reset_tokens_db:
        if token.token == request.token and not token.used and token.expires_at > datetime.now():
            reset_token = token
            break
    
    if not reset_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    user = None
    for u in users_db:
        if u.id == reset_token.user_id:
            user = u
            break
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found"
        )
    
    user.hashed_password = get_password_hash(request.new_password)
    reset_token.used = True
    
    logger.info(f"Password reset completed for user {user.email}")
    return {"message": "Password reset successfully"}

@app.get("/admin/dashboard", response_model=AdminDashboardResponse)
async def get_admin_dashboard(admin_user: User = Depends(get_admin_user)):
    total_users = len(users_db)
    total_trades = len(trades_db)
    total_pnl = sum(t.result for t in trades_db if t.result is not None)
    
    today = datetime.now().date()
    active_users_today = len(set(t.user_id for t in trades_db if t.timestamp.date() == today))
    
    recent_users = []
    for user in sorted(users_db, key=lambda x: x.created_at, reverse=True)[:5]:
        user_trades = [t for t in trades_db if t.user_id == user.id]
        user_pnl = sum(t.result for t in user_trades if t.result is not None)
        
        recent_users.append(AdminUserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role,
            created_at=user.created_at,
            total_trades=len(user_trades),
            total_pnl=user_pnl
        ))
    
    return AdminDashboardResponse(
        total_users=total_users,
        total_trades=total_trades,
        total_pnl=total_pnl,
        active_users_today=active_users_today,
        recent_users=recent_users
    )

@app.get("/admin/users")
async def get_all_users(admin_user: User = Depends(get_admin_user), skip: int = 0, limit: int = 50):
    users_with_stats = []
    for user in users_db[skip:skip + limit]:
        user_trades = [t for t in trades_db if t.user_id == user.id]
        user_pnl = sum(t.result for t in user_trades if t.result is not None)
        
        users_with_stats.append(AdminUserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role,
            created_at=user.created_at,
            total_trades=len(user_trades),
            total_pnl=user_pnl
        ))
    
    return {
        "users": users_with_stats,
        "total": len(users_db),
        "skip": skip,
        "limit": limit
    }

@app.get("/admin/trades")
async def get_all_trades(admin_user: User = Depends(get_admin_user), skip: int = 0, limit: int = 100):
    all_trades = sorted(trades_db, key=lambda x: x.timestamp, reverse=True)
    trades_slice = all_trades[skip:skip + limit]
    
    trades_with_user = []
    for trade in trades_slice:
        user = None
        for u in users_db:
            if u.id == trade.user_id:
                user = u
                break
        
        trades_with_user.append({
            "id": trade.id,
            "user_name": user.name if user else "Unknown",
            "user_email": user.email if user else "Unknown",
            "stock": trade.stock,
            "action": trade.action,
            "quantity": trade.quantity,
            "price": trade.price,
            "result": trade.result,
            "timestamp": trade.timestamp
        })
    
    return {
        "trades": trades_with_user,
        "total": len(trades_db),
        "skip": skip,
        "limit": limit
    }

@app.get("/admin/logs")
async def get_all_logs(admin_user: User = Depends(get_admin_user), skip: int = 0, limit: int = 100):
    all_logs = sorted(logs_db, key=lambda x: x.timestamp, reverse=True)
    logs_slice = all_logs[skip:skip + limit]
    
    logs_with_user = []
    for log in logs_slice:
        user = None
        for u in users_db:
            if u.id == log.user_id:
                user = u
                break
        
        logs_with_user.append({
            "id": log.id,
            "user_name": user.name if user else "Unknown",
            "user_email": user.email if user else "Unknown",
            "message": log.message,
            "timestamp": log.timestamp
        })
    
    return {
        "logs": logs_with_user,
        "total": len(logs_db),
        "skip": skip,
        "limit": limit
    }

@app.post("/me/trade/manual")
async def execute_manual_trade(request: ManualTradeRequest, current_user: User = Depends(get_current_user)):
    try:
        success = trading_engine.execute_manual_trade(
            current_user.id, 
            request.stock_symbol, 
            request.action, 
            request.quantity, 
            request.price
        )
        
        if success:
            return {"message": f"Successfully executed {request.action.value} order for {request.stock_symbol}"}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to execute trade"
            )
    except Exception as e:
        logger.error(f"Manual trade error for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to execute manual trade"
        )

@app.get("/stocks/search")
async def search_stocks(q: str, current_user: User = Depends(get_current_user)):
    try:
        results = trading_engine.search_stocks(q)
        return {"stocks": results}
    except Exception as e:
        logger.error(f"Stock search error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to search stocks"
        )

@app.get("/stocks/{symbol}/quote", response_model=StockQuote)
async def get_stock_quote(symbol: str, current_user: User = Depends(get_current_user)):
    try:
        performance = trading_engine.get_stock_performance(symbol)
        return StockQuote(
            symbol=performance.symbol,
            current_price=performance.current_price,
            day_change=performance.day_change,
            day_change_percent=performance.day_change_percent,
            volume=performance.volume,
            market_cap=performance.market_cap,
            pe_ratio=performance.pe_ratio
        )
    except Exception as e:
        logger.error(f"Stock quote error for {symbol}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get stock quote"
        )

@app.get("/me/wishlist")
async def get_user_wishlist(current_user: User = Depends(get_current_user)):
    try:
        wishlist_items = trading_engine.get_user_wishlist(current_user.id)
        response_items = []
        
        for item in wishlist_items:
            current_price = trading_engine.get_current_stock_price(item.stock_symbol)
            response_items.append(WishlistResponse(
                id=item.id,
                stock_symbol=item.stock_symbol,
                target_price=item.target_price,
                notes=item.notes,
                current_price=current_price,
                created_at=item.created_at
            ))
        
        return response_items
    except Exception as e:
        logger.error(f"Wishlist fetch error for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch wishlist"
        )

@app.post("/me/wishlist")
async def add_to_wishlist(request: WishlistCreate, current_user: User = Depends(get_current_user)):
    try:
        success = trading_engine.add_to_wishlist(
            current_user.id,
            request.stock_symbol,
            request.target_price,
            request.notes
        )
        
        if success:
            return {"message": f"Added {request.stock_symbol} to wishlist"}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Stock already in wishlist"
            )
    except Exception as e:
        logger.error(f"Add to wishlist error for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add to wishlist"
        )

@app.delete("/me/wishlist/{wishlist_id}")
async def remove_from_wishlist(wishlist_id: int, current_user: User = Depends(get_current_user)):
    try:
        success = trading_engine.remove_from_wishlist(current_user.id, wishlist_id)
        
        if success:
            return {"message": "Removed from wishlist"}
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Wishlist item not found"
            )
    except Exception as e:
        logger.error(f"Remove from wishlist error for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove from wishlist"
        )

@app.get("/me/third-party-settings")
async def get_third_party_settings(current_user: User = Depends(get_current_user)):
    try:
        settings = next((s for s in third_party_settings_db if s.user_id == current_user.id), None)
        if not settings:
            settings = ThirdPartySettings(current_user.id)
            third_party_settings_db.append(settings)
        
        return {
            "email_service_provider": settings.email_service_provider,
            "news_api_key": "***" if settings.news_api_key else None,
            "telegram_bot_token": "***" if settings.telegram_bot_token else None,
            "webhook_url": settings.webhook_url
        }
    except Exception as e:
        logger.error(f"Error fetching third-party settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch settings")

@app.put("/me/third-party-settings")
async def update_third_party_settings(
    settings_update: ThirdPartySettingsUpdate,
    current_user: User = Depends(get_current_user)
):
    try:
        settings = next((s for s in third_party_settings_db if s.user_id == current_user.id), None)
        if not settings:
            settings = ThirdPartySettings(current_user.id)
            third_party_settings_db.append(settings)
        
        if settings_update.email_service_provider is not None:
            settings.email_service_provider = settings_update.email_service_provider
        if settings_update.email_api_key is not None:
            settings.email_api_key = encrypt_data(settings_update.email_api_key)
        if settings_update.news_api_key is not None:
            settings.news_api_key = encrypt_data(settings_update.news_api_key)
        if settings_update.telegram_bot_token is not None:
            settings.telegram_bot_token = encrypt_data(settings_update.telegram_bot_token)
        if settings_update.webhook_url is not None:
            settings.webhook_url = settings_update.webhook_url
        
        log = Log(current_user.id, "Updated third-party integration settings")
        logs_db.append(log)
        
        return {"message": "Third-party settings updated successfully"}
    except Exception as e:
        logger.error(f"Error updating third-party settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to update settings")

@app.get("/news/sentiment/{symbol}")
async def get_news_sentiment(symbol: str, current_user: User = Depends(get_current_user)):
    try:
        third_party_settings = next((s for s in third_party_settings_db if s.user_id == current_user.id), None)
        if not third_party_settings or not third_party_settings.news_api_key:
            raise HTTPException(status_code=400, detail="News API key not configured")
        
        api_key = decrypt_data(third_party_settings.news_api_key)
        analyses = news_service.process_news_for_stock(symbol, api_key)
        
        return [NewsAnalysisResponse(
            id=a.id,
            stock_symbol=a.stock_symbol,
            headline=a.headline,
            sentiment_score=a.sentiment_score,
            source=a.source,
            impact_score=a.impact_score,
            timestamp=a.timestamp
        ) for a in analyses]
    except Exception as e:
        logger.error(f"Error fetching news sentiment: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch news sentiment")

@app.get("/news/market-sentiment")
async def get_market_sentiment(symbols: str, current_user: User = Depends(get_current_user)):
    try:
        symbol_list = symbols.split(",")
        sentiment_summary = news_service.get_market_sentiment_summary(symbol_list)
        return sentiment_summary
    except Exception as e:
        logger.error(f"Error fetching market sentiment: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch market sentiment")

@app.get("/me/strategies")
async def get_user_strategies(current_user: User = Depends(get_current_user)):
    try:
        user_strategies = [s for s in trading_strategies_db if s.user_id == current_user.id]
        return [TradingStrategyResponse(
            id=s.id,
            name=s.name,
            parameters=s.parameters,
            is_active=s.is_active,
            risk_level=s.risk_level,
            created_at=s.created_at
        ) for s in user_strategies]
    except Exception as e:
        logger.error(f"Error fetching strategies: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch strategies")

@app.post("/me/strategies")
async def create_strategy(
    strategy: TradingStrategyCreate,
    current_user: User = Depends(get_current_user)
):
    try:
        from .models import TradingStrategy
        new_strategy = TradingStrategy(
            user_id=current_user.id,
            name=strategy.name,
            parameters=strategy.parameters,
            risk_level=strategy.risk_level
        )
        trading_strategies_db.append(new_strategy)
        
        log = Log(current_user.id, f"Created trading strategy: {strategy.name}")
        logs_db.append(log)
        
        return TradingStrategyResponse(
            id=new_strategy.id,
            name=new_strategy.name,
            parameters=new_strategy.parameters,
            is_active=new_strategy.is_active,
            risk_level=new_strategy.risk_level,
            created_at=new_strategy.created_at
        )
    except Exception as e:
        logger.error(f"Error creating strategy: {e}")
        raise HTTPException(status_code=500, detail="Failed to create strategy")

@app.get("/me/bucket-orders")
async def get_bucket_orders(current_user: User = Depends(get_current_user)):
    try:
        user_orders = [o for o in bucket_orders_db if o.user_id == current_user.id]
        return [BucketOrderResponse(
            id=o.id,
            name=o.name,
            stocks=o.stocks,
            scheduled_time=o.scheduled_time,
            total_capital=o.total_capital,
            execution_type=o.execution_type,
            status=o.status,
            created_at=o.created_at
        ) for o in user_orders]
    except Exception as e:
        logger.error(f"Error fetching bucket orders: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch bucket orders")

@app.post("/me/bucket-orders")
async def create_bucket_order(
    bucket_order: BucketOrderCreate,
    current_user: User = Depends(get_current_user)
):
    try:
        from .models import BucketOrder
        new_order = BucketOrder(
            user_id=current_user.id,
            name=bucket_order.name,
            stocks=bucket_order.stocks,
            scheduled_time=bucket_order.scheduled_time,
            total_capital=bucket_order.total_capital,
            execution_type=bucket_order.execution_type
        )
        bucket_orders_db.append(new_order)
        
        log = Log(current_user.id, f"Created bucket order: {bucket_order.name}")
        logs_db.append(log)
        
        return BucketOrderResponse(
            id=new_order.id,
            name=new_order.name,
            stocks=new_order.stocks,
            scheduled_time=new_order.scheduled_time,
            total_capital=new_order.total_capital,
            execution_type=new_order.execution_type,
            status=new_order.status,
            created_at=new_order.created_at
        )
    except Exception as e:
        logger.error(f"Error creating bucket order: {e}")
        raise HTTPException(status_code=500, detail="Failed to create bucket order")

@app.post("/me/export")
async def create_export_request(
    export_request: ExportRequestCreate,
    current_user: User = Depends(get_current_user)
):
    try:
        from .models import ExportRequest
        new_request = ExportRequest(
            user_id=current_user.id,
            export_type=export_request.export_type,
            format_type=export_request.format_type,
            date_range=export_request.date_range,
            filters=export_request.filters
        )
        export_requests_db.append(new_request)
        
        try:
            file_path = export_service.process_export_request(new_request)
            log = Log(current_user.id, f"Generated {export_request.export_type} export")
            logs_db.append(log)
        except Exception as e:
            logger.error(f"Export processing failed: {e}")
        
        return ExportRequestResponse(
            id=new_request.id,
            export_type=new_request.export_type,
            format_type=new_request.format_type,
            status=new_request.status,
            file_path=new_request.file_path,
            created_at=new_request.created_at
        )
    except Exception as e:
        logger.error(f"Error creating export request: {e}")
        raise HTTPException(status_code=500, detail="Failed to create export request")

@app.get("/me/exports")
async def get_export_requests(current_user: User = Depends(get_current_user)):
    try:
        user_exports = [e for e in export_requests_db if e.user_id == current_user.id]
        return [ExportRequestResponse(
            id=e.id,
            export_type=e.export_type,
            format_type=e.format_type,
            status=e.status,
            file_path=e.file_path,
            created_at=e.created_at
        ) for e in user_exports]
    except Exception as e:
        logger.error(f"Error fetching export requests: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch export requests")

@app.get("/me/analytics/advanced")
async def get_advanced_analytics(
    days: int = 30,
    current_user: User = Depends(get_current_user)
):
    try:
        metrics = analytics_service.calculate_portfolio_metrics(current_user.id, days)
        return AdvancedAnalyticsResponse(**metrics)
    except Exception as e:
        logger.error(f"Error fetching advanced analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch analytics")
