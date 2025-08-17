from typing import List, Dict, Optional
from datetime import datetime
import logging
from .models import User, UserSettings, Trade, Log, TradeAction, TradingMode, user_settings_db, trades_db, logs_db
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

trading_engine = TradingEngine()
