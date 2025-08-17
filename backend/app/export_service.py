import csv
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import logging
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
import io
import os
from .models import (
    trades_db, logs_db, ExportRequest, export_requests_db, 
    User, users_db, wishlist_db
)

logger = logging.getLogger(__name__)

class ExportService:
    def __init__(self):
        self.export_dir = "/tmp/exports"
        os.makedirs(self.export_dir, exist_ok=True)
    
    def export_trades_csv(self, user_id: int, date_range: Dict, filters: Optional[Dict] = None) -> str:
        """Export user trades to CSV format"""
        try:
            start_date = datetime.fromisoformat(date_range["start_date"])
            end_date = datetime.fromisoformat(date_range["end_date"])
            
            user_trades = [
                trade for trade in trades_db
                if trade.user_id == user_id and
                start_date <= trade.timestamp <= end_date
            ]
            
            if filters:
                if filters.get("stock"):
                    user_trades = [t for t in user_trades if t.stock == filters["stock"]]
                if filters.get("action"):
                    user_trades = [t for t in user_trades if t.action == filters["action"]]
            
            filename = f"trades_{user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            filepath = os.path.join(self.export_dir, filename)
            
            with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
                fieldnames = ['Date', 'Stock', 'Action', 'Quantity', 'Price', 'Total Value', 'Result']
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                
                writer.writeheader()
                for trade in user_trades:
                    writer.writerow({
                        'Date': trade.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                        'Stock': trade.stock,
                        'Action': trade.action.upper(),
                        'Quantity': trade.quantity,
                        'Price': f"₹{trade.price:.2f}",
                        'Total Value': f"₹{trade.price * trade.quantity:.2f}",
                        'Result': f"₹{trade.result:.2f}" if trade.result else "Pending"
                    })
            
            return filepath
            
        except Exception as e:
            logger.error(f"Error exporting trades to CSV: {e}")
            raise
    
    def export_trades_pdf(self, user_id: int, date_range: Dict, filters: Optional[Dict] = None) -> str:
        """Export user trades to PDF format"""
        try:
            user = next((u for u in users_db if u.id == user_id), None)
            if not user:
                raise ValueError("User not found")
            
            start_date = datetime.fromisoformat(date_range["start_date"])
            end_date = datetime.fromisoformat(date_range["end_date"])
            
            user_trades = [
                trade for trade in trades_db
                if trade.user_id == user_id and
                start_date <= trade.timestamp <= end_date
            ]
            
            if filters:
                if filters.get("stock"):
                    user_trades = [t for t in user_trades if t.stock == filters["stock"]]
                if filters.get("action"):
                    user_trades = [t for t in user_trades if t.action == filters["action"]]
            
            filename = f"trades_report_{user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            filepath = os.path.join(self.export_dir, filename)
            
            doc = SimpleDocTemplate(filepath, pagesize=A4)
            styles = getSampleStyleSheet()
            story = []
            
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=18,
                spaceAfter=30,
                alignment=1  # Center alignment
            )
            story.append(Paragraph("Trading Report", title_style))
            
            story.append(Paragraph(f"<b>User:</b> {user.name} ({user.email})", styles['Normal']))
            story.append(Paragraph(f"<b>Period:</b> {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}", styles['Normal']))
            story.append(Paragraph(f"<b>Generated:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
            story.append(Spacer(1, 20))
            
            total_trades = len(user_trades)
            total_pnl = sum(trade.result or 0 for trade in user_trades)
            buy_trades = len([t for t in user_trades if t.action == "buy"])
            sell_trades = len([t for t in user_trades if t.action == "sell"])
            
            story.append(Paragraph("<b>Summary</b>", styles['Heading2']))
            story.append(Paragraph(f"Total Trades: {total_trades}", styles['Normal']))
            story.append(Paragraph(f"Buy Orders: {buy_trades}", styles['Normal']))
            story.append(Paragraph(f"Sell Orders: {sell_trades}", styles['Normal']))
            story.append(Paragraph(f"Total P&L: ₹{total_pnl:.2f}", styles['Normal']))
            story.append(Spacer(1, 20))
            
            if user_trades:
                story.append(Paragraph("<b>Trade Details</b>", styles['Heading2']))
                
                table_data = [['Date', 'Stock', 'Action', 'Qty', 'Price', 'Total', 'P&L']]
                for trade in user_trades:
                    table_data.append([
                        trade.timestamp.strftime('%Y-%m-%d'),
                        trade.stock,
                        trade.action.upper(),
                        str(trade.quantity),
                        f"₹{trade.price:.2f}",
                        f"₹{trade.price * trade.quantity:.2f}",
                        f"₹{trade.result:.2f}" if trade.result else "Pending"
                    ])
                
                table = Table(table_data)
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black)
                ]))
                story.append(table)
            
            doc.build(story)
            return filepath
            
        except Exception as e:
            logger.error(f"Error exporting trades to PDF: {e}")
            raise
    
    def export_analytics_csv(self, user_id: int, date_range: Dict) -> str:
        """Export analytics data to CSV"""
        try:
            start_date = datetime.fromisoformat(date_range["start_date"])
            end_date = datetime.fromisoformat(date_range["end_date"])
            
            user_trades = [
                trade for trade in trades_db
                if trade.user_id == user_id and
                start_date <= trade.timestamp <= end_date
            ]
            
            daily_data = {}
            for trade in user_trades:
                date_key = trade.timestamp.strftime('%Y-%m-%d')
                if date_key not in daily_data:
                    daily_data[date_key] = {
                        'trades': 0,
                        'volume': 0,
                        'pnl': 0,
                        'buy_orders': 0,
                        'sell_orders': 0
                    }
                
                daily_data[date_key]['trades'] += 1
                daily_data[date_key]['volume'] += trade.price * trade.quantity
                daily_data[date_key]['pnl'] += trade.result or 0
                
                if trade.action == 'buy':
                    daily_data[date_key]['buy_orders'] += 1
                else:
                    daily_data[date_key]['sell_orders'] += 1
            
            filename = f"analytics_{user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            filepath = os.path.join(self.export_dir, filename)
            
            with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
                fieldnames = ['Date', 'Total Trades', 'Buy Orders', 'Sell Orders', 'Volume', 'P&L']
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                
                writer.writeheader()
                for date, data in sorted(daily_data.items()):
                    writer.writerow({
                        'Date': date,
                        'Total Trades': data['trades'],
                        'Buy Orders': data['buy_orders'],
                        'Sell Orders': data['sell_orders'],
                        'Volume': f"₹{data['volume']:.2f}",
                        'P&L': f"₹{data['pnl']:.2f}"
                    })
            
            return filepath
            
        except Exception as e:
            logger.error(f"Error exporting analytics to CSV: {e}")
            raise
    
    def process_export_request(self, export_request: ExportRequest) -> str:
        """Process an export request and generate the file"""
        try:
            if export_request.export_type == "trades":
                if export_request.format_type == "csv":
                    filepath = self.export_trades_csv(
                        export_request.user_id,
                        export_request.date_range,
                        export_request.filters
                    )
                else:  # PDF
                    filepath = self.export_trades_pdf(
                        export_request.user_id,
                        export_request.date_range,
                        export_request.filters
                    )
            elif export_request.export_type == "analytics":
                filepath = self.export_analytics_csv(
                    export_request.user_id,
                    export_request.date_range
                )
            else:
                raise ValueError(f"Unsupported export type: {export_request.export_type}")
            
            export_request.status = "completed"
            export_request.file_path = filepath
            
            return filepath
            
        except Exception as e:
            logger.error(f"Error processing export request: {e}")
            export_request.status = "failed"
            raise

export_service = ExportService()
