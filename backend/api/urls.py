from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    UserViewSet, RegisterView, HealthSignalViewSet,
    OutbreakAlertViewSet, DashboardStatsView, SearchView,
    RegionalRiskView, PipelineStatusView, IngestSignalView,
    PublicDashboardView, HITLFeedbackView,
    NotificationRuleView, SendTestEmailView, EmailLogView,
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'signals', HealthSignalViewSet)
router.register(r'alerts', OutbreakAlertViewSet)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard_stats'),
    path('dashboard/public/', PublicDashboardView.as_view(), name='public_dashboard'),
    path('search/', SearchView.as_view(), name='search'),
    path('regional-risks/', RegionalRiskView.as_view(), name='regional_risks'),
    path('pipeline/status/', PipelineStatusView.as_view(), name='pipeline_status'),
    path('pipeline/feedback/', HITLFeedbackView.as_view(), name='hitl_feedback'),
    path('notifications/rules/', NotificationRuleView.as_view(), name='notification_rules'),
    path('notifications/send-test/', SendTestEmailView.as_view(), name='send_test_email'),
    path('notifications/log/', EmailLogView.as_view(), name='email_log'),
    path('ingest/', IngestSignalView.as_view(), name='ingest_signal'),
    path('', include(router.urls)),
]
