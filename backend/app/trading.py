from typing import List, Dict, Optional
from datetime import datetime
import logging
import random
from .models import (User, UserSettings, Trade, Log, TradeAction, TradingMode, Wishlist, StockPerformance,
                     user_settings_db, trades_db, logs_db, wishlist_db)
from .screener import screener

logger = logging.getLogger(__name__)

class TradingEngine:
    def __init__(self):
        self.market_open_time = "09:15"
        self.market_close_time = "15:15"
    
    def get_user_settings(self, user_id: int) -> Optional[UserSettings]:
        """Get user trading settings"""
        for settings in user_settings_db:
            if settings.user_id == user_id:
                return settings
        return None
    
    def log_trade_activity(self, user_id: int, message: str):
        """Log trading activity"""
        log = Log(user_id, message)
        logs_db.append(log)
        logger.info(f"User {user_id}: {message}")
    
    def calculate_position_size(self, user_settings: UserSettings, stock_price: float) -> int:
        """Calculate position size based on user capital"""
        max_position_value = user_settings.capital_per_day / user_settings.max_trades_per_day
        quantity = int(max_position_value / stock_price)
        return max(1, quantity)  # At least 1 share
    
    def execute_buy_order(self, user_id: int, stock: str, price: float, quantity: int) -> bool:
        """Execute buy order (simulated for paper trading)"""
        try:
            trade = Trade(user_id, stock, TradeAction.BUY, quantity, price)
            trades_db.append(trade)
            
            self.log_trade_activity(
                user_id, 
                f"BUY {quantity} shares of {stock} at ₹{price:.2f}"
            )
            return True
        except Exception as e:
            self.log_trade_activity(user_id, f"Failed to buy {stock}: {str(e)}")
            return False
    
    def execute_sell_order(self, user_id: int, stock: str, price: float, quantity: int) -> bool:
        """Execute sell order (simulated for paper trading)"""
        try:
            trade = Trade(user_id, stock, TradeAction.SELL, quantity, price)
            trades_db.append(trade)
            
            buy_trades = [t for t in trades_db if t.user_id == user_id and t.stock == stock and t.action == TradeAction.BUY]
            if buy_trades:
                buy_price = buy_trades[-1].price  # Use last buy price
                pnl = (price - buy_price) * quantity
                trade.result = pnl
                
                self.log_trade_activity(
                    user_id,
                    f"SELL {quantity} shares of {stock} at ₹{price:.2f} (P&L: ₹{pnl:.2f})"
                )
            else:
                self.log_trade_activity(
                    user_id,
                    f"SELL {quantity} shares of {stock} at ₹{price:.2f}"
                )
            
            return True
        except Exception as e:
            self.log_trade_activity(user_id, f"Failed to sell {stock}: {str(e)}")
            return False
    
    def get_user_positions(self, user_id: int) -> Dict[str, int]:
        """Get current positions for a user"""
        positions = {}
        user_trades = [t for t in trades_db if t.user_id == user_id]
        
        for trade in user_trades:
            if trade.stock not in positions:
                positions[trade.stock] = 0
            
            if trade.action == TradeAction.BUY:
                positions[trade.stock] += trade.quantity
            else:
                positions[trade.stock] -= trade.quantity
        
        return {stock: qty for stock, qty in positions.items() if qty > 0}
    
    def execute_morning_buy_orders(self, user_id: int) -> List[Dict]:
        """Execute buy orders at market open"""
        user_settings = self.get_user_settings(user_id)
        if not user_settings or user_settings.mode != TradingMode.PAPER:
            return []
        
        selected_stocks = screener.screen_stocks()
        executed_trades = []
        
        max_trades = min(len(selected_stocks), user_settings.max_trades_per_day)
        
        for i in range(max_trades):
            stock_data = selected_stocks[i]
            stock_symbol = stock_data["symbol"]
            stock_price = stock_data["price"]
            
            quantity = self.calculate_position_size(user_settings, stock_price)
            
            if self.execute_buy_order(user_id, stock_symbol, stock_price, quantity):
                executed_trades.append({
                    "stock": stock_symbol,
                    "action": "BUY",
                    "quantity": quantity,
                    "price": stock_price
                })
        
        return executed_trades
    
    def execute_evening_sell_orders(self, user_id: int) -> List[Dict]:
        """Execute sell orders at market close"""
        user_settings = self.get_user_settings(user_id)
        if not user_settings or user_settings.mode != TradingMode.PAPER:
            return []
        
        positions = self.get_user_positions(user_id)
        executed_trades = []
        
        for stock, quantity in positions.items():
            import random
            last_buy_trade = None
            for trade in reversed(trades_db):
                if trade.user_id == user_id and trade.stock == stock and trade.action == TradeAction.BUY:
                    last_buy_trade = trade
                    break
            
            if last_buy_trade:
                price_change = random.uniform(-0.03, 0.03)  # -3% to +3%
                current_price = last_buy_trade.price * (1 + price_change)
                
                if self.execute_sell_order(user_id, stock, current_price, quantity):
                    executed_trades.append({
                        "stock": stock,
                        "action": "SELL",
                        "quantity": quantity,
                        "price": current_price
                    })
        
        return executed_trades
    
    def execute_manual_trade(self, user_id: int, stock_symbol: str, action: TradeAction, 
                           quantity: int, price: Optional[float] = None) -> bool:
        """Execute manual buy/sell order"""
        user_settings = self.get_user_settings(user_id)
        if not user_settings:
            self.log_trade_activity(user_id, f"Failed to execute {action.value}: No user settings found")
            return False
        
        if price is None:
            price = self.get_current_stock_price(stock_symbol)
        
        if action == TradeAction.BUY:
            return self.execute_buy_order(user_id, stock_symbol, price, quantity)
        else:
            return self.execute_sell_order(user_id, stock_symbol, price, quantity)
    
    def get_current_stock_price(self, symbol: str) -> float:
        """Get current stock price (simulated)"""
        base_prices = {
            "RELIANCE": 2500.0,
            "TCS": 3200.0,
            "INFY": 1400.0,
            "HDFCBANK": 1600.0,
            "ICICIBANK": 900.0,
            "SBIN": 550.0,
            "ITC": 420.0,
            "BHARTIARTL": 850.0,
            "KOTAKBANK": 1800.0,
            "LT": 2100.0
        }
        base_price = base_prices.get(symbol, 1000.0)
        variation = random.uniform(-0.05, 0.05)  # ±5%
        return round(base_price * (1 + variation), 2)
    
    def get_stock_performance(self, symbol: str) -> StockPerformance:
        """Get stock performance data (simulated)"""
        current_price = self.get_current_stock_price(symbol)
        day_change = random.uniform(-50, 50)
        day_change_percent = (day_change / current_price) * 100
        volume = random.randint(100000, 10000000)
        market_cap = current_price * random.randint(1000000, 100000000)
        pe_ratio = random.uniform(10, 50)
        
        return StockPerformance(
            symbol=symbol,
            current_price=current_price,
            day_change=day_change,
            day_change_percent=day_change_percent,
            volume=volume,
            market_cap=market_cap,
            pe_ratio=pe_ratio
        )
    
    def search_stocks(self, query: str) -> List[Dict]:
        """Search for stocks by symbol or name"""
        stocks = [
            {"symbol": "RELIANCE", "name": "Reliance Industries Ltd", "exchange": "NSE"},
            {"symbol": "TCS", "name": "Tata Consultancy Services", "exchange": "NSE"},
            {"symbol": "INFY", "name": "Infosys Ltd", "exchange": "NSE"},
            {"symbol": "HDFCBANK", "name": "HDFC Bank Ltd", "exchange": "NSE"},
            {"symbol": "ICICIBANK", "name": "ICICI Bank Ltd", "exchange": "NSE"},
            {"symbol": "SBIN", "name": "State Bank of India", "exchange": "NSE"},
            {"symbol": "ITC", "name": "ITC Ltd", "exchange": "NSE"},
            {"symbol": "BHARTIARTL", "name": "Bharti Airtel Ltd", "exchange": "NSE"},
            {"symbol": "KOTAKBANK", "name": "Kotak Mahindra Bank", "exchange": "NSE"},
            {"symbol": "LT", "name": "Larsen & Toubro Ltd", "exchange": "NSE"},
        ]
        
        query_upper = query.upper()
        results = []
        for stock in stocks:
            if query_upper in stock["symbol"] or query_upper in stock["name"].upper():
                stock_with_price = stock.copy()
                stock_with_price["current_price"] = self.get_current_stock_price(stock["symbol"])
                results.append(stock_with_price)
        
        return results[:10]  # Limit to 10 results
    
    def add_to_wishlist(self, user_id: int, stock_symbol: str, target_price: Optional[float] = None, 
                       notes: Optional[str] = None) -> bool:
        """Add stock to user's wishlist"""
        for item in wishlist_db:
            if item.user_id == user_id and item.stock_symbol == stock_symbol:
                return False  # Already exists
        
        wishlist_item = Wishlist(user_id, stock_symbol, target_price, notes)
        wishlist_db.append(wishlist_item)
        self.log_trade_activity(user_id, f"Added {stock_symbol} to wishlist")
        return True
    
    def remove_from_wishlist(self, user_id: int, wishlist_id: int) -> bool:
        """Remove stock from user's wishlist"""
        for i, item in enumerate(wishlist_db):
            if item.id == wishlist_id and item.user_id == user_id:
                removed_item = wishlist_db.pop(i)
                self.log_trade_activity(user_id, f"Removed {removed_item.stock_symbol} from wishlist")
                return True
        return False
    
    def get_user_wishlist(self, user_id: int) -> List[Wishlist]:
        """Get user's wishlist"""
        return [item for item in wishlist_db if item.user_id == user_id]

trading_engine = TradingEngine()
