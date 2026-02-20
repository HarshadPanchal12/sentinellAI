from django.contrib import admin
from .models import (
    CustomUser, HealthSignal, OutbreakAlert, ScraperLog,
    HITLFeedback, NoiseKeyword, NotificationRule, EmailNotification,
)

@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'role', 'department', 'is_active']
    list_filter = ['role']

@admin.register(HealthSignal)
class HealthSignalAdmin(admin.ModelAdmin):
    list_display = ['source_type', 'location', 'llm_confidence', 'sentiment', 'processed', 'timestamp']
    list_filter = ['source_type', 'sentiment', 'processed']
    search_fields = ['source_text', 'location']

@admin.register(OutbreakAlert)
class OutbreakAlertAdmin(admin.ModelAdmin):
    list_display = ['predicted_disease', 'severity', 'location', 'anomaly_score', 'is_confirmed', 'created_at']
    list_filter = ['severity', 'is_confirmed']
    search_fields = ['predicted_disease', 'location']

@admin.register(HITLFeedback)
class HITLFeedbackAdmin(admin.ModelAdmin):
    list_display = ['alert', 'action', 'user', 'created_at']
    list_filter = ['action']
    readonly_fields = ['noise_keywords']

@admin.register(NoiseKeyword)
class NoiseKeywordAdmin(admin.ModelAdmin):
    list_display = ['keyword', 'category', 'created_at']
    list_filter = ['category']

@admin.register(ScraperLog)
class ScraperLogAdmin(admin.ModelAdmin):
    list_display = ['task_id', 'status', 'signals_found', 'started_at']

@admin.register(NotificationRule)
class NotificationRuleAdmin(admin.ModelAdmin):
    list_display = ['name', 'channel', 'threshold', 'is_active', 'created_at']
    list_filter = ['channel', 'is_active', 'threshold']

@admin.register(EmailNotification)
class EmailNotificationAdmin(admin.ModelAdmin):
    list_display = ['alert', 'recipient', 'status', 'sent_at']
    list_filter = ['status']
    readonly_fields = ['alert', 'recipient', 'subject', 'status', 'error_message', 'sent_at']
