from celery import shared_task
from .models import HealthSignal, OutbreakAlert, ScraperLog
from .ai.interpreter import analyze_text
from .ai.scout import scout
from .ai.strategist import evaluate_risk
import random
from django.utils import timezone

@shared_task
def process_signal_pipeline(signal_id):
    try:
        signal = HealthSignal.objects.get(id=signal_id)
        
        # 1. Interpreter: Extract Meaning
        analysis = analyze_text(signal.source_text)
        signal.symptoms = analysis['symptoms']
        signal.sentiment = analysis['sentiment']
        signal.llm_confidence = analysis['confidence']
        
        # Refine location if not present
        if not signal.location and analysis['location']:
            signal.location = analysis['location']
            
        signal.processed = True
        signal.save()
        
        # 2. Scout: Detect Anomaly
        # In a real system, we'd fetch historical counts for this region/symptom
        # Here we mock the input vector for the trained model
        # [symptom_count (1), severity_weight (random 1-10)]
        mock_features = [1, random.randint(1, 10)]
        anomaly_score = scout.predict(mock_features)
        
        # 3. Strategist: Evaluate Risk
        # Mock weather data
        weather_data = {
            'temperature': random.randint(20, 35),
            'humidity': random.randint(40, 90),
            'rainfall': random.randint(0, 50)
        }
        
        strategy = evaluate_risk(anomaly_score, signal.symptoms, weather_data)
        
        # 4. Action: Create Alert if Critical/Warning
        if strategy['risk_level'] in ['critical', 'warning']:
            OutbreakAlert.objects.create(
                predicted_disease=strategy['predicted_disease'],
                anomaly_score=strategy['final_score'],
                severity=strategy['risk_level'],
                location=signal.location,
                region=signal.region,
                latitude=signal.latitude,
                longitude=signal.longitude,
                weather_context=weather_data,
                description=f"Detected {strategy['predicted_disease']} outbreak risk due to high {','.join(signal.symptoms)} reports and favorable weather conditions.",
            )
            
        return f"Processed Signal {signal_id}: {strategy['risk_level']}"
        
    except HealthSignal.DoesNotExist:
        return "Signal not found"

@shared_task
def run_scraper_task(source_type='twitter'):
    # Mock Scraper Logic
    # 1. Create Log
    task_id = f"scrape-{timezone.now().timestamp()}"
    log = ScraperLog.objects.create(task_id=task_id, status='running')
    
    # 2. Mock Fetching Data
    # In real world: Use Tweepy or BeautifulSoup
    new_signals_count = random.randint(0, 5)
    
    for _ in range(new_signals_count):
        HealthSignal.objects.create(
            source_text=f"Feeling very sick with high fever in Mumbai. #{source_type}",
            source_type=source_type,
            location="Mumbai",
            region="Maharashtra",
            latitude=19.0760,
            longitude=72.8777
        )
        # Trigger pipeline immediately (eager)
        # In prod, this would be async
        # process_signal_pipeline.delay(signal.id)
    
    log.status = 'success'
    log.signals_found = new_signals_count
    log.completed_at = timezone.now()
    log.save()
    
    return f"Scraped {new_signals_count} signals from {source_type}"
