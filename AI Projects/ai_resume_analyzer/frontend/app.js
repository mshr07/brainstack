const API_BASE_URL = "http://127.0.0.1:8000";

const form = document.querySelector("#analysisForm");
const apiStatus = document.querySelector("#apiStatus");
const analyzeButton = document.querySelector("#analyzeButton");

const score = document.querySelector("#score");
const semantic = document.querySelector("#semantic");
const matchedSkills = document.querySelector("#matchedSkills");
const missingSkills = document.querySelector("#missingSkills");
const suggestions = document.querySelector("#suggestions");
const history = document.querySelector("#history");

function renderList(element, values, emptyText) {
  element.innerHTML = "";
  const items = values.length ? values : [emptyText];
  for (const value of items) {
    const li = document.createElement("li");
    li.textContent = value;
    element.appendChild(li);
  }
}

function renderAnalysis(analysis) {
  score.textContent = `${analysis.match_score}%`;
  semantic.textContent = `Semantic: ${analysis.semantic_similarity}`;
  renderList(matchedSkills, analysis.matched_skills, "No matched skills");
  renderList(missingSkills, analysis.missing_skills, "No missing skills");
  renderList(suggestions, analysis.suggestions, "No suggestions");
}

async function loadHistory() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analyses`);
    if (!response.ok) throw new Error("History request failed");
    const analyses = await response.json();
    history.innerHTML = "";

    if (!analyses.length) {
      history.textContent = "No previous analyses yet.";
      return;
    }

    for (const analysis of analyses) {
      const row = document.createElement("div");
      row.className = "history-item";
      row.innerHTML = `
        <span>${analysis.resume_filename}</span>
        <strong>${analysis.match_score}%</strong>
      `;
      row.addEventListener("click", async () => {
        const detailResponse = await fetch(`${API_BASE_URL}/api/analyses/${analysis.id}`);
        if (detailResponse.ok) renderAnalysis(await detailResponse.json());
      });
      history.appendChild(row);
    }
  } catch {
    history.textContent = "History is unavailable.";
  }
}

async function checkApi() {
  try {
    const response = await fetch(`${API_BASE_URL}/`);
    if (!response.ok) throw new Error("API unavailable");
    apiStatus.textContent = "API Online";
    apiStatus.className = "status ok";
  } catch {
    apiStatus.textContent = "API Offline";
    apiStatus.className = "status error";
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  analyzeButton.disabled = true;
  analyzeButton.textContent = "Analyzing...";

  try {
    const formData = new FormData(form);
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: "POST",
      body: formData,
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.detail || "Analysis failed");
    }

    renderAnalysis(payload);
    await loadHistory();
  } catch (error) {
    alert(error.message);
  } finally {
    analyzeButton.disabled = false;
    analyzeButton.textContent = "Analyze Resume";
  }
});

checkApi();
loadHistory();
