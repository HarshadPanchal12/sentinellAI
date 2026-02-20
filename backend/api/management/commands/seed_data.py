from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import HealthSignal, OutbreakAlert, CustomUser
import random
from datetime import timedelta


CITIES = {
    'Mumbai':    {'state': 'Maharashtra',   'lat': 19.0760, 'lng': 72.8777},
    'Delhi':     {'state': 'NCR',           'lat': 28.7041, 'lng': 77.1025},
    'Bangalore': {'state': 'Karnataka',     'lat': 12.9716, 'lng': 77.5946},
    'Chennai':   {'state': 'Tamil Nadu',    'lat': 13.0827, 'lng': 80.2707},
    'Kolkata':   {'state': 'West Bengal',   'lat': 22.5726, 'lng': 88.3639},
    'Hyderabad': {'state': 'Telangana',     'lat': 17.3850, 'lng': 78.4867},
    'Pune':      {'state': 'Maharashtra',   'lat': 18.5204, 'lng': 73.8567},
    'Jaipur':    {'state': 'Rajasthan',     'lat': 26.9124, 'lng': 75.7873},
    'Ahmedabad': {'state': 'Gujarat',       'lat': 23.0225, 'lng': 72.5714},
    'Lucknow':   {'state': 'Uttar Pradesh', 'lat': 26.8467, 'lng': 80.9462},
}

SIGNAL_TEMPLATES = [
    ("Multiple patients reporting high fever and body pain in {city}. Suspected dengue cluster.", 'twitter', ['fever', 'body pain'], 'negative'),
    ("Pharmacies in {city} running low on ORS and anti-diarrheal medication.", 'pharmacy', ['diarrhea', 'vomiting'], 'negative'),
    ("News report: Unusual spike in respiratory infections in {city} district.", 'news', ['cough', 'fever'], 'negative'),
    ("r/india post: My whole neighborhood in {city} is down with fever this week.", 'reddit', ['fever', 'headache'], 'negative'),
    ("Google Trends shows 300% increase in 'typhoid symptoms' searches from {city}.", 'google_trends', ['fever', 'headache', 'body pain'], 'negative'),
    ("Hospital OPD in {city} reports 40% increase in flu-like complaints.", 'news', ['fever', 'cough'], 'negative'),
    ("{city} ward office confirms clean water restored — diarrhea cases reducing.", 'news', ['diarrhea'], 'positive'),
    ("Chemist in {city}: Paracetamol sales tripled this week. People complaining of body aches.", 'pharmacy', ['fever', 'body pain'], 'negative'),
    ("@health_dept {city}: seeing joint pain and rash cases. Could be chikungunya?", 'twitter', ['joint pain', 'rash'], 'negative'),
    ("Community health worker reports malaria symptoms in slum area of {city}.", 'twitter', ['fever', 'body pain'], 'negative'),
    ("Air quality deteriorating in {city}, respiratory complaints on the rise.", 'news', ['cough', 'headache'], 'negative'),
    ("Health camp in {city} finds 15 children with viral fever symptoms.", 'news', ['fever', 'vomiting'], 'negative'),
]


class Command(BaseCommand):
    help = 'Seeds database with realistic data for SentinellAI demo'

    def handle(self, *args, **kwargs):
        self.stdout.write('Clearing old data...')
        HealthSignal.objects.all().delete()
        OutbreakAlert.objects.all().delete()

        # ── Users ────────────────────────────────────────────────
        self.stdout.write('Creating users...')
        admin, _ = CustomUser.objects.get_or_create(username='admin', defaults={
            'email': 'admin@sentinell.ai', 'role': 'admin'
        })
        admin.set_password('admin123')
        admin.save()

        doctor, _ = CustomUser.objects.get_or_create(username='dr_sharma', defaults={
            'email': 'sharma@aiims.edu', 'role': 'doctor', 'department': 'Epidemiology'
        })
        doctor.set_password('doc123')
        doctor.save()

        official, _ = CustomUser.objects.get_or_create(username='moh_official', defaults={
            'email': 'official@mohfw.gov.in', 'role': 'official', 'department': 'MOHFW'
        })
        official.set_password('off123')
        official.save()

        nurse, _ = CustomUser.objects.get_or_create(username='nurse_priya', defaults={
            'email': 'priya@hospital.in', 'role': 'doctor', 'department': 'Community Health'
        })
        nurse.set_password('nurse123')
        nurse.save()

        # ── Signals ──────────────────────────────────────────────
        self.stdout.write('Creating signals...')
        now = timezone.now()

        for i in range(60):
            city = random.choice(list(CITIES.keys()))
            info = CITIES[city]
            template = random.choice(SIGNAL_TEMPLATES)

            HealthSignal.objects.create(
                source_text=template[0].format(city=city),
                source_type=template[1],
                location=city,
                region=info['state'],
                latitude=info['lat'] + random.uniform(-0.05, 0.05),
                longitude=info['lng'] + random.uniform(-0.05, 0.05),
                llm_confidence=round(random.uniform(0.65, 0.98), 2),
                sentiment=template[3],
                symptoms=template[2],
                processed=True,
                timestamp=now - timedelta(hours=random.randint(0, 72)),
            )

        # ── Alerts ───────────────────────────────────────────────
        self.stdout.write('Creating alerts...')
        alert_data = [
            ('Dengue', 'critical', 'Mumbai', 'Maharashtra', 0.92,
             'Critical dengue outbreak — 300% spike in fever+joint pain reports correlated with 45mm rainfall.',
             {'temperature': 32, 'humidity': 85, 'rainfall': 45}),
            ('Viral Flu', 'warning', 'Delhi', 'NCR', 0.78,
             'Seasonal flu surge. OPD visits up 40% in last 48 hours during cold wave.',
             {'temperature': 8, 'humidity': 45, 'rainfall': 0}),
            ('Gastroenteritis', 'critical', 'Chennai', 'Tamil Nadu', 0.88,
             'Water contamination suspected — diarrhea and vomiting cases tripled near Adyar river.',
             {'temperature': 30, 'humidity': 80, 'rainfall': 60}),
            ('Chikungunya', 'warning', 'Bangalore', 'Karnataka', 0.71,
             'Joint pain and rash reports rising in Whitefield area post monsoon stagnation.',
             {'temperature': 28, 'humidity': 75, 'rainfall': 30}),
            ('Malaria', 'critical', 'Kolkata', 'West Bengal', 0.85,
             'P. falciparum cases detected in Howrah slum. Stagnant water breeding sites identified.',
             {'temperature': 33, 'humidity': 90, 'rainfall': 55}),
            ('Typhoid', 'warning', 'Lucknow', 'Uttar Pradesh', 0.67,
             'Sustained fever cases with contaminated bore-well water in Gomti Nagar area.',
             {'temperature': 35, 'humidity': 60, 'rainfall': 10}),
            ('Respiratory Infection', 'watch', 'Pune', 'Maharashtra', 0.55,
             'Moderate increase in cough/cold symptoms. AQI at 280 — monitoring air quality impact.',
             {'temperature': 25, 'humidity': 50, 'rainfall': 0}),
            ('Dengue', 'warning', 'Hyderabad', 'Telangana', 0.73,
             'Fever clusters near Hussain Sagar lake. Aedes mosquito index elevated.',
             {'temperature': 31, 'humidity': 78, 'rainfall': 35}),
        ]

        for disease, severity, city, state, score, desc, weather in alert_data:
            info = CITIES[city]
            alert = OutbreakAlert.objects.create(
                predicted_disease=disease,
                anomaly_score=score,
                severity=severity,
                location=city,
                region=state,
                latitude=info['lat'],
                longitude=info['lng'],
                weather_context=weather,
                description=desc,
            )
            # Confirm some alerts for accuracy calc
            if random.random() > 0.5:
                alert.is_confirmed = True
                alert.confirmed_by = doctor
                alert.save()

        self.stdout.write(self.style.SUCCESS(
            f'✅ Seeded: {CustomUser.objects.count()} users, '
            f'{HealthSignal.objects.count()} signals, '
            f'{OutbreakAlert.objects.count()} alerts'
        ))
