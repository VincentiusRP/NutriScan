"""
food-classifier/app.py
"""
 
import os
import joblib
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify, render_template
 
app = Flask(__name__)
 
MODEL_PATH = os.path.join("model", "food_classifier_model.pkl")
 
try:
    model = joblib.load(MODEL_PATH)
    print(f"[OK] Model loaded from {MODEL_PATH}")
except FileNotFoundError:
    raise FileNotFoundError(
        f"\n[ERROR] Model file not found at '{MODEL_PATH}'.\n"
    )
 
scaler = None
 
LABEL_MAP = {
    0: "Not Healthy",
    1: "Healthy",
    2: "Fair",
}

@app.route("/")
def index():
    return render_template("index.html")
 
 
@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json(force=True)
 
        required_fields = [
            "carbohydrate", "protein", "fat_total",
            "saturated_fat", "sugar", "sodium"
        ]
 
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing field: '{field}'"}), 400
            try:
                float(data[field])
            except (ValueError, TypeError):
                return jsonify({"error": f"Field '{field}' must be a number"}), 400
 
        carbohydrate  = float(data["carbohydrate"])
        protein       = float(data["protein"])
        fat_total     = float(data["fat_total"])
        saturated_fat = float(data["saturated_fat"])
        sugar         = float(data["sugar"])
        sodium        = float(data["sodium"])
 
        values = [carbohydrate, protein, fat_total, saturated_fat, sugar, sodium]
        if any(v < 0 for v in values):
            return jsonify({"error": "All values must be non-negative"}), 400
 
        features = pd.DataFrame([[carbohydrate, protein, fat_total, saturated_fat, sugar, sodium]],
            columns=[
                'Data.Carbohydrate',
                'Data.Protein',
                'Data.Fat.Total Lipid',
                'Data.Fat.Saturated Fat',
                'Data.Sugar Total',
                'Data.Major Minerals.Sodium'
            ])
 
        if scaler is not None:
            features = scaler.transform(features)
 
        raw_label = model.predict(features)[0]
 
        confidence = None
        if hasattr(model, "predict_proba"):
            proba      = model.predict_proba(features)[0]
            confidence = round(float(max(proba)) * 100, 1)
 
        label_str = LABEL_MAP.get(raw_label, str(raw_label))
 
        response = {
            "prediction": label_str,
            "label": int(raw_label) if isinstance(raw_label, (int, np.integer)) else raw_label,
        }
        if confidence is not None:
            response["confidence"] = confidence
 
        return jsonify(response), 200
 
    except Exception as e:
        app.logger.error(f"Prediction error: {e}")
        return jsonify({"error": "Internal server error. Check the console."}), 500
 
 
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)