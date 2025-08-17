import yfinance as yf
import pandas as pd
import ta
from typing import List, Dict
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class StockScreener:
    def __init__(self):
        self.stock_universe = [
            "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "HINDUNILVR.NS",
            "ICICIBANK.NS", "KOTAKBANK.NS", "SBIN.NS", "BHARTIARTL.NS", "ITC.NS",
            "ASIANPAINT.NS", "MARUTI.NS", "AXISBANK.NS", "LT.NS", "SUNPHARMA.NS",
            "TITAN.NS", "ULTRACEMCO.NS", "WIPRO.NS", "NESTLEIND.NS", "POWERGRID.NS"
        ]
    
    def get_stock_data(self, symbol: str, period: str = "30d") -> pd.DataFrame:
        """Fetch stock data from Yahoo Finance"""
        try:
            stock = yf.Ticker(symbol)
            data = stock.history(period=period)
            return data
        except Exception as e:
            logger.error(f"Error fetching data for {symbol}: {e}")
            return pd.DataFrame()
    
    def calculate_rsi(self, data: pd.DataFrame, period: int = 14) -> float:
        """Calculate RSI indicator"""
        if len(data) < period:
            return 0
        rsi = ta.momentum.RSIIndicator(data['Close'], window=period)
        return rsi.rsi().iloc[-1]
    
    def calculate_macd(self, data: pd.DataFrame) -> Dict[str, float]:
        """Calculate MACD indicator"""
        if len(data) < 26:
            return {"macd": 0, "signal": 0, "histogram": 0}
        
        macd = ta.trend.MACD(data['Close'])
        return {
            "macd": macd.macd().iloc[-1],
            "signal": macd.macd_signal().iloc[-1],
            "histogram": macd.macd_diff().iloc[-1]
        }
    
    def calculate_momentum(self, data: pd.DataFrame, period: int = 5) -> float:
        """Calculate 5-day momentum"""
        if len(data) < period:
            return 0
        return ((data['Close'].iloc[-1] / data['Close'].iloc[-period]) - 1) * 100
    
    def calculate_volume_spike(self, data: pd.DataFrame, period: int = 20) -> float:
        """Calculate volume spike ratio"""
        if len(data) < period:
            return 0
        avg_volume = data['Volume'].rolling(window=period).mean().iloc[-1]
        current_volume = data['Volume'].iloc[-1]
        return current_volume / avg_volume if avg_volume > 0 else 0
    
    def screen_stocks(self) -> List[Dict]:
        """Screen stocks based on technical indicators"""
        selected_stocks = []
        
        for symbol in self.stock_universe:
            try:
                data = self.get_stock_data(symbol)
                if data.empty or len(data) < 30:
                    continue
                
                rsi = self.calculate_rsi(data)
                macd_data = self.calculate_macd(data)
                momentum = self.calculate_momentum(data)
                volume_spike = self.calculate_volume_spike(data)
                current_price = data['Close'].iloc[-1]
                
                if (rsi > 50 and 
                    macd_data["histogram"] > 0 and  # MACD crossover
                    momentum > 2 and  # Positive momentum
                    volume_spike > 1.2 and  # Volume spike
                    current_price > 50):  # Filter penny stocks
                    
                    stock_info = {
                        "symbol": symbol.replace(".NS", ""),
                        "price": round(current_price, 2),
                        "rsi": round(rsi, 2),
                        "momentum": round(momentum, 2),
                        "volume_spike": round(volume_spike, 2),
                        "macd_histogram": round(macd_data["histogram"], 4)
                    }
                    selected_stocks.append(stock_info)
                    
            except Exception as e:
                logger.error(f"Error screening {symbol}: {e}")
                continue
        
        selected_stocks.sort(key=lambda x: x["momentum"], reverse=True)
        return selected_stocks[:10]

screener = StockScreener()
