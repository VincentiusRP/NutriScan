/**
 * NutriScan — main.js
 */
 
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
 
const FIELDS = [
  { id: "carbohydrate",  label: "Carbohydrate",  unit: "g"  },
  { id: "protein",       label: "Protein",        unit: "g"  },
  { id: "fat_total",     label: "Total Fat",      unit: "g"  },
  { id: "saturated_fat", label: "Saturated Fat",  unit: "g"  },
  { id: "sugar",         label: "Sugar",          unit: "g"  },
  { id: "sodium",        label: "Sodium",         unit: "mg" },
];
 
function showLoading(on) {
  btn.disabled = on;
  btnText.textContent = on ? "Analysing..." : "Classify Food";
  spinner.hidden = !on;
}
 
function hideAll() {
  resultBox.hidden = true;
  errorBox.hidden  = true;
  resultBox.classList.remove("healthy", "not-healthy", "fair");
}
 
function showError(message) {
  errorMsg.textContent = message;
  errorBox.hidden = false;
  resultBox.hidden = true;
}
 
function showResult(data, inputs) {
  const prediction = data.prediction.toLowerCase();
  const isHealthy  = prediction === "healthy";
  const isFair     = prediction === "fair";

  resultIcon.textContent  = isHealthy ? "✅" : isFair ? "⚖️" : "🚫";
  resultLabel.textContent = data.prediction;

  resultConf.textContent = data.confidence !== undefined
    ? `Model confidence: ${data.confidence}%`
    : "";

  if (isHealthy)   resultBox.classList.add("healthy");
  else if (isFair) resultBox.classList.add("fair");
  else             resultBox.classList.add("not-healthy");

  const chips = [
    { label: "Carbs",        value: `${inputs.carbohydrate} g`  },
    { label: "Protein",      value: `${inputs.protein} g`       },
    { label: "Total Fat",    value: `${inputs.fat_total} g`     },
    { label: "Saturated Fat",value: `${inputs.saturated_fat} g` },
    { label: "Sugar",        value: `${inputs.sugar} g`         },
    { label: "Sodium",       value: `${inputs.sodium} mg`       },
  ];

  resultBreak.innerHTML = chips.map(c => `
    <div class="breakdown-chip">
      <span class="chip-label">${c.label}</span>
      <span class="chip-value">${c.value}</span>
    </div>
  `).join("");

  resultBox.hidden = false;
  resultBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
 
function validateInputs(inputs) {
  const errors = [];
  FIELDS.forEach(({ id, label }) => {
    const el = document.getElementById(id);
    el.classList.remove("error-field");
    const val = inputs[id];
    if (val === "" || val === null || val === undefined) {
      errors.push(`${label} is required.`);
      el.classList.add("error-field");
    } else if (isNaN(val) || Number(val) < 0) {
      errors.push(`${label} must be a non-negative number.`);
      el.classList.add("error-field");
    }
  });
  return errors;
}
 
async function classify() {
  hideAll();
 
  const inputs = {};
  FIELDS.forEach(({ id }) => {
    inputs[id] = document.getElementById(id).value;
  });
 
  const errors = validateInputs(inputs);
  if (errors.length > 0) { showError(errors[0]); return; }
 
  const payload = {};
  FIELDS.forEach(({ id }) => { payload[id] = parseFloat(inputs[id]); });
 
  showLoading(true);
 
  try {
    const response = await fetch("/predict", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
 
    const data = await response.json();
 
    if (!response.ok) { showError(data.error || `Server error (${response.status}).`); return; }
    if (data.error)   { showError(data.error); return; }
 
    showResult(data, payload);
 
  } catch (err) {
    showError("Cannot reach the server. Is Flask running?");
    console.error("Fetch error:", err);
  } finally {
    showLoading(false);
  }
}
 
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !btn.disabled) classify();
});
 
FIELDS.forEach(({ id }) => {
  document.getElementById(id).addEventListener("input", () => {
    document.getElementById(id).classList.remove("error-field");
    errorBox.hidden = true;
  });
});