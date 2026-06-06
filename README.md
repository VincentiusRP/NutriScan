# NutriScan — Food Health Classifier
**End-to-End ML Web App: Google Colab → Flask → Browser**

---

## Project Structure

```
food-classifier/
│
├── app.py                    ← Flask backend (the server)
├── requirements.txt          ← Python dependencies
├── create_demo_model.py      ← Quick-start: generates a test model
├── STEP1_colab_export.py     ← Copy-paste code for Google Colab
│
├── model/
│   └── food_classifier_model.pkl   ← YOUR trained model goes here
│   └── scaler.pkl                  ← (optional) if you used a scaler
│
├── templates/
│   └── index.html            ← Frontend HTML page
│
└── static/
    ├── css/
    │   └── style.css         ← Styling
    └── js/
        └── main.js           ← Fetch API + result rendering
```

---

## Data Flow (Big Picture)

```
[Browser Form]
  User fills Calories / Protein / Fat / Carbs
        │
        │  fetch() POST /predict  { JSON body }
        ▼
[Flask Server — app.py]
  • Parses JSON
  • Builds numpy array [[cal, pro, fat, carb]]
  • Optional: scaler.transform(features)
  • model.predict(features)  →  0 or 1
  • Returns JSON { "prediction": "Healthy", "confidence": 87.3 }
        │
        │  JSON response
        ▼
[Browser — main.js]
  Displays "✅ Healthy" or "🚫 Not Healthy" without page reload
```

---

## Step-by-Step Setup Guide

### STEP 1 — Export your model from Google Colab

Open `STEP1_colab_export.py` and run the relevant block in your Colab notebook.

```python
# In your Colab notebook (after training):
import joblib
joblib.dump(model, "food_classifier_model.pkl")   # save
from google.colab import files
files.download("food_classifier_model.pkl")        # download to PC
```

> **Important:** If you used `StandardScaler` or `MinMaxScaler` during training, save it too:
> ```python
> joblib.dump(scaler, "scaler.pkl")
> files.download("scaler.pkl")
> ```

---

### STEP 2 — Set up the local project

```bash
# 1. Create & activate a virtual environment (recommended)
python -m venv venv
source venv/bin/activate        # Mac/Linux
venv\Scripts\activate           # Windows

# 2. Install dependencies
pip install -r requirements.txt

# 3. Place your downloaded model file here:
#    food-classifier/model/food_classifier_model.pkl
```

---

### STEP 3 — (Optional) Quick-start with a demo model

If you just want to test the full stack before your real model is ready:

```bash
python create_demo_model.py
# → creates model/food_classifier_model.pkl automatically
```

---

### STEP 4 — Configure the label map (important!)

Open `app.py` and find this section (~line 40):

```python
LABEL_MAP = {
    0: "Not Healthy",
    1: "Healthy",
}
```

Make sure the keys (0, 1) match **exactly** what your trained model's
`predict()` returns. For example, if your model returns strings like
`"healthy"` / `"not_healthy"`, update accordingly:

```python
LABEL_MAP = {
    "healthy":     "Healthy",
    "not_healthy": "Not Healthy",
}
```

---

### STEP 5 — Run the Flask server

```bash
python app.py
```

You should see:
```
✅ Model loaded from model/food_classifier_model.pkl
 * Running on http://127.0.0.1:5000
```

---

### STEP 6 — Open the app in your browser

Go to: **http://127.0.0.1:5000**

Fill in the four fields and click **Classify Food**. The result appears
instantly below the button — no page reload.

---

## Customisation Tips

| What to change | Where |
|---|---|
| Column order (cal/protein/fat/carbs) | `app.py` — the `features` array line |
| Label names | `app.py` — `LABEL_MAP` dict |
| Add a scaler | `app.py` — uncomment `scaler` lines |
| UI colours / fonts | `static/css/style.css` `:root` variables |
| Add more input fields | `templates/index.html` + `static/js/main.js` + `app.py` |
| Production deployment | Use `gunicorn app:app` instead of `python app.py` |

---

## Common Errors & Fixes

| Error | Fix |
|---|---|
| `FileNotFoundError: model/food_classifier_model.pkl` | Place your model file in the `model/` folder |
| `Cannot reach the server` (browser) | Make sure `python app.py` is running |
| Prediction always wrong | Check `LABEL_MAP` keys match your model's output |
| `ValueError: X has 4 features` mismatch | Ensure column order in `features` matches training data |
| Scaler errors | Export and load `scaler.pkl` from Colab (see STEP 1) |
