const API_BASE_URL = "http://127.0.0.1:8000";
const form = document.querySelector("#form");
const statusText = document.querySelector("#status");
const result = document.querySelector("#result");
const history = document.querySelector("#history");


function listItems(values) {
  return values.map((value) => `<li>${value}</li>`).join("");
}

async function loadHistory() {
  const response = await fetch(`${API_BASE_URL}/api/analyses`);
  const analyses = await response.json();
  history.innerHTML = analyses
    .map(
      (analysis) => `
        <div class="history-row">
          <span>${analysis.resume_filename}</span>
          <strong>${analysis.match_score}%</strong>
        </div>
      `
    )
    .join("");
}

async function checkApi() {
  try {
    const response = await fetch(`${API_BASE_URL}/`);
    if (!response.ok) throw new Error("offline");
    statusText.textContent = "API Online";
  } catch {
    statusText.textContent = "API Offline - start backend on port 8000";
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  result.textContent = "Analyzing...";
  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: "POST",
    body: new FormData(form),
  });
  const payload = await response.json();
  if (!response.ok) {
    result.textContent = payload.detail || "Analysis failed";
    return;
  }
  result.innerHTML = `
    <h2>${payload.match_score}% match</h2>
    <span class="metric">Semantic ${payload.semantic_similarity}</span>
    <span class="metric">Skill ${payload.score_breakdown.skill_match}</span>
    <span class="metric">Experience ${payload.score_breakdown.experience_relevance}</span>
    <h3>Matched Skills</h3>
    <ul>${listItems(payload.matched_skills)}</ul>
    <h3>Missing Skills</h3>
    <ul>${listItems(payload.missing_skills)}</ul>
    <h3>Suggestions</h3>
    <ul>${listItems(payload.suggestions)}</ul>
  `;
  await loadHistory();
});

checkApi();
loadHistory();

