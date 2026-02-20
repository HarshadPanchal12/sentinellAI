"""
Email notification utilities for SentinellAI.
Sends HTML alert emails when outbreaks are confirmed or new critical alerts are generated.
"""
import logging
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings

logger = logging.getLogger(__name__)


def send_alert_email(alert, recipients=None):
    """
    Send an HTML email notification for an outbreak alert.
    
    Args:
        alert: OutbreakAlert instance
        recipients: Optional list of email addresses. If None, uses NotificationRule recipients.
    """
    from .models import NotificationRule, EmailNotification

    # Determine recipients from notification rules if not provided
    if recipients is None:
        severity_order = {'watch': 0, 'warning': 1, 'critical': 2}
        alert_level = severity_order.get(alert.severity, 0)

        rules = NotificationRule.objects.filter(channel='email', is_active=True)
        recipients = set()
        for rule in rules:
            threshold_level = severity_order.get(rule.threshold, 0)
            if alert_level >= threshold_level:
                recipients.update(rule.recipients)
        recipients = list(recipients)

    if not recipients:
        logger.info(f"No email recipients configured for alert #{alert.id}")
        return []

    # Build email content
    severity_emoji = {
        'critical': '🔴',
        'warning': '🟡',
        'watch': '🔵',
    }
    emoji = severity_emoji.get(alert.severity, '⚪')

    subject = f'{emoji} {alert.severity.upper()}: {alert.predicted_disease} outbreak detected in {alert.location}'

    # Weather context
    weather = alert.weather_context or {}
    temp = weather.get('temperature', 'N/A')
    humidity = weather.get('humidity', 'N/A')
    rainfall = weather.get('rainfall', 'N/A')

    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; color: #e2e8f0; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155; }}
            .header {{ background: linear-gradient(135deg, #0891b2, #6366f1); padding: 24px; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 20px; color: white; }}
            .header p {{ margin: 4px 0 0; font-size: 13px; color: rgba(255,255,255,0.8); }}
            .body {{ padding: 24px; }}
            .severity-badge {{ display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }}
            .severity-critical {{ background: rgba(239,68,68,0.2); color: #f87171; border: 1px solid rgba(239,68,68,0.3); }}
            .severity-warning {{ background: rgba(245,158,11,0.2); color: #fbbf24; border: 1px solid rgba(245,158,11,0.3); }}
            .severity-watch {{ background: rgba(59,130,246,0.2); color: #60a5fa; border: 1px solid rgba(59,130,246,0.3); }}
            .alert-title {{ font-size: 22px; font-weight: 700; margin: 16px 0 8px; color: #f1f5f9; }}
            .alert-desc {{ font-size: 14px; color: #94a3b8; line-height: 1.6; }}
            .info-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0; }}
            .info-card {{ background: #0f172a; padding: 12px; border-radius: 8px; border: 1px solid #334155; }}
            .info-label {{ font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }}
            .info-value {{ font-size: 16px; font-weight: 700; color: #06b6d4; margin-top: 4px; }}
            .weather {{ background: #0f172a; padding: 16px; border-radius: 8px; border: 1px solid #334155; margin-top: 16px; }}
            .weather h3 {{ margin: 0 0 8px; font-size: 13px; color: #64748b; text-transform: uppercase; }}
            .weather-grid {{ display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }}
            .weather-item {{ text-align: center; }}
            .weather-item .val {{ font-size: 18px; font-weight: 700; color: #06b6d4; }}
            .weather-item .lbl {{ font-size: 11px; color: #64748b; }}
            .action-section {{ text-align: center; padding: 20px 0; }}
            .action-btn {{ display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #0891b2, #6366f1); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; }}
            .footer {{ padding: 16px 24px; border-top: 1px solid #334155; text-align: center; font-size: 11px; color: #475569; }}
            .score {{ font-size: 28px; font-weight: 800; font-family: 'Courier New', monospace; color: #f87171; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🛡️ SentinellAI — Outbreak Alert</h1>
                <p>Automated Disease Intelligence System</p>
            </div>
            <div class="body">
                <span class="severity-badge severity-{alert.severity}">{emoji} {alert.severity}</span>
                
                <h2 class="alert-title">{alert.predicted_disease} in {alert.location}</h2>
                <p class="alert-desc">{alert.description}</p>
                
                <div class="info-grid">
                    <div class="info-card">
                        <div class="info-label">Location</div>
                        <div class="info-value">{alert.location}, {alert.region}</div>
                    </div>
                    <div class="info-card">
                        <div class="info-label">Anomaly Score</div>
                        <div class="score">{alert.anomaly_score * 100:.0f}%</div>
                    </div>
                    <div class="info-card">
                        <div class="info-label">Status</div>
                        <div class="info-value">{'✅ Confirmed' if alert.is_confirmed else '⏳ Pending Verification'}</div>
                    </div>
                    <div class="info-card">
                        <div class="info-label">Confirmed By</div>
                        <div class="info-value">{alert.confirmed_by.username if alert.confirmed_by else '—'}</div>
                    </div>
                </div>

                <div class="weather">
                    <h3>🌡️ Environmental Context</h3>
                    <div class="weather-grid">
                        <div class="weather-item">
                            <div class="val">{temp}°C</div>
                            <div class="lbl">Temperature</div>
                        </div>
                        <div class="weather-item">
                            <div class="val">{humidity}%</div>
                            <div class="lbl">Humidity</div>
                        </div>
                        <div class="weather-item">
                            <div class="val">{rainfall}mm</div>
                            <div class="lbl">Rainfall</div>
                        </div>
                    </div>
                </div>

                <div class="action-section">
                    <p style="font-size: 13px; color: #94a3b8;">
                        This alert requires your attention. Please review and take appropriate action.
                    </p>
                </div>
            </div>
            <div class="footer">
                SentinellAI — AI-Powered Disease Surveillance for India<br>
                This is an automated notification. Do not reply to this email.
            </div>
        </div>
    </body>
    </html>
    """

    plain_message = f"""
    SentinellAI Alert: {alert.severity.upper()}
    
    Disease: {alert.predicted_disease}
    Location: {alert.location}, {alert.region}
    Anomaly Score: {alert.anomaly_score * 100:.0f}%
    
    {alert.description}
    
    Weather: {temp}°C, {humidity}% humidity, {rainfall}mm rainfall
    
    Status: {'Confirmed' if alert.is_confirmed else 'Pending Verification'}
    """

    results = []
    for recipient in recipients:
        try:
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient],
                html_message=html_message,
                fail_silently=False,
            )
            notification = EmailNotification.objects.create(
                alert=alert,
                recipient=recipient,
                subject=subject,
                status='sent',
            )
            results.append({'recipient': recipient, 'status': 'sent', 'id': notification.id})
            logger.info(f"Email sent to {recipient} for alert #{alert.id}")
        except Exception as e:
            notification = EmailNotification.objects.create(
                alert=alert,
                recipient=recipient,
                subject=subject,
                status='failed',
                error_message=str(e),
            )
            results.append({'recipient': recipient, 'status': 'failed', 'error': str(e)})
            logger.error(f"Email failed for {recipient}: {e}")

    return results
