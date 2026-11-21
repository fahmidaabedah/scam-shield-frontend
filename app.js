let lang = "bn";
try {
  lang = localStorage.getItem("scamshield_lang") || "bn";
} catch (e) {}

let lastResult = null;

const msgEl = document.getElementById("msg");
const checkBtn = document.getElementById("check");
const resultEl = document.getElementById("result");
const errorEl = document.getElementById("error");
const verdictBadge = document.getElementById("verdict-badge");
const scoreEl = document.getElementById("score");
const typeRow = document.getElementById("type-row");
const whyRow = document.getElementById("why-row");

function applyLang() {
  const t = STRINGS[lang];
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (t[key] !== undefined) el.textContent = t[key];
  });
  msgEl.placeholder = t.placeholder;
  checkBtn.textContent = checkBtn.disabled ? t.checking : t.check;
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
  if (lastResult) render(lastResult);
}

document.querySelectorAll(".lang-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    lang = btn.dataset.lang;
    try {
      localStorage.setItem("scamshield_lang", lang);
    } catch (e) {}
    applyLang();
  });
});

document.querySelectorAll(".chip").forEach((btn) => {
  btn.addEventListener("click", () => {
    const ex = EXAMPLES[lang][btn.dataset.ex];
    msgEl.value = ex || "";
    msgEl.focus();
  });
});

async function check() {
  const message = msgEl.value.trim();
  resultEl.classList.add("hidden");
  errorEl.classList.add("hidden");
  if (!message) return;

  const t = STRINGS[lang];
  checkBtn.disabled = true;
  checkBtn.textContent = t.checking;

  try {
    const res = await fetch(`${window.SCAM_API_BASE}/classify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    lastResult = await res.json();
    render(lastResult);
  } catch (err) {
    errorEl.textContent = t.errorMsg;
    errorEl.classList.remove("hidden");
  } finally {
    checkBtn.disabled = false;
    checkBtn.textContent = t.check;
  }
}

function render(data) {
  const t = STRINGS[lang];
  const isScam = data.verdict === "SCAM";
  verdictBadge.textContent = isScam ? t.scam : t.safe;
  verdictBadge.className = `verdict-badge ${isScam ? "scam" : "safe"}`;
  scoreEl.textContent = `${t.score}: ${Math.round(data.scam_score * 100)}%`;

  const typeLabel = TYPE_LABELS[lang][data.type] || data.type;
  typeRow.innerHTML = isScam
    ? `${t.typePrefix} <b>${typeLabel}</b> (${Math.round(data.probability * 100)}% ${t.confidenceSuffix})`
    : t.noPattern;

  whyRow.innerHTML = "";
  if (data.why && data.why.length) {
    const label = document.createElement("div");
    label.textContent = t.why;
    label.style.marginBottom = "4px";
    whyRow.appendChild(label);
    data.why.forEach((w) => {
      const span = document.createElement("span");
      span.className = "word";
      span.textContent = w;
      whyRow.appendChild(span);
    });
  }

  resultEl.classList.remove("hidden");
}

checkBtn.addEventListener("click", check);
msgEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) check();
});

applyLang();
