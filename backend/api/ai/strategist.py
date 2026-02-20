def evaluate_risk(anomaly_score, symptoms, weather_data):
    """
    Rule-based Strategist.
    Correlates anomaly score + symptoms + weather to predict disease and risk.
    """
    risk_level = 'watch'
    predicted_disease = 'Unknown'
    
    # 1. Base logic on symptoms
    if 'fever' in symptoms and 'joint pain' in symptoms:
        predicted_disease = 'Dengue'
    elif 'cough' in symptoms and 'fever' in symptoms:
        predicted_disease = 'Viral Flu'
    elif 'diarrhea' in symptoms:
        predicted_disease = 'Gastroenteritis'
    elif 'fever' in symptoms and 'chills' in symptoms:
        predicted_disease = 'Malaria'
        
    # 2. Correlate with Weather (Mock logic)
    # High rain + heat -> Dengue/Malaria
    if weather_data.get('rainfall', 0) > 20 and weather_data.get('temperature', 0) > 25:
        if predicted_disease in ['Dengue', 'Malaria']:
            anomaly_score += 0.2 # Boost score
            
    # 3. Determine Severity
    if anomaly_score > 0.8:
        risk_level = 'critical'
    elif anomaly_score > 0.6:
        risk_level = 'warning'
        
    return {
        'risk_level': risk_level,
        'predicted_disease': predicted_disease,
        'final_score': min(anomaly_score, 0.99)
    }
