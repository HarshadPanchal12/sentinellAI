from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('official', 'Health Official'),
        ('doctor', 'Doctor'),
        ('admin', 'Admin'),
        ('public', 'Public User'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='official')
    department = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.username} ({self.role})"

class HealthSignal(models.Model):
    SOURCE_CHOICES = (
        ('twitter', 'Twitter/X'),
        ('news', 'News'),
        ('pharmacy', 'Pharmacy'),
        ('reddit', 'Reddit'),
        ('google_trends', 'Google Trends'),
    )
    source_text = models.TextField()
    source_url = models.URLField(max_length=500, blank=True)
    source_type = models.CharField(max_length=20, choices=SOURCE_CHOICES)
    location = models.CharField(max_length=100)
    region = models.CharField(max_length=100, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # AI Analysis
    llm_confidence = models.FloatField(default=0.0)
    sentiment = models.CharField(max_length=20, default='neutral')
    symptoms = models.JSONField(default=list)
    processed = models.BooleanField(default=False)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.source_type}: {self.location}"

class OutbreakAlert(models.Model):
    SEVERITY_CHOICES = (
        ('critical', 'Critical'),
        ('warning', 'Warning'),
        ('watch', 'Watch'),
    )
    predicted_disease = models.CharField(max_length=100)
    anomaly_score = models.FloatField()
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    location = models.CharField(max_length=100)
    region = models.CharField(max_length=100, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    
    # Context
    weather_context = models.JSONField(default=dict)
    description = models.TextField()
    
    # HITL
    is_confirmed = models.BooleanField(null=True, blank=True)
    confirmed_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.severity} - {self.predicted_disease} in {self.location}"


class HITLFeedback(models.Model):
    """Human-in-the-Loop feedback for retraining the Scout model"""
    ACTION_CHOICES = (
        ('confirm', 'Confirmed — Real Outbreak'),
        ('dismiss', 'Dismissed — False Positive / Noise'),
    )
    alert = models.ForeignKey(OutbreakAlert, on_delete=models.CASCADE, related_name='feedback')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    user = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True)
    reason = models.TextField(blank=True, help_text="Optional reason for the decision")
    noise_keywords = models.JSONField(default=list, help_text="Keywords identified as noise from this dismissal")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action} by {self.user} on Alert #{self.alert_id}"


class NoiseKeyword(models.Model):
    """Keywords learned from HITL dismissals — used to filter future signals"""
    keyword = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=50, default='general')
    learned_from = models.ForeignKey(HITLFeedback, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.keyword


class ScraperLog(models.Model):
    STATUS_CHOICES = (
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('running', 'Running'),
    )
    task_id = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    signals_found = models.IntegerField(default=0)
    message = models.TextField(blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.task_id} - {self.status}"


class NotificationRule(models.Model):
    """Configurable notification rules for alert channels"""
    CHANNEL_CHOICES = (
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('webhook', 'Webhook'),
    )
    THRESHOLD_CHOICES = (
        ('critical', 'Critical Only'),
        ('warning', 'Warning & Above'),
        ('watch', 'All Alerts'),
    )
    name = models.CharField(max_length=100)
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES, default='email')
    threshold = models.CharField(max_length=20, choices=THRESHOLD_CHOICES, default='warning')
    recipients = models.JSONField(default=list, help_text="List of email addresses or phone numbers")
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.channel})"


class EmailNotification(models.Model):
    """Track sent email notifications"""
    STATUS_CHOICES = (
        ('sent', 'Sent'),
        ('failed', 'Failed'),
        ('pending', 'Pending'),
    )
    alert = models.ForeignKey(OutbreakAlert, on_delete=models.CASCADE, related_name='notifications')
    recipient = models.EmailField()
    subject = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True)
    sent_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.status}: {self.subject} → {self.recipient}"
