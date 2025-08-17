import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import logging
from .models import trades_db, User, users_db

logger = logging.getLogger(__name__)

class AnalyticsService:
    def __init__(self):
        pass
    
    def calculate_portfolio_metrics(self, user_id: int, days: int = 30) -> Dict:
        """Calculate advanced portfolio metrics"""
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
            
            user_trades = [
                trade for trade in trades_db
                if trade.user_id == user_id and
                start_date <= trade.timestamp <= end_date
            ]
            
            if not user_trades:
                return self._empty_metrics()
            
            daily_returns = self._calculate_daily_returns(user_trades)
            
            portfolio_values = self._calculate_portfolio_progression(user_trades)
            
            total_return = sum(trade.result or 0 for trade in user_trades)
            total_invested = sum(trade.price * trade.quantity for trade in user_trades if trade.action == "buy")
            
            if total_invested > 0:
                return_percentage = (total_return / total_invested) * 100
            else:
                return_percentage = 0
            
            sharpe_ratio = self._calculate_sharpe_ratio(daily_returns)
            max_drawdown = self._calculate_max_drawdown(portfolio_values)
            volatility = self._calculate_volatility(daily_returns)
            
            winning_trades = [t for t in user_trades if (t.result or 0) > 0]
            losing_trades = [t for t in user_trades if (t.result or 0) < 0]
            
            win_rate = len(winning_trades) / len(user_trades) * 100 if user_trades else 0
            avg_win = np.mean([t.result for t in winning_trades]) if winning_trades else 0
            avg_loss = np.mean([t.result for t in losing_trades]) if losing_trades else 0
            
            total_wins = sum(t.result for t in winning_trades)
            total_losses = abs(sum(t.result for t in losing_trades))
            profit_factor = total_wins / total_losses if total_losses > 0 else float('inf')
            
            return {
                "portfolio_value": portfolio_values[-1] if portfolio_values else 0,
                "total_return": total_return,
                "return_percentage": return_percentage,
                "sharpe_ratio": sharpe_ratio,
                "max_drawdown": max_drawdown,
                "volatility": volatility,
                "win_rate": win_rate,
                "avg_trade_duration": self._calculate_avg_trade_duration(user_trades),
                "total_trades": len(user_trades),
                "winning_trades": len(winning_trades),
                "losing_trades": len(losing_trades),
                "avg_win": avg_win,
                "avg_loss": avg_loss,
                "profit_factor": profit_factor,
                "risk_metrics": {
                    "value_at_risk": self._calculate_var(daily_returns),
                    "beta": self._calculate_beta(daily_returns),
                    "alpha": self._calculate_alpha(daily_returns, total_return)
                },
                "performance_chart_data": self._prepare_chart_data(user_trades, portfolio_values)
            }
            
        except Exception as e:
            logger.error(f"Error calculating portfolio metrics: {e}")
            return self._empty_metrics()
    
    def _empty_metrics(self) -> Dict:
        """Return empty metrics structure"""
        return {
            "portfolio_value": 0,
            "total_return": 0,
            "return_percentage": 0,
            "sharpe_ratio": 0,
            "max_drawdown": 0,
            "volatility": 0,
            "win_rate": 0,
            "avg_trade_duration": 0,
            "total_trades": 0,
            "winning_trades": 0,
            "losing_trades": 0,
            "avg_win": 0,
            "avg_loss": 0,
            "profit_factor": 0,
            "risk_metrics": {"value_at_risk": 0, "beta": 0, "alpha": 0},
            "performance_chart_data": []
        }
    
    def _calculate_daily_returns(self, trades: List) -> List[float]:
        """Calculate daily returns from trades"""
        try:
            daily_pnl = {}
            for trade in trades:
                date_key = trade.timestamp.strftime('%Y-%m-%d')
                if date_key not in daily_pnl:
                    daily_pnl[date_key] = 0
                daily_pnl[date_key] += trade.result or 0
            
            returns = list(daily_pnl.values())
            return returns if returns else [0]
            
        except Exception:
            return [0]
    
    def _calculate_portfolio_progression(self, trades: List) -> List[float]:
        """Calculate portfolio value progression over time"""
        try:
            portfolio_values = [10000]  # Starting value
            
            for trade in sorted(trades, key=lambda x: x.timestamp):
                current_value = portfolio_values[-1] + (trade.result or 0)
                portfolio_values.append(max(0, current_value))
            
            return portfolio_values
            
        except Exception:
            return [10000]
    
    def _calculate_sharpe_ratio(self, returns: List[float], risk_free_rate: float = 0.05) -> float:
        """Calculate Sharpe ratio"""
        try:
            if not returns or len(returns) < 2:
                return 0
            
            returns_array = np.array(returns)
            excess_returns = returns_array - (risk_free_rate / 252)  # Daily risk-free rate
            
            if np.std(excess_returns) == 0:
                return 0
            
            return np.mean(excess_returns) / np.std(excess_returns) * np.sqrt(252)
            
        except Exception:
            return 0
    
    def _calculate_max_drawdown(self, portfolio_values: List[float]) -> float:
        """Calculate maximum drawdown"""
        try:
            if len(portfolio_values) < 2:
                return 0
            
            peak = portfolio_values[0]
            max_dd = 0
            
            for value in portfolio_values[1:]:
                if value > peak:
                    peak = value
                else:
                    drawdown = (peak - value) / peak * 100
                    max_dd = max(max_dd, drawdown)
            
            return max_dd
            
        except Exception:
            return 0
    
    def _calculate_volatility(self, returns: List[float]) -> float:
        """Calculate annualized volatility"""
        try:
            if len(returns) < 2:
                return 0
            
            return np.std(returns) * np.sqrt(252) * 100  # Annualized percentage
            
        except Exception:
            return 0
    
    def _calculate_avg_trade_duration(self, trades: List) -> float:
        """Calculate average trade duration in hours"""
        try:
            if len(trades) < 2:
                return 0
            
            positions = {}
            durations = []
            
            for trade in sorted(trades, key=lambda x: x.timestamp):
                if trade.action == "buy":
                    positions[trade.stock] = trade.timestamp
                elif trade.action == "sell" and trade.stock in positions:
                    duration = (trade.timestamp - positions[trade.stock]).total_seconds() / 3600
                    durations.append(duration)
                    del positions[trade.stock]
            
            return np.mean(durations) if durations else 0
            
        except Exception:
            return 0
    
    def _calculate_var(self, returns: List[float], confidence: float = 0.05) -> float:
        """Calculate Value at Risk"""
        try:
            if len(returns) < 10:
                return 0
            
            return np.percentile(returns, confidence * 100)
            
        except Exception:
            return 0
    
    def _calculate_beta(self, returns: List[float], market_return: float = 0.12) -> float:
        """Calculate beta (simplified using market average)"""
        try:
            if len(returns) < 10:
                return 1.0
            
            portfolio_volatility = np.std(returns)
            market_volatility = 0.15  # Assumed market volatility
            correlation = 0.7  # Assumed correlation with market
            
            return correlation * (portfolio_volatility / market_volatility)
            
        except Exception:
            return 1.0
    
    def _calculate_alpha(self, returns: List[float], total_return: float) -> float:
        """Calculate alpha"""
        try:
            if not returns:
                return 0
            
            portfolio_return = total_return / len(returns) if returns else 0
            market_return = 0.12 / 252  # Daily market return
            risk_free_rate = 0.05 / 252  # Daily risk-free rate
            beta = self._calculate_beta(returns)
            
            alpha = portfolio_return - (risk_free_rate + beta * (market_return - risk_free_rate))
            return alpha * 252 * 100  # Annualized percentage
            
        except Exception:
            return 0
    
    def _prepare_chart_data(self, trades: List, portfolio_values: List[float]) -> List[Dict]:
        """Prepare data for performance charts"""
        try:
            chart_data = []
            
            for i, value in enumerate(portfolio_values):
                chart_data.append({
                    "date": (datetime.now() - timedelta(days=len(portfolio_values)-i)).strftime('%Y-%m-%d'),
                    "portfolio_value": value,
                    "cumulative_return": ((value - portfolio_values[0]) / portfolio_values[0] * 100) if portfolio_values[0] > 0 else 0
                })
            
            return chart_data
            
        except Exception:
            return []

analytics_service = AnalyticsService()
