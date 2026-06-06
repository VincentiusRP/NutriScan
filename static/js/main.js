/**
 * NutriScan — main.js
 * =====================
 * Handles:
 *  1. Input validation
 *  2. POST request to /predict (no page reload)
 *  3. Dynamic display of result or error
 */

// ── DOM references ──────────────────────────────────────────────
const btn         = document.getElementById("classifyBtn");
const btnText     = btn.querySelector(".btn-text");
const spinner     = document.getElementById("spinner");
const resultBox   = document.getElementById("resultBox");
const resultIcon  = document.getElementById("resultIcon");
const resultLabel = document.getElementById("resultLabel");
const resultConf  = document.getElementById("resultConfidence");
const resultBreak = document.getElementById("resultBreakdown");
const errorBox    = document.getElementById("errorBox");
const errorMsg    = document.getElementById("errorMessage");

// ── Helpers ─────────────────────────────────────────────────────

function showLoading(on) {
  btn.disabled = on;
  btnText.textContent = on ? "Analysing…" : "Classify Food";
  spinner.hidden = !on;
}

function hideAll() {
  resultBox.hidden = true;
  errorBox.hidden  = true;
  // Remove state classes
  resultBox.classList.remove("healthy", "not-healthy");
}

function showError(message) {
  errorMsg.textContent = message;
  errorBox.hidden = false;
  resultBox.hidden = true;
}

function showResult(data, inputs) {
  const isHealthy = data.prediction.toLowerCase() === "healthy";

  // Icon + label
  resultIcon.textContent  = isHealthy ? "✅" : "🚫";
  resultLabel.textContent = data.prediction;

  // Confidence (if returned by model)
  if (data.confidence !== undefined) {
    resultConf.textContent = `Model confidence: ${data.confidence}%`;
  } else {
    resultConf.textContent = "";
  }

  // Colour theme
  resultBox.classList.add(isHealthy ? "healthy" : "not-healthy");

  // Breakdown chips
  resultBreak.innerHTML = [
    { label: "🔥 Calories", value: `${inputs.calories} kcal` },
    { label: "💪 Protein",  value: `${inputs.protein} g`    },
    { label: "🫧 Fat",      value: `${inputs.fat} g`        },
    { label: "🌾 Carbs",    value: `${inputs.carbs} g`      },
  ].map(chip => `
    <div class="breakdown-chip">
      <span class="chip-label">${chip.label}</span>
      <span class="chip-value">${chip.value}</span>
    </div>
  `).join("");

  resultBox.hidden = false;
  // Smooth scroll to result
  resultBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ── Validate inputs ─────────────────────────────────────────────

function validateInputs(inputs) {
  const errors = [];
  const fields  = ["calories", "protein", "fat", "carbs"];
  const labels  = ["Calories", "Protein", "Fat", "Carbohydrates"];

  fields.forEach((f, i) => {
    const el = document.getElementById(f === "protein" ? "protein" : f);
    el.classList.remove("error-field");

    const val = inputs[f];
    if (val === "" || val === null || val === undefined) {
      errors.push(`${labels[i]} is required.`);
      el.classList.add("error-field");
    } else if (isNaN(val) || Number(val) < 0) {
      errors.push(`${labels[i]} must be a non-negative number.`);
      el.classList.add("error-field");
    }
  });
  return errors;
}

// ── Main classify function ──────────────────────────────────────

async function classify() {
  hideAll();

  // Collect values
  const inputs = {
    calories: document.getElementById("calories").value,
    protein:  document.getElementById("protein").value,
    fat:      document.getElementById("fat").value,
    carbs:    document.getElementById("carbs").value,
  };

  // Client-side validation
  const errors = validateInputs(inputs);
  if (errors.length > 0) {
    showError(errors[0]);   // show first error only for clarity
    return;
  }

  // Convert to numbers for the payload
  const payload = {
    calories: parseFloat(inputs.calories),
    protein:  parseFloat(inputs.protein),
    fat:      parseFloat(inputs.fat),
    carbs:    parseFloat(inputs.carbs),
  };

  // ── Fetch POST to Flask /predict ────────────────────────────
  showLoading(true);

  try {
    const response = await fetch("/predict", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      // Server returned 4xx / 5xx
      showError(data.error || `Server error (${response.status}). Check your Flask console.`);
      return;
    }

    if (data.error) {
      showError(data.error);
      return;
    }

    showResult(data, payload);

  } catch (err) {
    // Network error (Flask not running, CORS, etc.)
    showError(
      "Cannot reach the server. Is Flask running on http://127.0.0.1:5000 ?"
    );
    console.error("Fetch error:", err);
  } finally {
    showLoading(false);
  }
}

// ── Allow Enter key to submit ───────────────────────────────────
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !btn.disabled) classify();
});

// Pastikan semua tersembunyi saat halaman pertama load
["calories","protein","fat","carbs"].forEach(id => {
  document.getElementById(id).addEventListener("input", () => {
    document.getElementById(id).classList.remove("error-field");
    errorBox.hidden = true;
  });
});