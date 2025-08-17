from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import logging
from .models import users_db, user_settings_db, TradingMode
from .trading import trading_engine

logger = logging.getLogger(__name__)

class TradingScheduler:
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.setup_jobs()
    
    def setup_jobs(self):
        """Setup scheduled trading jobs"""
        self.scheduler.add_job(
            func=self.execute_morning_trades,
            trigger=CronTrigger(hour=9, minute=15, day_of_week='mon-fri'),
            id='morning_trades',
            name='Execute Morning Buy Orders',
            replace_existing=True
        )
        
        self.scheduler.add_job(
            func=self.execute_evening_trades,
            trigger=CronTrigger(hour=15, minute=15, day_of_week='mon-fri'),
            id='evening_trades',
            name='Execute Evening Sell Orders',
            replace_existing=True
        )
        
        self.scheduler.add_job(
            func=self.run_daily_screener,
            trigger=CronTrigger(hour=8, minute=45, day_of_week='mon-fri'),
            id='daily_screener',
            name='Run Daily Stock Screener',
            replace_existing=True
        )
    
    def execute_morning_trades(self):
        """Execute buy orders for all active users"""
        logger.info("Starting morning trading session...")
        
        active_users = []
        for settings in user_settings_db:
            if settings.mode == TradingMode.PAPER:  # Only paper trading for now
                active_users.append(settings.user_id)
        
        for user_id in active_users:
            try:
                trades = trading_engine.execute_morning_buy_orders(user_id)
                logger.info(f"Executed {len(trades)} buy orders for user {user_id}")
            except Exception as e:
                logger.error(f"Error executing morning trades for user {user_id}: {e}")
        
        logger.info("Morning trading session completed")
    
    def execute_evening_trades(self):
        """Execute sell orders for all active users"""
        logger.info("Starting evening trading session...")
        
        active_users = []
        for settings in user_settings_db:
            if settings.mode == TradingMode.PAPER:  # Only paper trading for now
                active_users.append(settings.user_id)
        
        for user_id in active_users:
            try:
                trades = trading_engine.execute_evening_sell_orders(user_id)
                logger.info(f"Executed {len(trades)} sell orders for user {user_id}")
            except Exception as e:
                logger.error(f"Error executing evening trades for user {user_id}: {e}")
        
        logger.info("Evening trading session completed")
    
    def run_daily_screener(self):
        """Run daily stock screener"""
        logger.info("Running daily stock screener...")
        try:
            from .screener import screener
            selected_stocks = screener.screen_stocks()
            logger.info(f"Daily screener found {len(selected_stocks)} stocks")
        except Exception as e:
            logger.error(f"Error running daily screener: {e}")
    
    def start(self):
        """Start the scheduler"""
        if not self.scheduler.running:
            self.scheduler.start()
            logger.info("Trading scheduler started")
    
    def stop(self):
        """Stop the scheduler"""
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("Trading scheduler stopped")

trading_scheduler = TradingScheduler()
