import numpy as np
from sklearn.ensemble import IsolationForest

class ScoutModel:
    def __init__(self):
        self.model = IsolationForest(contamination=0.1, random_state=42)
        self.is_trained = False
        
    def train(self, historical_data):
        """
        historical_data: List of numerical features (e.g., [daily_count, symptom_intensity])
        """
        if not historical_data:
            return
            
        X = np.array(historical_data).reshape(-1, 1) if len(np.array(historical_data).shape) == 1 else np.array(historical_data)
        self.model.fit(X)
        self.is_trained = True
        
    def predict(self, current_data):
        """
        Returns anomaly score (0 to 1, where higher is more anomalous)
        """
        if not self.is_trained:
            # Fallback if not trained: Random mock score for demo
            return np.random.uniform(0.1, 0.4)
            
        X = np.array(current_data).reshape(1, -1)
        # decision_function returns negative for anomalies, positive for normal
        # We invert and normalize it roughly to 0-1 for "Anomaly Score"
        score = self.model.decision_function(X)[0]
        
        # Normalize: decisions range roughly -0.5 to 0.5. 
        # We want probability of anomaly.
        # Simple heuristic: if score < 0, it's an anomaly.
        
        anomaly_prob = 0.5 - score  # If score is -0.5 (very anomalous), prob is 1.0
        return max(0.0, min(1.0, anomaly_prob))

# Singleton instance for simple usage
scout = ScoutModel()
