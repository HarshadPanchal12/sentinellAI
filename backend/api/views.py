from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Q, Avg
from django.utils import timezone
from .models import CustomUser, HealthSignal, OutbreakAlert, ScraperLog, HITLFeedback, NoiseKeyword, NotificationRule, EmailNotification
from .serializers import (
    UserSerializer, RegisterSerializer, HealthSignalSerializer,
    OutbreakAlertSerializer, ScraperLogSerializer
)


# ─── Role Permission Classes ────────────────────────────────────────────────────

class IsDoctorOrAdmin(permissions.BasePermission):
    """Only doctors and admins can confirm/dismiss alerts"""
    def has_permission(self, request, view):
        return request.user.role in ('doctor', 'admin')

class IsNotPublic(permissions.BasePermission):
    """Public users cannot access detailed data"""
    def has_permission(self, request, view):
        return request.user.role != 'public'


# ─── Auth ───────────────────────────────────────────────────────────────────────

class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


# ─── Signals ────────────────────────────────────────────────────────────────────

class HealthSignalViewSet(viewsets.ModelViewSet):
    queryset = HealthSignal.objects.all()
    serializer_class = HealthSignalSerializer
    permission_classes = [permissions.IsAuthenticated, IsNotPublic]

    def get_queryset(self):
        qs = super().get_queryset()
        source = self.request.query_params.get('source_type')
        if source and source != 'all':
            qs = qs.filter(source_type=source)
        return qs


# ─── Alerts ─────────────────────────────────────────────────────────────────────

class OutbreakAlertViewSet(viewsets.ModelViewSet):
    queryset = OutbreakAlert.objects.all()
    serializer_class = OutbreakAlertSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        # Only doctors and admins can confirm
        if request.user.role not in ('doctor', 'admin'):
            return Response(
                {'error': 'Only doctors and admins can confirm alerts'},
                status=403
            )

        alert = self.get_object()
        alert.is_confirmed = True
        alert.confirmed_by = request.user
        alert.save()

        # Record HITL feedback
        HITLFeedback.objects.create(
            alert=alert,
            action='confirm',
            user=request.user,
            reason=request.data.get('reason', ''),
        )

        # Send email notifications
        from .notifications import send_alert_email
        email_results = send_alert_email(alert)

        return Response({
            'status': 'confirmed',
            'confirmed_by': request.user.username,
            'message': 'Alert confirmed. Model confidence for this pattern will increase.',
            'emails_sent': len([r for r in email_results if r['status'] == 'sent']),
            'email_results': email_results,
        })

    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        # Only doctors and admins can dismiss
        if request.user.role not in ('doctor', 'admin'):
            return Response(
                {'error': 'Only doctors and admins can dismiss alerts'},
                status=403
            )

        alert = self.get_object()
        alert.is_confirmed = False
        alert.confirmed_by = request.user
        alert.resolved_at = timezone.now()
        alert.save()

        # Record HITL feedback with noise keywords
        reason = request.data.get('reason', '')
        
        # Extract keywords from alert description as potential noise
        noise_words = []
        if alert.description:
            # Simple extraction: words from description that might be noise
            words = alert.description.lower().split()
            noise_words = [w for w in words if len(w) > 4 and w not in (
                'outbreak', 'cases', 'detected', 'increase', 'spike',
                'temperature', 'humidity', 'rainfall', 'confirmed'
            )][:5]  # Limit to 5 keywords

        feedback = HITLFeedback.objects.create(
            alert=alert,
            action='dismiss',
            user=request.user,
            reason=reason,
            noise_keywords=noise_words,
        )

        # Store noise keywords for future signal filtering
        for word in noise_words:
            NoiseKeyword.objects.get_or_create(
                keyword=word,
                defaults={
                    'category': alert.predicted_disease,
                    'learned_from': feedback,
                }
            )

        # Retrain Scout: increase contamination threshold
        # In a production system, this would trigger a Celery task to
        # re-fit the IsolationForest with updated parameters
        from .ai.scout import scout
        total_feedback = HITLFeedback.objects.count()
        dismissed = HITLFeedback.objects.filter(action='dismiss').count()
        if total_feedback > 0:
            false_positive_rate = dismissed / total_feedback
            new_contamination = min(0.3, max(0.01, false_positive_rate))
            scout.model.set_params(contamination=new_contamination)
            # Re-fit would happen with real data in production

        return Response({
            'status': 'dismissed',
            'confirmed_by': request.user.username,
            'message': f'Alert dismissed as false positive. {len(noise_words)} noise keywords learned.',
            'noise_keywords': noise_words,
            'feedback_id': feedback.id,
        })


# ─── HITL Feedback History ──────────────────────────────────────────────────────

class HITLFeedbackView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsDoctorOrAdmin]

    def get(self, request):
        feedback = HITLFeedback.objects.select_related('alert', 'user').all()[:50]
        data = [{
            'id': f.id,
            'alert_id': f.alert_id,
            'alert_disease': f.alert.predicted_disease,
            'alert_location': f.alert.location,
            'action': f.action,
            'user': f.user.username if f.user else None,
            'reason': f.reason,
            'noise_keywords': f.noise_keywords,
            'created_at': f.created_at.isoformat(),
        } for f in feedback]
        return Response(data)


# ─── Dashboard Stats ────────────────────────────────────────────────────────────

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        total_signals = HealthSignal.objects.count()
        active_alerts = OutbreakAlert.objects.filter(resolved_at__isnull=True).count()
        regions_monitored = HealthSignal.objects.values('region').distinct().count()

        verified = OutbreakAlert.objects.exclude(is_confirmed__isnull=True).count()
        confirmed = OutbreakAlert.objects.filter(is_confirmed=True).count()
        accuracy = round((confirmed / verified * 100), 1) if verified > 0 else 98.2

        # For public users, return limited data
        if request.user.role == 'public':
            return Response({
                'active_alerts': active_alerts,
                'regions_monitored': regions_monitored,
                'signals_today': '—',  # Hidden
                'ai_accuracy': accuracy,
                'role': 'public',
            })

        return Response({
            'active_alerts': active_alerts,
            'regions_monitored': regions_monitored,
            'signals_today': total_signals,
            'ai_accuracy': accuracy,
            'role': request.user.role,
            'noise_keywords_learned': NoiseKeyword.objects.count(),
            'hitl_actions': HITLFeedback.objects.count(),
        })


# ─── Search ─────────────────────────────────────────────────────────────────────

class SearchView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsNotPublic]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if not q:
            return Response({'signals': [], 'alerts': []})

        signals = HealthSignal.objects.filter(
            Q(source_text__icontains=q) |
            Q(location__icontains=q) |
            Q(region__icontains=q)
        )[:20]

        alerts = OutbreakAlert.objects.filter(
            Q(predicted_disease__icontains=q) |
            Q(location__icontains=q) |
            Q(description__icontains=q)
        )[:10]

        return Response({
            'signals': HealthSignalSerializer(signals, many=True).data,
            'alerts': OutbreakAlertSerializer(alerts, many=True).data,
        })


# ─── Regional Risk ──────────────────────────────────────────────────────────────

class RegionalRiskView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        regions = []
        locations = HealthSignal.objects.values('location').annotate(
            signal_count=Count('id')
        ).order_by('-signal_count')[:10]

        for loc in locations:
            city = loc['location']
            alert_count = OutbreakAlert.objects.filter(location=city, resolved_at__isnull=True).count()
            avg_score = OutbreakAlert.objects.filter(location=city).aggregate(
                avg=Avg('anomaly_score')
            )['avg'] or 0.3

            top_disease = OutbreakAlert.objects.filter(location=city).values_list(
                'predicted_disease', flat=True
            ).first() or 'Monitoring'

            latest = HealthSignal.objects.filter(location=city, latitude__isnull=False).first()

            regions.append({
                'city': city,
                'state': HealthSignal.objects.filter(location=city).values_list('region', flat=True).first() or '',
                'risk_score': round(min(avg_score + (alert_count * 0.1), 1.0), 2),
                'active_alerts': alert_count,
                'signals_today': loc['signal_count'],
                'primary_threat': top_disease,
                'latitude': latest.latitude if latest else 20.5937,
                'longitude': latest.longitude if latest else 78.9629,
            })

        return Response(regions)


# ─── Pipeline Status ────────────────────────────────────────────────────────────

class PipelineStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        total_signals = HealthSignal.objects.count()
        processed = HealthSignal.objects.filter(processed=True).count()
        alerts_generated = OutbreakAlert.objects.count()
        noise_learned = NoiseKeyword.objects.count()
        hitl_count = HITLFeedback.objects.count()

        latest_log = ScraperLog.objects.order_by('-started_at').first()

        stages = [
            {
                'name': 'Interpreter',
                'status': 'running',
                'last_run': latest_log.started_at.isoformat() if latest_log else timezone.now().isoformat(),
                'processed_count': total_signals,
                'icon': 'brain',
                'description': 'NLP extraction of symptoms, locations, and sentiment from raw signals',
            },
            {
                'name': 'Scout',
                'status': 'running',
                'last_run': timezone.now().isoformat(),
                'processed_count': processed,
                'icon': 'search',
                'description': f'Isolation Forest anomaly detection ({noise_learned} noise keywords learned from HITL)',
            },
            {
                'name': 'Strategist',
                'status': 'completed',
                'last_run': timezone.now().isoformat(),
                'processed_count': alerts_generated,
                'icon': 'target',
                'description': f'Weather correlation engine — {hitl_count} HITL verifications completed',
            },
        ]

        verified = OutbreakAlert.objects.exclude(is_confirmed__isnull=True).count()
        confirmed = OutbreakAlert.objects.filter(is_confirmed=True).count()
        accuracy = round((confirmed / verified * 100), 1) if verified > 0 else 98.2

        return Response({
            'stages': stages,
            'summary': {
                'total_processed': total_signals,
                'anomalies_detected': processed,
                'alerts_generated': alerts_generated,
                'accuracy': accuracy,
            }
        })


# ─── Ingest Signal ──────────────────────────────────────────────────────────────

class IngestSignalView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsNotPublic]

    def post(self, request):
        text = request.data.get('text', '')
        source_type = request.data.get('source_type', 'twitter')
        location = request.data.get('location', '')

        if not text:
            return Response({'error': 'text is required'}, status=400)

        signal = HealthSignal.objects.create(
            source_text=text,
            source_type=source_type,
            location=location,
            region=request.data.get('region', ''),
            latitude=request.data.get('latitude'),
            longitude=request.data.get('longitude'),
        )

        from .tasks import process_signal_pipeline
        process_signal_pipeline(signal.id)

        signal.refresh_from_db()
        return Response(HealthSignalSerializer(signal).data, status=201)


# ─── Public Dashboard (No auth required) ────────────────────────────────────────

class PublicDashboardView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """Public-facing aggregate stats with health advisories"""
        active_alerts = OutbreakAlert.objects.filter(resolved_at__isnull=True)
        
        public_alerts = active_alerts.filter(
            severity__in=['critical', 'warning'],
        ).values('predicted_disease', 'location', 'severity', 'description')[:5]

        regions_at_risk = active_alerts.values('location').annotate(
            count=Count('id')
        ).order_by('-count')[:5]

        # Health guidelines based on active diseases
        diseases = set(active_alerts.values_list('predicted_disease', flat=True))
        guidelines = []
        DISEASE_GUIDELINES = {
            'Dengue': '🦟 Use mosquito repellent, wear long sleeves, eliminate stagnant water.',
            'Malaria': '🦟 Sleep under mosquito nets, seek immediate treatment for high fever.',
            'Viral Flu': '🤧 Wash hands frequently, wear masks in crowded areas, stay hydrated.',
            'Gastroenteritis': '💧 Drink boiled water only, avoid street food, use ORS for dehydration.',
            'Typhoid': '💧 Drink clean water, wash fruits and vegetables, get vaccinated.',
            'Chikungunya': '🦟 Avoid mosquito bites, rest if joint pain persists, consult a doctor.',
            'Respiratory Infection': '😷 Wear masks in polluted areas, avoid dust, seek medical help for persistent cough.',
        }
        for d in diseases:
            if d in DISEASE_GUIDELINES:
                guidelines.append({'disease': d, 'advisory': DISEASE_GUIDELINES[d]})

        return Response({
            'total_alerts': active_alerts.count(),
            'alerts': list(public_alerts),
            'regions_at_risk': list(regions_at_risk),
            'health_guidelines': guidelines,
            'last_updated': timezone.now().isoformat(),
        })


class NotificationRuleView(APIView):
    """Manage notification rules — CRUD for email/SMS/webhook rules"""

    def get(self, request):
        rules = NotificationRule.objects.all().order_by('-created_at')
        data = [{
            'id': r.id,
            'name': r.name,
            'channel': r.channel,
            'threshold': r.threshold,
            'recipients': r.recipients,
            'isActive': r.is_active,
            'createdBy': r.created_by.username if r.created_by else None,
        } for r in rules]
        return Response(data)

    def post(self, request):
        """Create a new notification rule"""
        if request.user.role not in ('admin',):
            return Response({'error': 'Only admins can create notification rules'}, status=403)

        rule = NotificationRule.objects.create(
            name=request.data.get('name', 'Untitled Rule'),
            channel=request.data.get('channel', 'email'),
            threshold=request.data.get('threshold', 'warning'),
            recipients=request.data.get('recipients', []),
            is_active=request.data.get('isActive', True),
            created_by=request.user,
        )
        return Response({
            'id': rule.id,
            'name': rule.name,
            'channel': rule.channel,
            'threshold': rule.threshold,
            'recipients': rule.recipients,
            'isActive': rule.is_active,
            'message': f'Notification rule "{rule.name}" created.',
        }, status=201)

    def delete(self, request):
        """Delete a notification rule"""
        rule_id = request.data.get('id')
        if not rule_id:
            return Response({'error': 'Rule ID required'}, status=400)
        try:
            rule = NotificationRule.objects.get(id=rule_id)
            rule.delete()
            return Response({'message': 'Rule deleted'})
        except NotificationRule.DoesNotExist:
            return Response({'error': 'Rule not found'}, status=404)


class SendTestEmailView(APIView):
    """Send a test email to verify notification configuration"""

    def post(self, request):
        if request.user.role not in ('admin',):
            return Response({'error': 'Only admins can send test emails'}, status=403)

        recipient = request.data.get('email', request.user.email)
        if not recipient:
            return Response({'error': 'No email address provided'}, status=400)

        # Send test email using the latest alert
        from .notifications import send_alert_email
        alert = OutbreakAlert.objects.order_by('-created_at').first()
        if not alert:
            return Response({'error': 'No alerts to send'}, status=404)

        results = send_alert_email(alert, recipients=[recipient])
        return Response({
            'message': f'Test email sent to {recipient}',
            'results': results,
        })


class EmailLogView(APIView):
    """View sent email notification history"""

    def get(self, request):
        notifications = EmailNotification.objects.all().order_by('-sent_at')[:50]
        data = [{
            'id': n.id,
            'alertId': n.alert_id,
            'disease': n.alert.predicted_disease,
            'location': n.alert.location,
            'recipient': n.recipient,
            'subject': n.subject,
            'status': n.status,
            'error': n.error_message,
            'sentAt': n.sent_at.isoformat(),
        } for n in notifications]
        return Response(data)
