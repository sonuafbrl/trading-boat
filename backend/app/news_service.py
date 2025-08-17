import requests
import json
from datetime import datetime, timedelta
from typing import List, Dict
import logging
from .models import NewsAnalysis, news_analysis_db

logger = logging.getLogger(__name__)

class NewsService:
    def __init__(self):
        self.news_sources = {
            "newsapi": "https://newsapi.org/v2/everything",
            "alpha_vantage": "https://www.alphavantage.co/query",
            "finnhub": "https://finnhub.io/api/v1/news"
        }
    
    def get_stock_news(self, symbol: str, api_key: str, days: int = 7) -> List[Dict]:
        """Fetch news for a specific stock symbol"""
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
            
            url = self.news_sources["newsapi"]
            params = {
                "q": f"{symbol} stock",
                "from": start_date.strftime("%Y-%m-%d"),
                "to": end_date.strftime("%Y-%m-%d"),
                "sortBy": "relevancy",
                "apiKey": api_key,
                "language": "en"
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            return data.get("articles", [])
            
        except Exception as e:
            logger.error(f"Error fetching news for {symbol}: {e}")
            return []
    
    def analyze_sentiment(self, text: str) -> float:
        """Analyze sentiment of news text. Returns score between -1 (negative) and 1 (positive)"""
        try:
            positive_keywords = [
                "profit", "growth", "increase", "rise", "gain", "positive", "strong",
                "bullish", "upgrade", "buy", "outperform", "beat", "exceed", "success"
            ]
            negative_keywords = [
                "loss", "decline", "fall", "drop", "negative", "weak", "bearish",
                "downgrade", "sell", "underperform", "miss", "fail", "concern", "risk"
            ]
            
            text_lower = text.lower()
            positive_count = sum(1 for word in positive_keywords if word in text_lower)
            negative_count = sum(1 for word in negative_keywords if word in text_lower)
            
            total_words = len(text.split())
            if total_words == 0:
                return 0.0
            
            sentiment_score = (positive_count - negative_count) / max(total_words / 10, 1)
            return max(-1.0, min(1.0, sentiment_score))
            
        except Exception as e:
            logger.error(f"Error analyzing sentiment: {e}")
            return 0.0
    
    def calculate_impact_score(self, sentiment: float, source_credibility: float = 0.5) -> float:
        """Calculate impact score based on sentiment and source credibility"""
        return abs(sentiment) * source_credibility
    
    def process_news_for_stock(self, symbol: str, api_key: str) -> List[NewsAnalysis]:
        """Process news and create sentiment analysis records"""
        try:
            articles = self.get_stock_news(symbol, api_key)
            analyses = []
            
            for article in articles[:10]:  # Limit to 10 most relevant articles
                headline = article.get("title", "")
                description = article.get("description", "")
                source = article.get("source", {}).get("name", "Unknown")
                
                full_text = f"{headline} {description}"
                sentiment_score = self.analyze_sentiment(full_text)
                impact_score = self.calculate_impact_score(sentiment_score)
                
                analysis = NewsAnalysis(
                    stock_symbol=symbol,
                    headline=headline,
                    sentiment_score=sentiment_score,
                    source=source,
                    impact_score=impact_score
                )
                
                news_analysis_db.append(analysis)
                analyses.append(analysis)
            
            return analyses
            
        except Exception as e:
            logger.error(f"Error processing news for {symbol}: {e}")
            return []
    
    def get_market_sentiment_summary(self, symbols: List[str]) -> Dict:
        """Get overall market sentiment for a list of symbols"""
        try:
            recent_analyses = [
                analysis for analysis in news_analysis_db
                if analysis.stock_symbol in symbols and
                analysis.timestamp > datetime.now() - timedelta(hours=24)
            ]
            
            if not recent_analyses:
                return {"overall_sentiment": 0.0, "confidence": 0.0, "total_articles": 0}
            
            avg_sentiment = sum(a.sentiment_score for a in recent_analyses) / len(recent_analyses)
            avg_impact = sum(a.impact_score for a in recent_analyses) / len(recent_analyses)
            
            return {
                "overall_sentiment": avg_sentiment,
                "confidence": avg_impact,
                "total_articles": len(recent_analyses),
                "positive_articles": len([a for a in recent_analyses if a.sentiment_score > 0.1]),
                "negative_articles": len([a for a in recent_analyses if a.sentiment_score < -0.1])
            }
            
        except Exception as e:
            logger.error(f"Error calculating market sentiment: {e}")
            return {"overall_sentiment": 0.0, "confidence": 0.0, "total_articles": 0}

news_service = NewsService()
