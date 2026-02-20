import re
import random

SYMPTOMS = ['fever', 'cough', 'headache', 'body pain', 'diarrhea', 'vomiting', 'rash', 'joint pain']
LOCATIONS = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Jaipur', 'Ahmedabad', 'Lucknow']

def analyze_text(text):
    """
    Mock LLM Interpreter.
    Extracts symptoms, location, and sentiment using regex/heuristics.
    """
    text_lower = text.lower()
    
    # Extract symptoms
    found_symptoms = [s for s in SYMPTOMS if s in text_lower]
    
    # Extract location (simple keyword match)
    found_location = None
    for loc in LOCATIONS:
        if loc.lower() in text_lower:
            found_location = loc
            break
            
    # Simple sentiment
    sentiment = 'neutral'
    if any(w in text_lower for w in ['suffering', 'pain', 'bad', 'worst', 'sick', 'emergency', 'dead', 'died']):
        sentiment = 'negative'
    elif any(w in text_lower for w in ['recovered', 'good', 'better', 'safe', 'relief']):
        sentiment = 'positive'
        
    # Mock confidence score based on information density
    confidence = 0.5
    if found_symptoms: confidence += 0.2
    if found_location: confidence += 0.2
    if len(text) > 50: confidence += 0.05
    
    return {
        'symptoms': found_symptoms,
        'location': found_location,
        'sentiment': sentiment,
        'confidence': min(confidence, 0.99)
    }
